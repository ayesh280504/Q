import { getGuestId } from "./lib/guestId";

/** Phone/LAN: same origin + /api (Vite proxies to laptop API). Avoids firewall on :8787. */
function apiBase(): string {
  if (import.meta.env.VITE_Q_API_URL) return import.meta.env.VITE_Q_API_URL;
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
