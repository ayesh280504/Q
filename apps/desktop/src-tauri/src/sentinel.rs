use serde::Serialize;

#[derive(Serialize)]
pub struct DjSoftwareStatus {
    pub serato: bool,
    pub rekordbox: bool,
    pub any_running: bool,
}

#[cfg(target_os = "windows")]
fn detect_processes() -> (bool, bool) {
    use std::os::windows::process::CommandExt;

    // Without this, each tasklist spawn flashes a visible cmd window on Windows GUI apps.
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    let output = std::process::Command::new("tasklist")
        .args(["/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

    match output {
        Ok(o) => {
            let text = String::from_utf8_lossy(&o.stdout).to_ascii_lowercase();
            let serato = text.contains("serato dj pro.exe");
            let rekordbox = text.contains("rekordbox.exe");
            (serato, rekordbox)
        }
        Err(_) => (false, false),
    }
}

#[cfg(not(target_os = "windows"))]
fn detect_processes() -> (bool, bool) {
    (false, false)
}

/// Poll whether Serato or Rekordbox is running (Windows tasklist, no console flash).
#[tauri::command]
pub fn detect_dj_software_running() -> DjSoftwareStatus {
    let (serato, rekordbox) = detect_processes();
    DjSoftwareStatus {
        serato,
        rekordbox,
        any_running: serato || rekordbox,
    }
}
