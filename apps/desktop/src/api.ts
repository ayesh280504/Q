import type {
  CreateSessionResponse,
  CrowdRequest,
  PlanTier,
  Session,
  SessionLiveStatus,
  SessionSettings,
  SyncStatus,
  TrackRecord,
  TransitionSuggestion,
  MixSuggestionHit,
} from "@q/shared";
import { sanitizeTrackArtist, sanitizeTrackTitle } from "@q/shared";
import { fetchWithTimeout } from "./lib/fetchWithTimeout";

const API_BASE = import.meta.env.VITE_Q_API_URL || "http://localhost:8787";

/** Booth sync / accept-decision — fail fast so bad Wi‑Fi never blocks the UI. */
export const API_TIMEOUT_SYNC_MS = 4_000;
/** Large library upload — allow more time but still bounded. */
export const API_TIMEOUT_LIBRARY_MS = 45_000;
/** Default for session start, settings, etc. */
export const API_TIMEOUT_DEFAULT_MS = 12_000;

export async function api<T>(
  path: string,
  init?: RequestInit & {
    token?: string;
    plan?: PlanTier;
    accountToken?: string;
    timeoutMs?: number;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  if (init?.plan) headers["X-Q-Plan"] = init.plan;
  if (init?.accountToken) headers["X-Q-Account-Token"] = init.accountToken;

  const { timeoutMs, token: _t, plan: _p, accountToken: _a, ...fetchInit } = init ?? {};
  void _t;
  void _p;
  void _a;

  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...fetchInit,
    timeoutMs: timeoutMs ?? API_TIMEOUT_DEFAULT_MS,
    headers: { ...headers, ...(fetchInit.headers as Record<string, string>) },
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
    /**
     * DJ's gig-start pick (local / spotify / both). Drives the crowd-search
     * scope server-side so a "Local only" DJ never sees Spotify hits and a
     * "Spotify only" DJ doesn't get an empty-library experience.
     */
    librarySource?: "local" | "spotify" | "both";
    publicWall?: boolean;
    allowShoutouts?: boolean;
  },
  accountToken?: string | null,
) {
  return api<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
    accountToken: accountToken ?? undefined,
  });
}

/** Push an offline LAN-created session to the cloud when back online. */
export function registerLocalSession(
  payload: {
    sessionId: string;
    code: string;
    djToken: string;
    name: string;
    displayName: string;
    maxPendingRequests: number;
    maxRequestsPerGuest: number;
    librarySource?: "local" | "spotify" | "both";
    publicWall?: boolean;
    allowShoutouts?: boolean;
  },
  accountToken?: string | null,
) {
  return api<CreateSessionResponse>("/sessions/register-local", {
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
  // Strip `localPath` (filesystem path on the DJ's laptop) before upload — it
  // stays local for the auto-crate writer and the server doesn't need it.
  const cleaned = (tracks as TrackRecord[]).map((t) => {
    const { localPath: _omitLocalPath, ...rest } = t;
    void _omitLocalPath;
    return {
      ...rest,
      title: sanitizeTrackTitle(t.title) || t.title,
      artist: sanitizeTrackArtist(t.artist) || t.artist,
    };
  });
  return api<{ synced: number }>(`/sessions/${sessionId}/library`, {
    method: "POST",
    token,
    timeoutMs: API_TIMEOUT_LIBRARY_MS,
    body: JSON.stringify({ tracks: cleaned }),
  });
}

export function fetchRequests(sessionId: string, token: string, since?: string) {
  const q = since ? `?since=${encodeURIComponent(since)}` : "";
  return api<{ requests: CrowdRequest[] }>(`/sessions/${sessionId}/requests${q}`, {
    token,
    timeoutMs: API_TIMEOUT_SYNC_MS,
  });
}

export function fetchSyncStatus(sessionId: string, token: string) {
  return api<SyncStatus>(`/sessions/${sessionId}/sync-status`, {
    token,
    timeoutMs: API_TIMEOUT_SYNC_MS,
  });
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

export function pushLiveStatus(
  sessionId: string,
  token: string,
  payload: { title: string; artist: string; bpm?: number; key?: string },
) {
  return api<{ status: SessionLiveStatus }>(`/sessions/${sessionId}/live-status`, {
    method: "POST",
    token,
    timeoutMs: API_TIMEOUT_SYNC_MS,
    body: JSON.stringify(payload),
  });
}

export function endSession(sessionId: string, token: string) {
  return api<{ ok: boolean; endedAt: string }>(`/sessions/${sessionId}/end`, {
    method: "POST",
    token,
    timeoutMs: API_TIMEOUT_SYNC_MS,
  });
}

export function updateRequest(
  sessionId: string,
  token: string,
  requestId: string,
  status: "accepted" | "declined",
  plan: PlanTier = "free",
  declineReason?: string,
) {
  const payload: Record<string, string> = { status };
  if (status === "declined" && declineReason) payload.declineReason = declineReason;
  return api<{ request: CrowdRequest; suggestions: TransitionSuggestion[] }>(
    `/sessions/${sessionId}/requests/${requestId}`,
    {
      method: "PATCH",
      token,
      plan,
      timeoutMs: API_TIMEOUT_SYNC_MS,
      body: JSON.stringify(payload),
    },
  );
}

export function fetchMixSuggestions(
  sessionId: string,
  token: string,
  opts: {
    fromLive?: boolean;
    title?: string;
    artist?: string;
    bpm?: number;
    key?: string;
    limit?: number;
  },
) {
  const params = new URLSearchParams();
  if (opts.fromLive) params.set("fromLive", "1");
  if (opts.title) params.set("title", opts.title);
  if (opts.artist) params.set("artist", opts.artist);
  if (opts.bpm != null) params.set("bpm", String(opts.bpm));
  if (opts.key) params.set("key", opts.key);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  const q = params.toString();
  return api<{ suggestions: MixSuggestionHit[]; from: Record<string, unknown> }>(
    `/sessions/${sessionId}/mix-suggestions?${q}`,
    { token, timeoutMs: API_TIMEOUT_SYNC_MS },
  );
}
