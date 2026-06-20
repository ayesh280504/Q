import { getGuestId } from "./lib/guestId";
import { isLocalDevUrl, isPrivateLanHostname, Q_PROD_URLS } from "@q/shared";

/**
 * Resolve API base URL for crowd requests.
 *
 * - **Production (Vercel):** call Render API directly (CORS enabled).
 * - **LAN phone dev:** `/api` Vite proxy on the crowd dev server.
 * - **Laptop localhost dev:** `/api` Vite proxy.
 */
function apiBase(): string {
  const env = import.meta.env.VITE_Q_API_URL?.replace(/\/$/, "");

  if (env && !isLocalDevUrl(env)) return env;
  if (import.meta.env.PROD) return env || Q_PROD_URLS.api;

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (isPrivateLanHostname(h) && h !== "localhost" && h !== "127.0.0.1") {
      return "/api";
    }
  }

  if (env) return env;
  return "/api";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Q-Guest-Id": getGuestId(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}
