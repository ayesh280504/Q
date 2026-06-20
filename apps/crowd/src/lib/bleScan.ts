import {
  parseSessionCodeFromBleLocalName,
  parseSessionCodeFromManufacturerData,
  Q_BLE_MANUFACTURER_ID,
  type NearbyBoothHit,
} from "@q/shared";

/** Web Bluetooth LE Scan API (Chrome Android, desktop Chrome — not iOS Safari). */
export function bleScanSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  const bt = navigator.bluetooth as Bluetooth & {
    requestLEScan?: (options: RequestLEScanOptions) => Promise<BluetoothLEScan>;
  };
  return typeof bt?.requestLEScan === "function";
}

type ScanOptions = {
  onHit: (hit: NearbyBoothHit) => void;
  signal: AbortSignal;
};

export async function scanNearbyBooths({ onHit, signal }: ScanOptions): Promise<() => void> {
  const bt = navigator.bluetooth as Bluetooth & {
    requestLEScan: (options: RequestLEScanOptions) => Promise<BluetoothLEScan>;
  };

  const seen = new Set<string>();

  const onAdvertisement = (event: BluetoothAdvertisingEvent) => {
    let code: string | null = null;

    if (event.localName) {
      code = parseSessionCodeFromBleLocalName(event.localName);
    }

    if (!code && event.manufacturerData) {
      for (const [id, dataView] of event.manufacturerData.entries()) {
        if (id !== Q_BLE_MANUFACTURER_ID) continue;
        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        code = parseSessionCodeFromManufacturerData(bytes);
        if (code) break;
      }
    }

    if (!code || seen.has(code)) return;
    seen.add(code);
    onHit({
      code,
      localName: event.localName ?? undefined,
      rssi: event.rssi,
      seenAt: Date.now(),
    });
  };

  bt.addEventListener("advertisementreceived", onAdvertisement);

  const scan = await bt.requestLEScan({
    acceptAllAdvertisements: true,
    keepRepeatedDevices: false,
  });

  const stop = () => {
    bt.removeEventListener("advertisementreceived", onAdvertisement);
    try {
      scan.stop();
    } catch {
      /* already stopped */
    }
  };

  signal.addEventListener("abort", stop, { once: true });

  return stop;
}
