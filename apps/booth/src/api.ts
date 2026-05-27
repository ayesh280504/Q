import type {
  AuthResponse,
  CreateSessionResponse,
  CrowdRequest,
  DeclineReason,
  DjProfile,
  LibrarySource,
  SessionLiveStatus,
  SyncStatus,
  TransitionSuggestion,
} from "@q/shared";

const API_BASE = process.env.EXPO_PUBLIC_Q_API_URL || "http://localhost:8787";
const CROWD_BASE = process.env.EXPO_PUBLIC_Q_CROWD_URL || "http://localhost:5173";

export function crowdProfileUrl(handle: string) {
  return `${CROWD_BASE}/dj/${handle}`;
}

async function api<T>(
  path: string,
  init?: RequestInit & { accountToken?: string; djToken?: string },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (init?.accountToken) headers["X-Q-Account-Token"] = init.accountToken;
  if (init?.djToken) headers.Authorization = `Bearer ${init.djToken}`;

  const { accountToken: _a, djToken: _d, ...rest } = init ?? {};
  void _a;
  void _d;

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(accountToken: string) {
  return api<{ user: DjProfile }>("/auth/me", { accountToken });
}

export function createSession(
  accountToken: string,
  payload: {
    name: string;
    displayName: string;
    librarySource: LibrarySource;
  },
) {
  return api<CreateSessionResponse>("/sessions", {
    method: "POST",
    accountToken,
    body: JSON.stringify({
      ...payload,
      maxPendingRequests: 20,
      maxRequestsPerGuest: 3,
    }),
  });
}

export function endSession(sessionId: string, djToken: string) {
  return api<{ ok: boolean }>(`/sessions/${sessionId}/end`, {
    method: "POST",
    djToken,
  });
}

export function fetchRequests(sessionId: string, djToken: string) {
  return api<{ requests: CrowdRequest[] }>(`/sessions/${sessionId}/requests`, { djToken });
}

export function fetchLiveStatus(sessionId: string) {
  return api<{ status: SessionLiveStatus | null }>(`/sessions/${sessionId}/live-status`);
}

export function fetchSyncStatus(sessionId: string, djToken: string) {
  return api<SyncStatus>(`/sessions/${sessionId}/sync-status`, { djToken });
}

export function updateRequest(
  sessionId: string,
  djToken: string,
  requestId: string,
  status: "accepted" | "declined",
  declineReason?: DeclineReason,
) {
  const body: Record<string, string> = { status };
  if (status === "declined" && declineReason) body.declineReason = declineReason;
  return api<{ request: CrowdRequest; suggestions: TransitionSuggestion[] }>(
    `/sessions/${sessionId}/requests/${requestId}`,
    {
      method: "PATCH",
      djToken,
      body: JSON.stringify(body),
    },
  );
}
