import type { Session } from "@supabase/supabase-js";
import { fetchMe, saveAccountToken, syncProfile } from "./accountApi";
import { clearPendingSignup, getSignupHandle, loadPendingSignup } from "./authPending";

/** Create or complete Q profile after Supabase sign-in. */
export async function ensureQProfile(session: Session | null): Promise<
  | { ok: true; showTour: boolean }
  | { ok: false; reason: "no-handle" | "sync-failed"; message?: string }
> {
  try {
    await fetchMe();
    clearPendingSignup();
    return { ok: true, showTour: false };
  } catch {
    const handle = getSignupHandle(session);
    if (!handle) return { ok: false, reason: "no-handle" };

    const hadPendingSignup = Boolean(loadPendingSignup());
    try {
      const res = await syncProfile({ handle });
      saveAccountToken(res.accountToken);
      clearPendingSignup();
      await fetchMe();
      return { ok: true, showTour: hadPendingSignup };
    } catch (err) {
      return {
        ok: false,
        reason: "sync-failed",
        message: err instanceof Error ? err.message : "Could not save username",
      };
    }
  }
}
