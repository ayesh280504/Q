//! Minimal Pro DJ Link listener for Rekordbox-enabled CDJs/controllers.
//!
//! Pro DJ Link (a.k.a. "DJ Link" / KUVO protocol) is the UDP protocol Pioneer
//! gear uses to broadcast deck status on the local network. Devices that
//! support it: CDJ-2000nxs2 / CDJ-3000 / XDJ-XZ / XDJ-RX3 / DJM-A9 / V10 /
//! 900NXS2, and the DDJ-1000 / DDJ-1000SRT controllers. Most USB-only DDJs
//! (DDJ-400, FLX4/6/10, REV1/5/7, SX/SX3) do **not** broadcast.
//!
//! We listen *passively* on port 50002 (the CDJ status broadcast port) — we
//! don't announce ourselves as a DJ Link participant, so we won't interfere
//! with the master-tempo handshake or take a player slot.
//!
//! Packet layout (CDJ status, type 0x0a) — reverse-engineered docs at
//! <https://djl-analysis.deepsymmetry.org/djl-analysis/index.html>:
//!
//! | Offset | Field                              |
//! |--------|------------------------------------|
//! | 0x00   | 10-byte magic `Qspt1WmJOL`        |
//! | 0x0a   | packet type (0x0a for CDJ status) |
//! | 0x21   | device number (deck 1-4)           |
//! | 0x2c   | rekordbox track ID (BE u32)        |
//! | 0x37   | currently-playing flag (P_2)       |
//! | 0x89   | sync/master flags                  |
//! | 0x92   | BPM × 100 (BE u16)                 |
//!
//! On every meaningful state change (master deck swapped, or master deck
//! loaded a new track and is playing) we emit a `prolink:now-playing` Tauri
//! event that the frontend matches against the imported rekordbox library.

use serde::Serialize;
use std::net::{Ipv4Addr, SocketAddrV4, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// 10-byte magic at the start of every Pro DJ Link packet.
const PRO_DJ_LINK_MAGIC: &[u8; 10] = b"Qspt1WmJOL";
const STATUS_PORT: u16 = 50002;

#[derive(Debug, Clone, Serialize)]
pub struct ProlinkNowPlaying {
    /// Which deck (1-4) is master and currently playing.
    pub deck: u8,
    /// The Rekordbox track ID — matches `<TRACK TrackID="…">` in rekordbox.xml.
    /// The frontend looks this up against its import index to resolve title /
    /// artist / BPM / key / local file path.
    pub rekordbox_track_id: u32,
    /// Live tempo from the deck (DJ may have pitched the track up/down).
    pub bpm: Option<f32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProlinkStatusUpdate {
    /// "listening" — bound to UDP 50002, no broadcasts yet.
    /// "connected" — at least one CDJ/controller has been seen.
    /// "stopped" — listener thread exited (bind failure or shutdown).
    pub status: &'static str,
    /// Human-readable detail surfaced as a tooltip in the UI.
    pub detail: Option<String>,
}

struct DeckState {
    track_id: u32,
    playing: bool,
    master: bool,
    bpm: Option<f32>,
}

impl Default for DeckState {
    fn default() -> Self {
        Self {
            track_id: 0,
            playing: false,
            master: false,
            bpm: None,
        }
    }
}

fn parse_cdj_status(packet: &[u8]) -> Option<(u8, DeckState)> {
    if packet.len() < 0x94 {
        return None;
    }
    if &packet[0..10] != PRO_DJ_LINK_MAGIC {
        return None;
    }
    if packet[0x0a] != 0x0a {
        // 0x0a = CDJ status. Other types (0x05 mixer, 0x29 beat) we ignore.
        return None;
    }

    let deck = packet[0x21];
    if !(1..=4).contains(&deck) {
        return None;
    }

    let track_id = u32::from_be_bytes([
        packet[0x2c],
        packet[0x2d],
        packet[0x2e],
        packet[0x2f],
    ]);

    // Per dysentery: byte 0x7b is "P1" — an enum of play states, not a
    // bitmask. The "audio is coming out" values are 0x03 (cue play), 0x04
    // (playing), 0x05 (looping), 0x07 (cue-play hold), 0x0e (looping while
    // search-cueing). Anything else (0x00 stopped, 0x06 paused, etc.) means
    // the deck isn't outputting audio right now.
    let playing = matches!(packet[0x7b], 0x03 | 0x04 | 0x05 | 0x07 | 0x0e);

    // Byte 0x89 is the sync/master flag field. Both bit 5 (0x20) and bit 6
    // (0x40) have been observed across CDJ-2000nxs2, CDJ-3000 and XDJ-XZ
    // firmware to indicate "this deck is current master".
    let master = (packet[0x89] & 0x60) != 0;

    let bpm_raw = u16::from_be_bytes([packet[0x92], packet[0x93]]);
    let bpm = if bpm_raw == 0xffff || bpm_raw == 0 {
        None
    } else {
        Some(bpm_raw as f32 / 100.0)
    };

    Some((
        deck,
        DeckState {
            track_id,
            playing,
            master,
            bpm,
        },
    ))
}

/// Picks the deck whose state should drive "now playing":
///  - Prefer the deck flagged as master (Pioneer's own active-deck signal).
///  - Otherwise the most recently updated deck that's actively playing.
fn pick_now_playing(decks: &[Option<DeckState>; 4]) -> Option<(u8, &DeckState)> {
    // Master first.
    for (i, d) in decks.iter().enumerate() {
        if let Some(s) = d {
            if s.master && s.playing && s.track_id != 0 {
                return Some((i as u8 + 1, s));
            }
        }
    }
    // Any playing deck with a loaded track.
    for (i, d) in decks.iter().enumerate() {
        if let Some(s) = d {
            if s.playing && s.track_id != 0 {
                return Some((i as u8 + 1, s));
            }
        }
    }
    None
}

fn listener_loop(app: AppHandle, stop: Arc<AtomicBool>) {
    // SO_REUSEADDR so we can coexist with rekordbox.exe / other DJ Link tools.
    let socket = match UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, STATUS_PORT)) {
        Ok(s) => s,
        Err(e) => {
            let _ = app.emit(
                "prolink:status",
                ProlinkStatusUpdate {
                    status: "stopped",
                    detail: Some(format!(
                        "Couldn't bind UDP {STATUS_PORT}: {e}. Pro DJ Link disabled — manual ▶ still works."
                    )),
                },
            );
            return;
        }
    };
    let _ = socket.set_read_timeout(Some(Duration::from_secs(1)));
    let _ = socket.set_broadcast(true);

    let _ = app.emit(
        "prolink:status",
        ProlinkStatusUpdate {
            status: "listening",
            detail: Some(format!(
                "Listening for Pro DJ Link on UDP {STATUS_PORT}. Connect a CDJ-2000nxs2+, CDJ-3000, XDJ-XZ/RX, DDJ-1000, or DJM-A9/V10 to the same network."
            )),
        },
    );

    let mut buf = [0u8; 2048];
    let mut decks: [Option<DeckState>; 4] = [None, None, None, None];
    let mut last_emit_track: u32 = 0;
    let mut last_emit_deck: u8 = 0;
    let mut seen_any_broadcast = false;

    while !stop.load(Ordering::Relaxed) {
        let n = match socket.recv_from(&mut buf) {
            Ok((n, _)) => n,
            Err(_) => continue, // timeout / transient error, just loop again
        };

        if let Some((deck, state)) = parse_cdj_status(&buf[..n]) {
            if !seen_any_broadcast {
                seen_any_broadcast = true;
                let _ = app.emit(
                    "prolink:status",
                    ProlinkStatusUpdate {
                        status: "connected",
                        detail: Some(format!("Connected — deck {deck} reporting in.")),
                    },
                );
            }
            let idx = (deck - 1) as usize;
            decks[idx] = Some(state);

            if let Some((master_deck, np)) = pick_now_playing(&decks) {
                if np.track_id != last_emit_track || master_deck != last_emit_deck {
                    last_emit_track = np.track_id;
                    last_emit_deck = master_deck;
                    let _ = app.emit(
                        "prolink:now-playing",
                        ProlinkNowPlaying {
                            deck: master_deck,
                            rekordbox_track_id: np.track_id,
                            bpm: np.bpm,
                        },
                    );
                }
            }
        }
    }
}

/// Held in Tauri's state container so the listener thread keeps running for
/// the app's lifetime. `stop` is plumbed through but unused today (the
/// thread terminates with the process); kept for future cleanup paths.
pub struct ProlinkHandle {
    #[allow(dead_code)]
    stop: Arc<AtomicBool>,
}

impl ProlinkHandle {
    #[allow(dead_code)]
    pub fn stop(&self) {
        self.stop.store(true, Ordering::Relaxed);
    }
}

/// Spawns the listener thread. Idempotent — call once from `setup`.
pub fn spawn_listener(app: &AppHandle) -> ProlinkHandle {
    let stop = Arc::new(AtomicBool::new(false));
    let stop_clone = stop.clone();
    let app_clone = app.clone();
    std::thread::Builder::new()
        .name("q-prolink-listener".into())
        .spawn(move || listener_loop(app_clone, stop_clone))
        .expect("failed to spawn Pro DJ Link listener thread");
    ProlinkHandle { stop }
}

#[tauri::command]
pub fn prolink_request_status(app: AppHandle) {
    // Frontend can ping this on mount to re-receive the last status. We
    // simply re-emit a generic "listening" event; the actual most-recent
    // status is held by the OS network stack (next received packet will
    // upgrade us to "connected" again).
    let _ = app.emit(
        "prolink:status",
        ProlinkStatusUpdate {
            status: "listening",
            detail: Some("Re-checking Pro DJ Link…".to_string()),
        },
    );
}

/// Wires the listener into the Tauri builder. Call from `run()` after
/// `.invoke_handler(...)`.
pub fn install(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder.setup(|app| {
        let handle = app.handle().clone();
        let prolink = spawn_listener(&handle);
        app.manage(prolink);
        Ok(())
    })
}
