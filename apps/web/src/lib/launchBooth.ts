import { getAccountToken, getAuthHeaders } from "./accountApi";
import { Q_APP_OPEN_URL, Q_APP_START_GIG_URL } from "./appLaunch";

const API_BASE = import.meta.env.VITE_Q_API_URL || "http://localhost:8787";

export type LaunchIntent = "open" | "start-gig";

/** Mint a fresh booth account token for the current signed-in user.
 *  Works for Supabase sessions and legacy account tokens. */
async function fetchHandoffToken(): Promise<string | null> {
  try {
    const headers = await getAuthHeaders();
    if (Object.keys(headers).length === 0) return null;
    const res = await fetch(`${API_BASE}/auth/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accountToken?: string };
    return data.accountToken?.trim() || null;
  } catch {
    return null;
  }
}

/** Build the qdj:// URL to open the booth app, including an auth handoff
 *  token (and handle, when known) so the desktop app stays signed in. */
export async function buildBoothLaunchUrl(
  intent: LaunchIntent,
  opts: { handle?: string } = {},
): Promise<string> {
  const base = intent === "start-gig" ? Q_APP_START_GIG_URL : Q_APP_OPEN_URL;
  const params = new URLSearchParams();

  const handoff = (await fetchHandoffToken()) ?? getAccountToken();
  if (handoff) params.set("token", handoff);
  if (opts.handle?.trim()) params.set("handle", opts.handle.trim());

  return params.toString() ? `${base}?${params.toString()}` : base;
}
