import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { db } from "./db.js";
import type { DjProfile } from "@q/shared";
import { parseSocialLinks } from "./social.js";
import { verifySupabaseAccessToken } from "./supabase.js";

const id = () => crypto.randomUUID();
const accountToken = () => randomBytes(32).toString("hex");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
  } catch {
    return false;
  }
}

export function normalizeHandle(raw: string): string | null {
  const h = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (h.length < 3 || h.length > 24) return null;
  if (!/^[a-z][a-z0-9_]*$/.test(h)) return null;
  return h;
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  verified: number;
  account_token: string;
  created_at: string;
  supabase_id: string | null;
  social_links: string | null;
  tip_url: string | null;
};

export function rowToProfile(row: UserRow): DjProfile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    socialLinks: parseSocialLinks(row.social_links),
    verified: row.verified === 1,
    createdAt: row.created_at,
    tipUrl: row.tip_url?.trim() || undefined,
  };
}

export function getUserByToken(token: string | undefined): UserRow | null {
  if (!token?.trim()) return null;
  return (
    (db
      .prepare(`SELECT * FROM users WHERE account_token = ?`)
      .get(token.trim()) as UserRow | undefined) ?? null
  );
}

export function getUserBySupabaseId(supabaseId: string): UserRow | null {
  return (
    (db
      .prepare(`SELECT * FROM users WHERE supabase_id = ?`)
      .get(supabaseId) as UserRow | undefined) ?? null
  );
}

export async function resolveAccount(c: Context): Promise<UserRow | null> {
  const bearer = c.req.header("Authorization");
  if (bearer?.startsWith("Bearer ")) {
    const claims = await verifySupabaseAccessToken(bearer.slice(7).trim());
    if (claims) {
      const bySupabase = getUserBySupabaseId(claims.sub);
      if (bySupabase) return bySupabase;

      const email = claims.email?.trim().toLowerCase();
      if (email) {
        const byEmail = db
          .prepare(`SELECT * FROM users WHERE email = ?`)
          .get(email) as UserRow | undefined;
        if (byEmail) {
          db.prepare(`UPDATE users SET supabase_id = ? WHERE id = ?`).run(claims.sub, byEmail.id);
          return db.prepare(`SELECT * FROM users WHERE id = ?`).get(byEmail.id) as UserRow;
        }
      }
    }
  }
  return getUserByToken(c.req.header("X-Q-Account-Token"));
}

export function requireAccount(c: Context): UserRow | null {
  const token = c.req.header("X-Q-Account-Token");
  return getUserByToken(token);
}

export function registerUser(input: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}): { user: DjProfile; accountToken: string } | { error: string } {
  const email = input.email.trim().toLowerCase();
  const handle = normalizeHandle(input.handle);
  if (!email.includes("@")) return { error: "Valid email required" };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters" };
  if (!handle) return { error: "Handle must be 3–24 chars: letters, numbers, underscore" };

  const displayName = handle;
  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ? OR handle = ?`)
    .get(email, handle) as { id: string } | undefined;
  if (existing) return { error: "Email or handle already taken" };

  const userId = id();
  const token = accountToken();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, handle, display_name, bio, avatar_url, verified, account_token, created_at, supabase_id)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, 0, ?, ?, NULL)`,
  ).run(userId, email, hashPassword(input.password), handle, displayName, token, now);

  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as UserRow;
  return { user: rowToProfile(row), accountToken: token };
}

export function loginUser(
  email: string,
  password: string,
): { user: DjProfile; accountToken: string } | { error: string } {
  const row = db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  if (!row?.password_hash || !verifyPassword(password, row.password_hash)) {
    return { error: "Invalid email or password" };
  }
  const token = accountToken();
  db.prepare(`UPDATE users SET account_token = ? WHERE id = ?`).run(token, row.id);
  const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(row.id) as UserRow;
  return { user: rowToProfile(updated), accountToken: token };
}

/** Link Supabase Auth user to Q profile (first sign-in or handle setup). */
export function syncSupabaseUser(input: {
  supabaseId: string;
  email: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
}): { user: DjProfile; accountToken: string } | { error: string } {
  const email = input.email.trim().toLowerCase();
  const handle = normalizeHandle(input.handle);
  if (!email.includes("@")) return { error: "Valid email required" };
  if (!handle) return { error: "Handle must be 3–24 chars: letters, numbers, underscore" };

  const displayName = handle;
  const bySupabase = getUserBySupabaseId(input.supabaseId);
  if (bySupabase) {
    const token = accountToken();
    const currentValid = normalizeHandle(bySupabase.handle);
    if (handle && !currentValid) {
      const taken = db
        .prepare(`SELECT id FROM users WHERE handle = ? AND id != ?`)
        .get(handle, bySupabase.id) as { id: string } | undefined;
      if (taken) return { error: "Handle already taken" };
      db.prepare(
        `UPDATE users SET handle = ?, display_name = ?, avatar_url = COALESCE(?, avatar_url), account_token = ? WHERE id = ?`,
      ).run(handle, displayName, input.avatarUrl ?? null, token, bySupabase.id);
    } else {
      db.prepare(
        `UPDATE users SET display_name = ?, avatar_url = COALESCE(?, avatar_url), account_token = ? WHERE id = ?`,
      ).run(currentValid ? bySupabase.display_name : displayName, input.avatarUrl ?? null, token, bySupabase.id);
    }
    const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(bySupabase.id) as UserRow;
    return { user: rowToProfile(updated), accountToken: token };
  }

  const handleTaken = db
    .prepare(`SELECT id FROM users WHERE handle = ?`)
    .get(handle) as { id: string } | undefined;
  if (handleTaken) return { error: "Handle already taken" };

  const byEmail = db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email) as UserRow | undefined;
  if (byEmail) {
    const conflict = db
      .prepare(`SELECT id FROM users WHERE supabase_id = ? AND id != ?`)
      .get(input.supabaseId, byEmail.id);
    if (conflict) return { error: "Account conflict" };
    const token = accountToken();
    const existingHandle = normalizeHandle(byEmail.handle);
    const finalHandle = existingHandle ?? handle;
    const finalDisplay = existingHandle ? byEmail.display_name : displayName;
    db.prepare(
      `UPDATE users SET supabase_id = ?, handle = ?, display_name = ?, avatar_url = COALESCE(?, avatar_url), account_token = ? WHERE id = ?`,
    ).run(
      input.supabaseId,
      finalHandle,
      finalDisplay,
      input.avatarUrl ?? null,
      token,
      byEmail.id,
    );
    const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(byEmail.id) as UserRow;
    return { user: rowToProfile(updated), accountToken: token };
  }

  const userId = id();
  const token = accountToken();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, handle, display_name, bio, avatar_url, verified, account_token, created_at, supabase_id)
     VALUES (?, ?, '', ?, ?, NULL, ?, 0, ?, ?, ?)`,
  ).run(
    userId,
    email,
    handle,
    displayName,
    input.avatarUrl ?? null,
    token,
    now,
    input.supabaseId,
  );

  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as UserRow;
  return { user: rowToProfile(row), accountToken: token };
}
