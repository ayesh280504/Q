use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_crate_files(dir: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut files: Vec<String> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|ext| ext == "crate"))
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    files.sort();
    Ok(files)
}

#[tauri::command]
fn detect_serato_subcrates() -> Option<String> {
    serato_subcrates_candidates()
        .into_iter()
        .find(|p| p.is_dir())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn detect_rekordbox_xml() -> Option<String> {
    let candidates = rekordbox_candidates();
    candidates
        .into_iter()
        .find(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string())
}

fn rekordbox_candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(appdata) = std::env::var("APPDATA") {
        let base = PathBuf::from(&appdata).join("Pioneer").join("rekordbox");
        paths.push(base.join("rekordbox.xml"));
        paths.push(base.join("share.xml"));
    }

    if let Ok(home) = std::env::var("HOME") {
        let base = PathBuf::from(&home)
            .join("Library")
            .join("Pioneer")
            .join("rekordbox");
        paths.push(base.join("rekordbox.xml"));
        paths.push(base.join("share.xml"));
    }

    paths
}

fn serato_history_sessions_dir() -> Option<PathBuf> {
    serato_history_sessions_candidates()
        .into_iter()
        .find(|p| p.is_dir())
}

fn serato_history_sessions_candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(profile) = std::env::var("USERPROFILE") {
        paths.push(
            PathBuf::from(&profile)
                .join("Music")
                .join("_Serato_")
                .join("History")
                .join("Sessions"),
        );
    }

    if let Ok(home) = std::env::var("HOME") {
        paths.push(
            PathBuf::from(&home)
                .join("Music")
                .join("_Serato_")
                .join("History")
                .join("Sessions"),
        );
    }

    paths
}

/// First non-loopback IPv4 for QR codes (phone on same Wi‑Fi).
#[tauri::command]
fn get_lan_ipv4() -> Option<String> {
    use std::net::UdpSocket;
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let ip = socket.local_addr().ok()?.ip();
    if ip.is_loopback() || !ip.is_ipv4() {
        return None;
    }
    Some(ip.to_string())
}

fn serato_session_files_newest_first() -> Vec<PathBuf> {
    let Some(dir) = serato_history_sessions_dir() else {
        return Vec::new();
    };
    let mut files: Vec<(std::time::SystemTime, PathBuf)> = Vec::new();
    let entries = match fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return Vec::new(),
    };
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("session") {
            continue;
        }
        if let Ok(modified) = entry.metadata().and_then(|m| m.modified()) {
            files.push((modified, path));
        }
    }
    files.sort_by(|a, b| b.0.cmp(&a.0));
    files.into_iter().map(|(_, p)| p).collect()
}

/// Paths to recent Serato history `.session` files (newest first).
#[tauri::command]
fn list_serato_recent_sessions(limit: Option<usize>) -> Vec<String> {
    let take = limit.unwrap_or(3).min(10);
    serato_session_files_newest_first()
        .into_iter()
        .take(take)
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}

/// Latest Serato history session bytes (most recently modified .session file).
#[tauri::command]
fn get_serato_latest_session() -> Option<Vec<u8>> {
    let path = serato_session_files_newest_first().into_iter().next()?;
    fs::read(&path).ok()
}

fn serato_subcrates_candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(profile) = std::env::var("USERPROFILE") {
        paths.push(
            PathBuf::from(&profile)
                .join("Music")
                .join("_Serato_")
                .join("Subcrates"),
        );
    }

    if let Ok(home) = std::env::var("HOME") {
        paths.push(
            PathBuf::from(&home)
                .join("Music")
                .join("_Serato_")
                .join("Subcrates"),
        );
    }

    paths
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            read_binary_file,
            list_crate_files,
            detect_rekordbox_xml,
            detect_serato_subcrates,
            get_serato_latest_session,
            list_serato_recent_sessions,
            get_lan_ipv4,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Q");
}
