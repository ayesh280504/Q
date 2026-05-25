/**
 * Pro DJ Link integration — Rekordbox's live "now playing" path.
 *
 * The Rust side listens to UDP 50002 (CDJ status broadcasts from any Pioneer
 * gear that speaks Pro DJ Link: CDJ-2000nxs2+/3000, XDJ-XZ/RX, DDJ-1000/1000SRT,
 * DJM-A9/V10/900NXS2). When the master deck changes track, it emits
 * `prolink:now-playing` with the rekordbox `TrackID`. We resolve that ID
 * against the import index to get title / artist / BPM / key.
 *
 * Most USB-only DDJs (DDJ-400, FLX series, REV series, SX series) do NOT
 * broadcast on the network, so this hook stays quiet for those rigs and the
 * time-based auto-advance fallback (in `useQueueAutoAdvance`) takes over.
 */

import { useEffect, useRef } from "react";
import type { TrackRecord } from "@q/shared";
import type { NowPlaying } from "../lib/trackMatch";

export type ProlinkStatus = "idle" | "listening" | "connected" | "stopped";

interface ProlinkNowPlayingEvent {
  deck: number;
  rekordbox_track_id: number;
  bpm: number | null;
}

interface ProlinkStatusEvent {
  status: ProlinkStatus;
  detail: string | null;
}

interface UseProlinkPlaybackOptions {
  enabled: boolean;
  /** externalId → full track record. Built by App.tsx after each library import. */
  importIndex: Map<string, TrackRecord>;
  onNowPlaying: (track: NowPlaying | null) => void;
  onStatus?: (status: ProlinkStatus, detail?: string) => void;
}

export function useProlinkPlayback({
  enabled,
  importIndex,
  onNowPlaying,
  onStatus,
}: UseProlinkPlaybackOptions) {
  const onNowPlayingRef = useRef(onNowPlaying);
  const onStatusRef = useRef(onStatus);
  const importIndexRef = useRef(importIndex);
  onNowPlayingRef.current = onNowPlaying;
  onStatusRef.current = onStatus;
  importIndexRef.current = importIndex;

  const lastTrackIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      onStatusRef.current?.("idle");
      return;
    }

    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    void (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");

        const unNp = await listen<ProlinkNowPlayingEvent>("prolink:now-playing", (ev) => {
          const id = ev.payload.rekordbox_track_id;
          if (!id || id === lastTrackIdRef.current) return;
          lastTrackIdRef.current = id;
          // Pioneer broadcasts the rekordbox TrackID, which matches the
          // `externalId` we stored during XML import.
          const match = importIndexRef.current.get(String(id));
          if (!match) {
            // CDJ is playing a track that isn't in this gig's imported scope
            // (filtered out by crate selection or privacy filters). Surface
            // BPM only so the DJ still sees deck tempo on the overlay.
            onNowPlayingRef.current({
              title: "(off-library track)",
              artist: "Pro DJ Link",
              bpm: ev.payload.bpm ?? undefined,
              key: undefined,
              playedAt: Date.now(),
            });
            return;
          }
          onNowPlayingRef.current({
            title: match.title,
            artist: match.artist,
            // Prefer live tempo from the deck (DJ may have pitched it) over the
            // static BPM stored in the rekordbox library.
            bpm: ev.payload.bpm ?? match.bpm,
            key: match.key,
            playedAt: Date.now(),
          });
        });
        if (cancelled) {
          unNp();
          return;
        }
        unlisteners.push(unNp);

        const unStatus = await listen<ProlinkStatusEvent>("prolink:status", (ev) => {
          onStatusRef.current?.(ev.payload.status, ev.payload.detail ?? undefined);
        });
        if (cancelled) {
          unStatus();
          return;
        }
        unlisteners.push(unStatus);

        // Re-emit the current listener status so the UI populates immediately.
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("prolink_request_status");
        } catch {
          /* browser dev build — invoke not available */
        }
      } catch {
        onStatusRef.current?.("stopped", "Pro DJ Link unavailable in this build.");
      }
    })();

    return () => {
      cancelled = true;
      for (const u of unlisteners) u();
      lastTrackIdRef.current = null;
    };
  }, [enabled]);
}
