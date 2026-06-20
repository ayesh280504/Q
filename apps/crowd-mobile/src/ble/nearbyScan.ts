import {
  parseSessionCodeFromBleLocalName,
  parseSessionCodeFromManufacturerData,
  type NearbyBoothHit,
} from "@q/shared";
import { BleManager, type Device } from "react-native-ble-plx";

const manager = new BleManager();

function decodeManufacturer(device: Device): string | null {
  const raw = device.manufacturerData;
  if (!raw) return null;
  try {
    const binary = atob(raw);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return parseSessionCodeFromManufacturerData(bytes);
  } catch {
    return null;
  }
}

function hitFromDevice(device: Device): NearbyBoothHit | null {
  const name = device.localName ?? device.name ?? "";
  let code = parseSessionCodeFromBleLocalName(name);
  if (!code) code = decodeManufacturer(device);
  if (!code) return null;
  return {
    code,
    localName: name || undefined,
    rssi: device.rssi ?? undefined,
    seenAt: Date.now(),
  };
}

export type NearbyScanHandle = {
  stop: () => void;
};

export async function startNearbyScan(onHit: (hit: NearbyBoothHit) => void): Promise<NearbyScanHandle> {
  const seen = new Set<string>();

  await manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
    if (error || !device) return;
    const hit = hitFromDevice(device);
    if (!hit || seen.has(hit.code)) return;
    seen.add(hit.code);
    onHit(hit);
  });

  return {
    stop: () => {
      manager.stopDeviceScan().catch(() => {});
    },
  };
}

export function crowdRequestUrl(code: string): string {
  const base = (process.env.EXPO_PUBLIC_Q_CROWD_URL ?? "https://q-crowd.vercel.app").replace(/\/$/, "");
  return `${base}/r/${code.trim().toUpperCase()}`;
}

export { manager as bleManager };
