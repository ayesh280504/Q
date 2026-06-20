//! BLE proximity beacon — advertises `Q-XXXXXX` while a gig is live.

use std::sync::Mutex;

static ACTIVE_CODE: Mutex<Option<String>> = Mutex::new(None);

#[cfg(windows)]
mod windows;
#[cfg(target_os = "macos")]
mod macos;

#[cfg(windows)]
use windows as platform;
#[cfg(target_os = "macos")]
use macos as platform;

#[cfg(not(any(windows, target_os = "macos")))]
mod platform {
    pub fn start(_session_code: &str) -> Result<(), String> {
        Err("BLE proximity beacon requires Windows or macOS.".into())
    }
    pub fn stop_internal() -> Result<(), String> {
        Ok(())
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
use platform;

pub(crate) fn validate_code(code: &str) -> Result<(), String> {
    if code.len() != 6 {
        return Err("Session code must be 6 characters.".into());
    }
    if !code.chars().all(|c| {
        c.is_ascii_uppercase() && c != 'I' && c != 'L' && c != 'O' && c != '0' && c != '1'
    }) {
        return Err("Invalid session code characters.".into());
    }
    Ok(())
}

#[tauri::command]
pub fn start_ble_beacon(session_code: String) -> Result<(), String> {
    platform::start(&session_code)
}

#[tauri::command]
pub fn stop_ble_beacon() -> Result<(), String> {
    platform::stop_internal()
}

#[tauri::command]
pub fn ble_beacon_status() -> Option<String> {
    ACTIVE_CODE.lock().ok()?.clone()
}

pub fn set_active_code(code: Option<String>) {
    if let Ok(mut guard) = ACTIVE_CODE.lock() {
        *guard = code;
    }
}
