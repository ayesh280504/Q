import type { LanGigHandoff } from "@q/shared";

export type DesktopPairing = {
  host: string;
  port: number;
  token: string;
};

const KEY = "q-desktop-pairing";

export function lanBaseUrl(pairing: DesktopPairing): string {
  const host = pairing.host.replace(/^https?:\/\//, "").split("/")[0] ?? pairing.host;
  return `http://${host}:${pairing.port}`;
}

export async function requestDesktopStartGig(
  pairing: DesktopPairing,
  body: {
    displayName: string;
    name?: string;
    librarySource?: string;
    crowdProfileUrl?: string;
    maxPendingRequests?: number;
    maxRequestsPerGuest?: number;
  },
): Promise<LanGigHandoff> {
  const res = await fetch(`${lanBaseUrl(pairing)}/local/start-gig`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Q-Handoff-Token": pairing.token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<LanGigHandoff>;
}

export async function pushGigHandoff(pairing: DesktopPairing, payload: LanGigHandoff): Promise<void> {
  const res = await fetch(`${lanBaseUrl(pairing)}/local/handoff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Q-Handoff-Token": pairing.token,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || res.statusText);
  }
}

export async function probeDesktop(pairing: DesktopPairing): Promise<boolean> {
  try {
    const res = await fetch(`${lanBaseUrl(pairing)}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchDesktopPairing(pairing: DesktopPairing): Promise<DesktopPairing | null> {
  try {
    const res = await fetch(`${lanBaseUrl(pairing)}/local/pairing`);
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string | null; port: number; token: string };
    if (!data.ip) return { host: pairing.host, port: data.port, token: data.token };
    return { host: data.ip, port: data.port, token: data.token };
  } catch {
    return null;
  }
}
