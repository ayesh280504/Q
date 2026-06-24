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

export function register(payload: { email: string; password: string; handle: string }) {
  const handle = payload.handle.trim();
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...payload, handle, displayName: handle }),
  });
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function syncProfile(payload: { handle: string; avatarUrl?: string }) {
  const handle = payload.handle.trim();
  return api<AuthResponse>("/auth/sync", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ handle, displayName: handle, avatarUrl: payload.avatarUrl }),
  });
}

export function fetchMe() {
  return api<{ user: DjProfile }>("/auth/me", { auth: true });
}

export function updateProfile(payload: {
  bio?: string;
  avatarUrl?: string;
  socialLinks?: import("@q/shared").DjSocialLinks;
  tipUrl?: string;
}) {
  return api<{ user: DjProfile }>("/auth/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export type FeedMix = Mix & {
  dj: {
    handle: string;
    displayName: string;
    verified: boolean;
    avatarUrl?: string;
    gigRatings?: { averageScore: number; ratingCount: number };
  };
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
};

export type TopRatedDj = {
  handle: string;
  displayName: string;
  verified: boolean;
  avatarUrl?: string;
  gigRatings: { averageScore: number; ratingCount: number };
};

export function fetchTopRatedDjs(limit = 8) {
  return api<{ djs: TopRatedDj[] }>(`/djs/top-rated?limit=${limit}`);
}

export function fetchFeed() {
  return api<{ mixes: FeedMix[] }>("/mixes/feed", { auth: true });
}

export function fetchFollowingFeed() {
  return api<{ mixes: FeedMix[] }>("/auth/feed/following", { auth: true });
}

export function likeMix(mixId: string) {
  return api<{ likeCount: number; commentCount: number; likedByMe: boolean; savedByMe: boolean }>(
    `/auth/mixes/${mixId}/like`,
    { method: "POST", auth: true },
  );
}

export function unlikeMix(mixId: string) {
  return api<{ likeCount: number; commentCount: number; likedByMe: boolean; savedByMe: boolean }>(
    `/auth/mixes/${mixId}/like`,
    { method: "DELETE", auth: true },
  );
}

export function saveMix(mixId: string) {
  return api<{ likeCount: number; commentCount: number; likedByMe: boolean; savedByMe: boolean }>(
    `/auth/mixes/${mixId}/save`,
    { method: "POST", auth: true },
  );
}

export function unsaveMix(mixId: string) {
  return api<{ likeCount: number; commentCount: number; likedByMe: boolean; savedByMe: boolean }>(
    `/auth/mixes/${mixId}/save`,
    { method: "DELETE", auth: true },
  );
}

export function fetchMixComments(mixId: string) {
  return api<{
    comments: Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { handle: string; displayName: string };
    }>;
  }>(`/auth/mixes/${mixId}/comments`, { auth: true });
}

export function postMixComment(mixId: string, body: string) {
  return api<{ comment: { id: string; body: string } }>(`/auth/mixes/${mixId}/comments`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ body }),
  });
}

export function followDj(handle: string) {
  return api<{ ok: boolean; following: boolean }>(`/auth/follow/${encodeURIComponent(handle)}`, {
    method: "POST",
    auth: true,
  });
}

export function unfollowDj(handle: string) {
  return api<{ ok: boolean; following: boolean }>(`/auth/follow/${encodeURIComponent(handle)}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchFollowStatus(handle: string) {
  return api<{ following: boolean }>(`/auth/follow/${encodeURIComponent(handle)}`, {
    auth: true,
  });
}

export type LiveFollowedDj = {
  handle: string;
  displayName: string;
  sessionCode: string;
  sessionDisplayName: string;
  crowdUrl: string;
};

export function fetchFollowingLive() {
  return api<{ live: LiveFollowedDj[] }>("/auth/following/live", { auth: true });
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
