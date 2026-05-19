import { createRemoteJWKSet, jwtVerify } from "jose";

export interface SupabaseClaims {
  sub: string;
  email?: string;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!url) return null;
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`));
  }
  return { jwks, issuer: `${url}/auth/v1` };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL);
}

export async function verifySupabaseAccessToken(
  token: string,
): Promise<SupabaseClaims | null> {
  const cfg = getJwks();
  if (!cfg) return null;
  try {
    const { payload } = await jwtVerify(token, cfg.jwks, {
      issuer: cfg.issuer,
    });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    const email =
      typeof payload.email === "string"
        ? payload.email
        : typeof payload.user_metadata === "object" &&
            payload.user_metadata &&
            "email" in payload.user_metadata &&
            typeof (payload.user_metadata as { email?: string }).email === "string"
          ? (payload.user_metadata as { email: string }).email
          : undefined;
    return { sub, email };
  } catch {
    return null;
  }
}
