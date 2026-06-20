use super::{set_active_code, validate_code};
use std::ffi::CString;

extern "C" {
    fn q_ble_beacon_start(code: *const std::os::raw::c_char) -> i32;
    fn q_ble_beacon_stop() -> i32;
}

pub fn start(session_code: &str) -> Result<(), String> {
    let code = session_code.trim().to_uppercase();
    validate_code(&code)?;
    stop_internal()?;
    let c = CString::new(code.as_str()).map_err(|e| e.to_string())?;
    let rc = unsafe { q_ble_beacon_start(c.as_ptr()) };
    match rc {
        0 => {
            set_active_code(Some(code));
            Ok(())
        }
        -2 => Err("Session code must be 6 characters.".into()),
        _ => Err(
            "BLE start failed — enable Bluetooth in System Settings and allow Q to use Bluetooth."
                .into(),
        ),
    }
}

pub fn stop_internal() -> Result<(), String> {
    unsafe {
        q_ble_beacon_stop();
    }
    set_active_code(None);
    Ok(())
}
