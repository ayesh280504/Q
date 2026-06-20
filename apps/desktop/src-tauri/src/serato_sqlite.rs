use rusqlite::{Connection, OpenFlags};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize, Clone)]
pub struct SeratoSqliteTrack {
    pub title: String,
    pub artist: String,
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub played_at: i64,
    pub is_playing: bool,
}

#[derive(Serialize)]
pub struct SeratoSqliteHistory {
    pub session_id: i64,
    pub now_playing: Option<SeratoSqliteTrack>,
    pub entries: Vec<SeratoSqliteTrack>,
}

fn master_sqlite_path() -> Option<PathBuf> {
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        let p = PathBuf::from(&local)
            .join("Serato")
            .join("Library")
            .join("master.sqlite");
        if p.is_file() {
            return Some(p);
        }
    }

    if let Ok(home) = std::env::var("HOME") {
        let p = PathBuf::from(&home)
            .join("Library")
            .join("Application Support")
            .join("Serato")
            .join("Library")
            .join("master.sqlite");
        if p.is_file() {
            return Some(p);
        }
    }

    None
}

fn open_readonly(path: &PathBuf) -> Option<Connection> {
    let flags = OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX;
    Connection::open_with_flags(path, flags).ok()
}

fn row_to_track(
    name: String,
    artist: String,
    bpm: Option<f64>,
    key: String,
    start_time: i64,
    end_time: i64,
) -> SeratoSqliteTrack {
    SeratoSqliteTrack {
        title: name,
        artist,
        bpm,
        key: if key.trim().is_empty() {
            None
        } else {
            Some(key)
        },
        played_at: start_time,
        is_playing: end_time == -1,
    }
}

/// Live Serato history from `master.sqlite` (Serato DJ Pro 3.x+).
/// Legacy `.session` files under `_Serato_/History/Sessions/` may stop updating
/// while this database keeps receiving plays.
#[tauri::command]
pub fn get_serato_sqlite_history() -> Option<SeratoSqliteHistory> {
    let path = master_sqlite_path()?;
    let conn = open_readonly(&path)?;

    let session_id: i64 = conn
        .query_row(
            "SELECT id FROM history_session WHERE end_time = -1 ORDER BY start_time DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .or_else(|_| {
            conn.query_row(
                "SELECT id FROM history_session ORDER BY start_time DESC LIMIT 1",
                [],
                |r| r.get(0),
            )
        })
        .ok()?;

    let mut stmt = conn
        .prepare(
            "SELECT name, artist, bpm, key, start_time, end_time
             FROM history_entry
             WHERE session_id = ?1
             ORDER BY start_time ASC",
        )
        .ok()?;

    let entries: Vec<SeratoSqliteTrack> = stmt
        .query_map([session_id], |row| {
            Ok(row_to_track(
                row.get(0)?,
                row.get(1)?,
                row.get(2).ok(),
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
            ))
        })
        .ok()?
        .filter_map(|r| r.ok())
        .collect();

    if entries.is_empty() {
        return None;
    }

    let now_playing = entries
        .iter()
        .find(|t| t.is_playing)
        .cloned()
        .or_else(|| entries.last().cloned());

    Some(SeratoSqliteHistory {
        session_id,
        now_playing,
        entries,
    })
}
