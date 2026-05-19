import { Hono } from "hono";
import type { DjProfilePublic, Mix } from "@q/shared";
import {
  getUserBySupabaseId,
  getUserByToken,
  loginUser,
  normalizeHandle,
  registerUser,
  resolveAccount,
  rowToProfile,
  syncSupabaseUser,
} from "./auth.js";
import { db } from "./db.js";
import { verifySupabaseAccessToken } from "./supabase.js";

const id = () => crypto.randomUUID();

type MixRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  external_url: string;
  is_public: number;
  play_count: number;
  created_at: string;
  updated_at: string;
};

function rowToMix(row: MixRow): Mix {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    externalUrl: row.external_url,
    isPublic: row.is_public === 1,
    playCount: row.play_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const community = new Hono();

community.post("/auth/register", async (c) => {
  const body = (await c.req.json()) as {
    email?: string;
    password?: string;
    handle?: string;
    displayName?: string;
  };
  const result = registerUser({
    email: body.email ?? "",
    password: body.password ?? "",
    handle: body.handle ?? "",
    displayName: body.displayName ?? "",
  });
  if ("error" in result) return c.json({ error: result.error }, 400);
  return c.json({ user: result.user, accountToken: result.accountToken }, 201);
});

community.post("/auth/login", async (c) => {
  const body = (await c.req.json()) as { email?: string; password?: string };
  const result = loginUser(body.email ?? "", body.password ?? "");
  if ("error" in result) return c.json({ error: result.error }, 401);
  return c.json({ user: result.user, accountToken: result.accountToken });
});

community.get("/auth/me", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized", needsProfile: true }, 401);
  return c.json({ user: rowToProfile(user) });
});

community.post("/auth/sync", async (c) => {
  const bearer = c.req.header("Authorization");
  if (!bearer?.startsWith("Bearer ")) {
    return c.json({ error: "Supabase session required" }, 401);
  }
  const claims = await verifySupabaseAccessToken(bearer.slice(7).trim());
  if (!claims) return c.json({ error: "Invalid session" }, 401);

  const body = (await c.req.json()) as {
    handle?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  const email = claims.email?.trim().toLowerCase();
  if (!email?.includes("@")) {
    return c.json({ error: "Email required on your auth account" }, 400);
  }
  const existing = getUserBySupabaseId(claims.sub);
  if (!existing && !body.handle?.trim()) {
    return c.json({ error: "Handle required" }, 400);
  }
  const result = syncSupabaseUser({
    supabaseId: claims.sub,
    email,
    handle: body.handle ?? existing?.handle ?? "",
    displayName: body.displayName ?? body.handle ?? existing?.display_name ?? "",
    avatarUrl: body.avatarUrl,
  });
  if ("error" in result) return c.json({ error: result.error }, 400);
  return c.json({ user: result.user, accountToken: result.accountToken }, 201);
});

community.patch("/auth/me", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  const displayName = body.displayName?.trim() || user.display_name;
  const bio = body.bio?.trim() ?? user.bio;
  const avatarUrl = body.avatarUrl?.trim() ?? user.avatar_url;

  db.prepare(
    `UPDATE users SET display_name = ?, bio = ?, avatar_url = ? WHERE id = ?`,
  ).run(displayName, bio || null, avatarUrl || null, user.id);

  const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);
  return c.json({ user: rowToProfile(updated as Parameters<typeof rowToProfile>[0]) });
});

community.get("/djs/:handle", (c) => {
  const handle = normalizeHandle(c.req.param("handle"));
  if (!handle) return c.json({ error: "DJ not found" }, 404);

  const user = db.prepare(`SELECT * FROM users WHERE handle = ?`).get(handle) as
    | Parameters<typeof rowToProfile>[0]
    | undefined;
  if (!user) return c.json({ error: "DJ not found" }, 404);

  const mixes = db
    .prepare(
      `SELECT * FROM mixes WHERE user_id = ? AND is_public = 1 ORDER BY created_at DESC LIMIT 50`,
    )
    .all(user.id) as MixRow[];

  const profile: DjProfilePublic = {
    ...rowToProfile(user),
    mixes: mixes.map(rowToMix),
  };
  return c.json({ profile });
});

community.get("/mixes/feed", (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "30", 10), 50);
  const rows = db
    .prepare(
      `SELECT m.*, u.handle, u.display_name, u.verified, u.avatar_url
       FROM mixes m
       JOIN users u ON u.id = m.user_id
       WHERE m.is_public = 1
       ORDER BY u.verified DESC, m.play_count DESC, m.created_at DESC
       LIMIT ?`,
    )
    .all(limit) as Array<
    MixRow & {
      handle: string;
      display_name: string;
      verified: number;
      avatar_url: string | null;
    }
  >;

  return c.json({
    mixes: rows.map((r) => ({
      ...rowToMix(r),
      dj: {
        handle: r.handle,
        displayName: r.display_name,
        verified: r.verified === 1,
        avatarUrl: r.avatar_url ?? undefined,
      },
    })),
  });
});

community.get("/auth/mixes", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const rows = db
    .prepare(`SELECT * FROM mixes WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id) as MixRow[];
  return c.json({ mixes: rows.map(rowToMix) });
});

community.post("/auth/mixes", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as {
    title?: string;
    description?: string;
    externalUrl?: string;
    isPublic?: boolean;
  };
  const title = body.title?.trim();
  const externalUrl = body.externalUrl?.trim();
  if (!title) return c.json({ error: "Title required" }, 400);
  if (!externalUrl?.startsWith("http")) return c.json({ error: "Valid mix URL required" }, 400);

  const mixId = id();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO mixes (id, user_id, title, description, external_url, is_public, play_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  ).run(
    mixId,
    user.id,
    title,
    body.description?.trim() || null,
    externalUrl,
    body.isPublic ? 1 : 0,
    now,
    now,
  );

  const row = db.prepare(`SELECT * FROM mixes WHERE id = ?`).get(mixId) as MixRow;
  return c.json({ mix: rowToMix(row) }, 201);
});

community.patch("/auth/mixes/:mixId", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as {
    title?: string;
    description?: string;
    externalUrl?: string;
    isPublic?: boolean;
  };
  const mixId = c.req.param("mixId");
  const existing = db
    .prepare(`SELECT * FROM mixes WHERE id = ? AND user_id = ?`)
    .get(mixId, user.id) as MixRow | undefined;
  if (!existing) return c.json({ error: "Mix not found" }, 404);

  const title = body.title?.trim() || existing.title;
  const externalUrl = body.externalUrl?.trim() || existing.external_url;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE mixes SET title = ?, description = ?, external_url = ?, is_public = ?, updated_at = ? WHERE id = ?`,
  ).run(
    title,
    body.description?.trim() ?? existing.description,
    externalUrl,
    body.isPublic !== undefined ? (body.isPublic ? 1 : 0) : existing.is_public,
    now,
    mixId,
  );

  const row = db.prepare(`SELECT * FROM mixes WHERE id = ?`).get(mixId) as MixRow;
  return c.json({ mix: rowToMix(row) });
});

community.delete("/auth/mixes/:mixId", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  const result = db
    .prepare(`DELETE FROM mixes WHERE id = ? AND user_id = ?`)
    .run(mixId, user.id);
  if (result.changes === 0) return c.json({ error: "Mix not found" }, 404);
  return c.json({ ok: true });
});

community.post("/mixes/:mixId/play", (c) => {
  const mixId = c.req.param("mixId");
  const result = db
    .prepare(`UPDATE mixes SET play_count = play_count + 1 WHERE id = ? AND is_public = 1`)
    .run(mixId);
  if (result.changes === 0) return c.json({ error: "Mix not found" }, 404);
  return c.json({ ok: true });
});

/** Latest active gig code for a DJ handle (crowd redirect). */
community.get("/djs/:handle/active-gig", (c) => {
  const handle = normalizeHandle(c.req.param("handle"));
  if (!handle) return c.json({ error: "DJ not found" }, 404);
  const user = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle) as
    | { id: string }
    | undefined;
  if (!user) return c.json({ error: "DJ not found" }, 404);

  const session = db
    .prepare(
      `SELECT code, display_name FROM sessions WHERE dj_user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(user.id) as { code: string; display_name: string | null } | undefined;
  if (!session) return c.json({ error: "No active gig" }, 404);
  return c.json({ code: session.code, displayName: session.display_name });
});

export { getUserByToken };
