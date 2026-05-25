import type {
  CreateSessionResponse,
  CrowdRequest,
  PlanTier,
  Session,
  SessionSettings,
  SyncStatus,
  TrackRecord,
  TransitionSuggestion,
} from "@q/shared";
import { sanitizeTrackArtist, sanitizeTrackTitle } from "@q/shared";

const API_BASE = import.meta.env.VITE_Q_API_URL || "http://localhost:8787";

export async function api<T>(
  path: string,
  init?: RequestInit & { token?: string; plan?: PlanTier; accountToken?: string },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  if (init?.plan) headers["X-Q-Plan"] = init.plan;
  if (init?.accountToken) headers["X-Q-Account-Token"] = init.accountToken;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function createSession(
  payload: {
    name: string;
    displayName: string;
    maxPendingRequests: number;
    maxRequestsPerGuest: number;
  },
  accountToken?: string | null,
) {
  return api<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
    accountToken: accountToken ?? undefined,
  });
}

export function updateSessionSettings(
  sessionId: string,
  token: string,
  settings: SessionSettings,
) {
  return api<{ session: Session }>(`/sessions/${sessionId}/settings`, {
    method: "PATCH",
    token,
    body: JSON.stringify(settings),
  });
}

/**
 * Crowd-facing sanitization happens here at the upload boundary: we strip
 * version tags ("Dirty Intro", "Radio Edit") so the audience sees clean names.
 * The DJ's local copy is untouched.
 */
export function syncLibrary(sessionId: string, token: string, tracks: unknown[]) {
  const cleaned = (tracks as TrackRecord[]).map((t) => ({
    ...t,
    title: sanitizeTrackTitle(t.title) || t.title,
    artist: sanitizeTrackArtist(t.artist) || t.artist,
  }));
  return api<{ synced: number }>(`/sessions/${sessionId}/library`, {
    method: "POST",
    token,
    body: JSON.stringify({ tracks: cleaned }),
  });
}

export function fetchRequests(sessionId: string, token: string, since?: string) {
  const q = since ? `?since=${encodeURIComponent(since)}` : "";
  return api<{ requests: CrowdRequest[] }>(`/sessions/${sessionId}/requests${q}`, { token });
}

export function fetchSyncStatus(sessionId: string, token: string) {
  return api<SyncStatus>(`/sessions/${sessionId}/sync-status`, { token });
}

export function syncPlayedTracks(
  sessionId: string,
  token: string,
  tracks: Array<{ title: string; artist: string; playedAt?: number }>,
) {
  return api<{ synced: number }>(`/sessions/${sessionId}/played-tracks`, {
    method: "POST",
    token,
    body: JSON.stringify({ tracks }),
  });
}

export function updateRequest(
  sessionId: string,
  token: string,
  requestId: string,
  status: "accepted" | "declined",
  plan: PlanTier = "free",
) {
  return api<{ request: CrowdRequest; suggestions: TransitionSuggestion[] }>(
    `/sessions/${sessionId}/requests/${requestId}`,
    { method: "PATCH", token, plan, body: JSON.stringify({ status }) },
  );
}
