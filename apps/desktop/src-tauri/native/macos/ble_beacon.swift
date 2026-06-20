import CoreBluetooth
import Foundation

private final class QBleDelegate: NSObject, CBPeripheralManagerDelegate {
    var pendingCode: String?

    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        guard peripheral.state == .poweredOn, let code = pendingCode else { return }
        q_advertise(code: code, on: peripheral)
    }
}

private let qDelegate = QBleDelegate()
private var qManager: CBPeripheralManager?

private func q_advertise(code: String, on pm: CBPeripheralManager) {
    pm.stopAdvertising()
    let name = "Q-\(code)"
    var mfg = Data([0x10, 0x07])
    mfg.append(contentsOf: Array(code.utf8))
    pm.startAdvertising([
        CBAdvertisementDataLocalNameKey: name,
        CBAdvertisementDataManufacturerDataKey: mfg,
    ])
}

@_cdecl("q_ble_beacon_start")
public func q_ble_beacon_start(_ code: UnsafePointer<CChar>?) -> Int32 {
    guard let code = code else { return -1 }
    let sessionCode = String(cString: code).trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    guard sessionCode.count == 6 else { return -2 }
    qDelegate.pendingCode = sessionCode
    if Thread.isMainThread {
        if qManager == nil {
            qManager = CBPeripheralManager(delegate: qDelegate, queue: nil)
        } else if qManager?.state == .poweredOn {
            q_advertise(code: sessionCode, on: qManager!)
        }
    } else {
        DispatchQueue.main.sync {
            if qManager == nil {
                qManager = CBPeripheralManager(delegate: qDelegate, queue: nil)
            } else if qManager?.state == .poweredOn {
                q_advertise(code: sessionCode, on: qManager!)
            }
        }
    }
    return 0
}

@_cdecl("q_ble_beacon_stop")
public func q_ble_beacon_stop() -> Int32 {
    let block = {
        qManager?.stopAdvertising()
        qDelegate.pendingCode = nil
    }
    if Thread.isMainThread {
        block()
    } else {
        DispatchQueue.main.sync(execute: block)
    }
    return 0
}

@_cdecl("q_ble_beacon_active_code")
public func q_ble_beacon_active_code() -> UnsafePointer<CChar>? {
    guard let code = qDelegate.pendingCode else { return nil }
    return (code as NSString).utf8String
}
