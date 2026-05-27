use serde::Serialize;

#[derive(Serialize)]
pub struct DjSoftwareStatus {
    pub serato: bool,
    pub rekordbox: bool,
    pub any_running: bool,
}

#[cfg(target_os = "windows")]
fn process_running(image_name: &str) -> bool {
    let output = std::process::Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {image_name}"), "/NH"])
        .output();
    match output {
        Ok(o) => {
            let text = String::from_utf8_lossy(&o.stdout);
            text.to_ascii_lowercase().contains(&image_name.to_ascii_lowercase())
        }
        Err(_) => false,
    }
}

#[cfg(not(target_os = "windows"))]
fn process_running(_image_name: &str) -> bool {
    false
}

/// Poll whether Serato or Rekordbox is running (Windows tasklist).
#[tauri::command]
pub fn detect_dj_software_running() -> DjSoftwareStatus {
    let serato = process_running("Serato DJ Pro.exe") || process_running("serato dj pro.exe");
    let rekordbox = process_running("rekordbox.exe");
    DjSoftwareStatus {
        serato,
        rekordbox,
        any_running: serato || rekordbox,
    }
}
