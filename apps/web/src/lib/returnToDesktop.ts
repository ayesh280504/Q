/**
 * Tracks the "the user came from the booth desktop app and we should bounce
 * them back via qdj:// once they're signed in" intent across the entire web
 * auth flow — including the Supabase email-verification round trip, OAuth
 * redirects, and profile completion.
 *
 * Anyone landing on a page that finishes the auth flow (StudioPage,
 * AuthCallbackPage, CompleteProfilePage) should call `consumeReturnToDesktop()`
 * before its own redirects fire.
 */

import { buildBoothLaunchUrl } from "./launchBooth";

const STORAGE_KEY = "q-return-to-desktop";

export function markReturnToDesktop() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearReturnToDesktop() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasReturnToDesktop(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * If the user came from the desktop app, mint a handoff token and navigate
 * to the qdj:// deep link. Returns true if the bounce was attempted (caller
 * should bail on its own redirect logic).
 */
export async function consumeReturnToDesktop(opts: {
  handle?: string;
} = {}): Promise<boolean> {
  if (!hasReturnToDesktop()) return false;
  clearReturnToDesktop();
  try {
    const url = await buildBoothLaunchUrl("open", { handle: opts.handle });
    window.location.href = url;
  } catch {
    /* fall through — the caller's own redirect will fire */
    return false;
  }
  return true;
}
