import { isPrivateLanHostname, Q_PROD_URLS } from "@q/shared";

/** Marketing / community web base — register, download, DJ profiles. */
export function webBase(): string {
  const env = import.meta.env.VITE_Q_WEB_URL?.replace(/\/$/, "");
  if (env) return env;
  if (import.meta.env.PROD) return Q_PROD_URLS.web;

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (isPrivateLanHostname(hostname) && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:5174`;
    }
  }
  return "http://localhost:5174";
}

export function crowdRegisterUrl(handle?: string): string {
  const base = webBase();
  const params = new URLSearchParams({ from: "crowd" });
  if (handle) params.set("follow", handle);
  return `${base}/register?${params}`;
}

export function crowdLoginUrl(handle?: string): string {
  const base = webBase();
  const params = new URLSearchParams({ from: "crowd" });
  if (handle) params.set("follow", handle);
  return `${base}/login?${params}`;
}
