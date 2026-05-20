const SIGNUP_KEY = "q-pending-signup";

export interface PendingSignup {
  handle: string;
  displayName: string;
}

export function savePendingSignup(data: PendingSignup) {
  try {
    sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadPendingSignup(): PendingSignup | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  try {
    sessionStorage.removeItem(SIGNUP_KEY);
  } catch {
    /* ignore */
  }
}
