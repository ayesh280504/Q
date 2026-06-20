/** Q BLE proximity — DJ laptop advertises session code; guests scan to join. */

/** Custom GATT service UUID for filtering (also encoded in local name `Q-CODE`). */
export const Q_BLE_SERVICE_UUID = "71a9b420-0000-4000-8000-000000000001";

/** Manufacturer company ID — 0x0710 ("Q" + v0). Payload: 6-byte ASCII session code. */
export const Q_BLE_MANUFACTURER_ID = 0x0710;

export const Q_BLE_LOCAL_NAME_PREFIX = "Q-";

const SESSION_CODE_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

export function formatBleLocalName(sessionCode: string): string {
  return `${Q_BLE_LOCAL_NAME_PREFIX}${sessionCode.trim().toUpperCase()}`;
}

export function parseSessionCodeFromBleLocalName(localName: string): string | null {
  const trimmed = localName.trim();
  if (!trimmed.toUpperCase().startsWith(Q_BLE_LOCAL_NAME_PREFIX)) return null;
  const code = trimmed.slice(Q_BLE_LOCAL_NAME_PREFIX.length, Q_BLE_LOCAL_NAME_PREFIX.length + 6).toUpperCase();
  return SESSION_CODE_RE.test(code) ? code : null;
}

/** Parse 6-char code from manufacturer data (with optional 0x0710 company prefix). */
export function parseSessionCodeFromManufacturerData(bytes: ArrayLike<number>): string | null {
  const arr = Array.from(bytes);
  let start = 0;
  if (arr.length >= 8 && arr[0] === 0x10 && arr[1] === 0x07) {
    start = 2;
  }
  if (arr.length - start < 6) return null;
  const code = String.fromCharCode(
    arr[start],
    arr[start + 1],
    arr[start + 2],
    arr[start + 3],
    arr[start + 4],
    arr[start + 5],
  ).toUpperCase();
  return SESSION_CODE_RE.test(code) ? code : null;
}

export type NearbyBoothHit = {
  code: string;
  localName?: string;
  rssi?: number;
  seenAt: number;
};
