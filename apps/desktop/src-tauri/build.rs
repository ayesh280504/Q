fn main() {
    #[cfg(target_os = "macos")]
    compile_macos_ble();
    tauri_build::build()
}

#[cfg(target_os = "macos")]
fn compile_macos_ble() {
    use std::env;
    use std::path::PathBuf;
    use std::process::Command;

    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let swift_src = manifest_dir.join("native/macos/ble_beacon.swift");
    let out_dir = env::var("OUT_DIR").unwrap();
    let obj = format!("{out_dir}/ble_beacon.o");
    let lib = format!("{out_dir}/libble_beacon.a");

    let swiftc = Command::new("swiftc")
        .args(["-c", swift_src.to_str().unwrap(), "-o", &obj])
        .status()
        .expect("failed to run swiftc — macOS BLE beacon requires Xcode CLI tools");

    if !swiftc.success() {
        panic!("swiftc failed to compile ble_beacon.swift");
    }

    let ar = Command::new("ar")
        .args(["rcs", &lib, &obj])
        .status()
        .expect("failed to run ar");

    if !ar.success() {
        panic!("ar failed to build libble_beacon.a");
    }

    println!("cargo:rustc-link-lib=static=ble_beacon");
    println!("cargo:rustc-link-search=native={out_dir}");
    println!("cargo:rustc-link-lib=framework=CoreBluetooth");
    println!("cargo:rustc-link-lib=framework=Foundation");
}
