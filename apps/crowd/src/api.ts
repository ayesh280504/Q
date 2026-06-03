import { getGuestId } from "./lib/guestId";

/**
 * Phone on LAN: use /api proxy on the crowd dev server (same host as QR).
 * Desktop browser on laptop: use VITE_Q_API_URL or /api.
 */
function apiBase(): string {
  const env = import.meta.env.VITE_Q_API_URL?.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    const onLan = h !== "localhost" && h !== "127.0.0.1";
    if (onLan) return "/api";
  }
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
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
