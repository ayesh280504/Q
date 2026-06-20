use super::{set_active_code, validate_code};
use std::sync::Mutex;
use windows::core::HSTRING;
use windows::Devices::Bluetooth::Advertisement::{
    BluetoothLEAdvertisementPublisher, BluetoothLEManufacturerData,
};
use windows::Storage::Streams::DataWriter;

static PUBLISHER: Mutex<Option<BluetoothLEAdvertisementPublisher>> = Mutex::new(None);

pub fn start(session_code: &str) -> Result<(), String> {
    let code = session_code.trim().to_uppercase();
    validate_code(&code)?;
    stop_internal()?;

    let publisher =
        BluetoothLEAdvertisementPublisher::new().map_err(|e| format!("BLE publisher: {e}"))?;

    let advertisement = publisher
        .Advertisement()
        .map_err(|e| format!("BLE advertisement: {e}"))?;

    let local_name = format!("Q-{code}");
    advertisement
        .SetLocalName(&HSTRING::from(local_name))
        .map_err(|e| format!("BLE local name: {e}"))?;

    let writer = DataWriter::new().map_err(|e| format!("BLE data writer: {e}"))?;
    writer
        .WriteBytes(code.as_bytes())
        .map_err(|e| format!("BLE payload: {e}"))?;
    let buffer = writer
        .DetachBuffer()
        .map_err(|e| format!("BLE buffer: {e}"))?;

    let mfg = BluetoothLEManufacturerData::Create(0x0710, &buffer)
        .map_err(|e| format!("BLE manufacturer data: {e}"))?;

    advertisement
        .ManufacturerData()
        .map_err(|e| format!("BLE manufacturer list: {e}"))?
        .Append(&mfg)
        .map_err(|e| format!("BLE append manufacturer: {e}"))?;

    publisher
        .Start()
        .map_err(|e| format!("BLE start (enable Bluetooth in Windows Settings): {e}"))?;

    *PUBLISHER.lock().map_err(|_| "BLE lock poisoned".to_string())? = Some(publisher);
    set_active_code(Some(code));
    Ok(())
}

pub fn stop_internal() -> Result<(), String> {
    let mut guard = PUBLISHER
        .lock()
        .map_err(|_| "BLE lock poisoned".to_string())?;
    if let Some(publisher) = guard.take() {
        let _ = publisher.Stop();
    }
    set_active_code(None);
    Ok(())
}
