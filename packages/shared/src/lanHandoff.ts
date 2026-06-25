export type LanGigHandoff = {
  sessionId: string;
  code: string;
  djToken: string;
  name: string;
  displayName: string;
  crowdUrl: string;
  crowdProfileUrl?: string;
  librarySource?: "local" | "spotify" | "both";
  maxPendingRequests?: number;
  maxRequestsPerGuest?: number;
  /** True when created offline — publish to cloud when back online. */
  localOnly?: boolean;
};

export type LanPairingInfo = {
  ip: string | null;
  port: number;
  token: string;
};

const SESSION_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateSessionCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SESSION_CODE_CHARS[b % SESSION_CODE_CHARS.length]!).join("");
}
