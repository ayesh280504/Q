import { followDj } from "./accountApi";

const KEY = "q-pending-follow";

export function savePendingFollow(handle: string) {
  const normalized = handle.trim().toLowerCase();
  if (!normalized) return;
  try {
    sessionStorage.setItem(KEY, normalized);
  } catch {
    /* ignore */
  }
}

export function peekPendingFollow(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingFollow() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Follow a DJ saved from crowd conversion, then clear the pending handle. */
export async function consumePendingFollow(): Promise<string | null> {
  const handle = peekPendingFollow();
  if (!handle) return null;
  try {
    await followDj(handle);
    clearPendingFollow();
    return handle;
  } catch {
    return null;
  }
}
