import { randomId } from "./uuid";

const STORAGE_KEY = "q-guest-id";

/** Stable anonymous id per browser — used for per-guest request limits. */
export function getGuestId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}
