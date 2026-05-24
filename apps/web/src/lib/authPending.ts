import type { Session } from "@supabase/supabase-js";

const SIGNUP_KEY = "q-pending-signup";

export interface PendingSignup {
  handle: string;
}

export function savePendingSignup(data: PendingSignup) {
  const payload = JSON.stringify({ handle: data.handle.trim() });
  try {
    localStorage.setItem(SIGNUP_KEY, payload);
    sessionStorage.setItem(SIGNUP_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function loadPendingSignup(): PendingSignup | null {
  try {
    const raw = localStorage.getItem(SIGNUP_KEY) ?? sessionStorage.getItem(SIGNUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { handle?: string };
    if (!parsed?.handle?.trim()) return null;
    return { handle: parsed.handle.trim() };
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  try {
    localStorage.removeItem(SIGNUP_KEY);
    sessionStorage.removeItem(SIGNUP_KEY);
  } catch {
    /* ignore */
  }
}

/** Username chosen at register — pending storage or Supabase user_metadata. */
export function getSignupHandle(session?: Session | null): string | null {
  const pending = loadPendingSignup();
  if (pending?.handle) return pending.handle;

  const meta = session?.user.user_metadata as {
    handle?: string;
    display_name?: string;
  };
  if (typeof meta?.handle === "string" && meta.handle.trim()) return meta.handle.trim();
  if (typeof meta?.display_name === "string" && meta.display_name.trim()) {
    return meta.display_name.trim();
  }
  return null;
}
