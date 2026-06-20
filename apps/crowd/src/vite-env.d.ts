/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Q_API_URL?: string;
  readonly VITE_Q_WEB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Web Bluetooth LE Scan (Chrome Android / desktop — experimental). */
interface BluetoothLEScan {
  stop(): void;
}

interface RequestLEScanOptions {
  acceptAllAdvertisements?: boolean;
  keepRepeatedDevices?: boolean;
  filters?: BluetoothLEScanFilter[];
}

interface BluetoothAdvertisingEvent extends Event {
  device: BluetoothDevice;
  localName?: string;
  rssi?: number;
  manufacturerData?: Map<number, DataView>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}

interface Bluetooth {
  requestLEScan?(options: RequestLEScanOptions): Promise<BluetoothLEScan>;
  addEventListener(
    type: "advertisementreceived",
    listener: (event: BluetoothAdvertisingEvent) => void,
  ): void;
  removeEventListener(
    type: "advertisementreceived",
    listener: (event: BluetoothAdvertisingEvent) => void,
  ): void;
}
