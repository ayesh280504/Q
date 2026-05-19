import type { AuthResponse, DjProfile } from "@q/shared";

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

async function accountApi<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init?.auth) {
    const t = getAccountToken();
    if (t) headers["X-Q-Account-Token"] = t;
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

export function loginAccount(email: string, password: string) {
  return accountApi<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerAccount(payload: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}) {
  return accountApi<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAccountMe() {
  return accountApi<{ user: DjProfile }>("/auth/me", { auth: true });
}
