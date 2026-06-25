import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { LanGigHandoff, LanPairingInfo } from "@q/shared";

export function isTauriDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function initLanHandoff(crowdBaseUrl: string): Promise<LanPairingInfo | null> {
  if (!isTauriDesktop()) return null;
  try {
    return await invoke<LanPairingInfo>("start_lan_handoff", { crowdBaseUrl });
  } catch {
    return null;
  }
}

export async function fetchLanPairingInfo(): Promise<LanPairingInfo | null> {
  if (!isTauriDesktop()) return null;
  try {
    return await invoke<LanPairingInfo>("get_lan_pairing_info");
  } catch {
    return null;
  }
}

export function subscribeGigHandoff(handler: (payload: LanGigHandoff) => void): () => void {
  if (!isTauriDesktop()) return () => {};
  let disposed = false;
  let unlisten: (() => void) | undefined;

  void listen<LanGigHandoff>("gig-handoff", (event) => {
    if (!disposed) handler(event.payload);
  }).then((fn) => {
    unlisten = fn;
    if (disposed) fn();
  });

  return () => {
    disposed = true;
    unlisten?.();
  };
}
