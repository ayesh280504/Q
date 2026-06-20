import { invoke } from "@tauri-apps/api/core";

export type BleBeaconState = "off" | "on" | "unsupported" | "error";

export async function startBleBeacon(sessionCode: string): Promise<{ ok: boolean; error?: string }> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return { ok: false, error: "BLE beacon requires the desktop app." };
  }
  try {
    await invoke("start_ble_beacon", { sessionCode });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function stopBleBeacon(): Promise<void> {
  if (!("__TAURI_INTERNALS__" in window)) return;
  try {
    await invoke("stop_ble_beacon");
  } catch {
    /* already stopped */
  }
}

export async function fetchBleBeaconStatus(): Promise<string | null> {
  if (!("__TAURI_INTERNALS__" in window)) return null;
  try {
    return await invoke<string | null>("ble_beacon_status");
  } catch {
    return null;
  }
}

export function classifyBleError(error?: string): BleBeaconState {
  if (!error) return "error";
  if (/windows-only|mac/i.test(error)) return "unsupported";
  return "error";
}
