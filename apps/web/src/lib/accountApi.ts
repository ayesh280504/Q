import type { AuthResponse, DjProfile, DjProfilePublic, Mix } from "@q/shared";
import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_Q_API_URL || "http://localhost:8787";
const TOKEN_KEY = "q-account-token";

export function getAccountToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAccountToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const access = data.session?.access_token;
    if (access) return { Authorization: `Bearer ${access}` };
  }
  const legacy = getAccountToken();
  if (legacy) return { "X-Q-Account-Token": legacy };
  return {};
}

async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init?.auth) {
    Object.assign(headers, await getAuthHeaders());
  }
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

export function register(payload: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}) {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function syncProfile(payload: {
  handle: string;
  displayName: string;
  avatarUrl?: string;
}) {
  return api<AuthResponse>("/auth/sync", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function fetchMe() {
  return api<{ user: DjProfile }>("/auth/me", { auth: true });
}

export function updateProfile(payload: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  return api<{ user: DjProfile }>("/auth/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function fetchFeed() {
  return api<{
    mixes: Array<
      Mix & {
        dj: { handle: string; displayName: string; verified: boolean; avatarUrl?: string };
      }
    >;
  }>("/mixes/feed");
}

export function fetchDjProfile(handle: string) {
  return api<{ profile: DjProfilePublic }>(`/djs/${encodeURIComponent(handle)}`);
}

export function fetchMyMixes() {
  return api<{ mixes: Mix[] }>("/auth/mixes", { auth: true });
}

export function createMix(payload: {
  title: string;
  description?: string;
  externalUrl: string;
  isPublic: boolean;
}) {
  return api<{ mix: Mix }>("/auth/mixes", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteMix(mixId: string) {
  return api<{ ok: boolean }>(`/auth/mixes/${mixId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function updateMix(
  mixId: string,
  payload: Partial<{ title: string; description: string; externalUrl: string; isPublic: boolean }>,
) {
  return api<{ mix: Mix }>(`/auth/mixes/${mixId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function recordMixPlay(mixId: string) {
  return api<{ ok: boolean }>(`/mixes/${mixId}/play`, { method: "POST" });
}
