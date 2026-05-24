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
import { ensureEngagementTables, mixEngagementStats } from "./engagement.js";
import { parseSocialLinks, serializeSocialLinks } from "./social.js";
import { verifySupabaseAccessToken } from "./supabase.js";

ensureEngagementTables();

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
  if (!normalizeHandle(user.handle)) {
    return c.json({ error: "Profile incomplete", needsProfile: true }, 401);
  }
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
    displayName: body.handle ?? existing?.handle ?? "",
    avatarUrl: body.avatarUrl,
  });
  if ("error" in result) return c.json({ error: result.error }, 400);
  return c.json({ user: result.user, accountToken: result.accountToken }, 201);
});

community.patch("/auth/me", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as {
    bio?: string;
    avatarUrl?: string;
    socialLinks?: import("@q/shared").DjSocialLinks;
  };
  const bio = body.bio !== undefined ? body.bio.trim() || null : user.bio;
  const avatarUrl = body.avatarUrl !== undefined ? body.avatarUrl.trim() || null : user.avatar_url;
  const socialLinks =
    body.socialLinks !== undefined
      ? serializeSocialLinks(body.socialLinks)
      : user.social_links;

  db.prepare(
    `UPDATE users SET display_name = handle, bio = ?, avatar_url = ?, social_links = ? WHERE id = ?`,
  ).run(bio, avatarUrl, socialLinks, user.id);

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

type FeedRow = MixRow & {
  handle: string;
  display_name: string;
  verified: number;
  avatar_url: string | null;
};

function mapFeedRow(r: FeedRow, viewerId?: string) {
  const stats = mixEngagementStats(r.id, viewerId);
  return {
    ...rowToMix(r),
    likeCount: stats.likeCount,
    commentCount: stats.commentCount,
    likedByMe: stats.likedByMe,
    savedByMe: stats.savedByMe,
    dj: {
      handle: r.handle,
      displayName: r.display_name,
      verified: r.verified === 1,
      avatarUrl: r.avatar_url ?? undefined,
    },
  };
}

community.get("/mixes/feed", async (c) => {
  const viewer = await resolveAccount(c);
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
    .all(limit) as FeedRow[];

  return c.json({
    mixes: rows.map((r) => mapFeedRow(r, viewer?.id)),
  });
});

community.get("/auth/feed/following", async (c) => {
  const viewer = await resolveAccount(c);
  if (!viewer) return c.json({ error: "Unauthorized" }, 401);
  const limit = Math.min(parseInt(c.req.query("limit") || "30", 10), 50);
  const rows = db
    .prepare(
      `SELECT m.*, u.handle, u.display_name, u.verified, u.avatar_url
       FROM mixes m
       JOIN users u ON u.id = m.user_id
       JOIN follows f ON f.following_id = m.user_id AND f.follower_id = ?
       WHERE m.is_public = 1
       ORDER BY m.created_at DESC
       LIMIT ?`,
    )
    .all(viewer.id, limit) as FeedRow[];

  return c.json({ mixes: rows.map((r) => mapFeedRow(r, viewer.id)) });
});

community.post("/auth/mixes/:mixId/like", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  const exists = db.prepare(`SELECT id FROM mixes WHERE id = ? AND is_public = 1`).get(mixId);
  if (!exists) return c.json({ error: "Mix not found" }, 404);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO mix_likes (user_id, mix_id, created_at) VALUES (?, ?, ?)`,
  ).run(user.id, mixId, now);
  return c.json(mixEngagementStats(mixId, user.id));
});

community.delete("/auth/mixes/:mixId/like", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  db.prepare(`DELETE FROM mix_likes WHERE user_id = ? AND mix_id = ?`).run(user.id, mixId);
  return c.json(mixEngagementStats(mixId, user.id));
});

community.post("/auth/mixes/:mixId/save", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  const exists = db.prepare(`SELECT id FROM mixes WHERE id = ? AND is_public = 1`).get(mixId);
  if (!exists) return c.json({ error: "Mix not found" }, 404);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO saved_mixes (user_id, mix_id, created_at) VALUES (?, ?, ?)`,
  ).run(user.id, mixId, now);
  return c.json(mixEngagementStats(mixId, user.id));
});

community.delete("/auth/mixes/:mixId/save", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  db.prepare(`DELETE FROM saved_mixes WHERE user_id = ? AND mix_id = ?`).run(user.id, mixId);
  return c.json(mixEngagementStats(mixId, user.id));
});

community.get("/auth/mixes/:mixId/comments", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  const rows = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.handle, u.display_name
       FROM mix_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.mix_id = ?
       ORDER BY c.created_at ASC
       LIMIT 100`,
    )
    .all(mixId) as Array<{
    id: string;
    body: string;
    created_at: string;
    handle: string;
    display_name: string;
  }>;

  return c.json({
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.created_at,
      author: { handle: r.handle, displayName: r.display_name },
    })),
  });
});

community.post("/auth/mixes/:mixId/comments", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const mixId = c.req.param("mixId");
  const body = (await c.req.json()) as { body?: string };
  const text = body.body?.trim();
  if (!text) return c.json({ error: "Comment required" }, 400);
  const exists = db.prepare(`SELECT id FROM mixes WHERE id = ? AND is_public = 1`).get(mixId);
  if (!exists) return c.json({ error: "Mix not found" }, 404);
  const commentId = id();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO mix_comments (id, user_id, mix_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(commentId, user.id, mixId, text, now);
  return c.json({
    comment: {
      id: commentId,
      body: text,
      createdAt: now,
      author: { handle: user.handle, displayName: user.display_name },
    },
    ...mixEngagementStats(mixId, user.id),
  });
});

community.post("/auth/follow/:handle", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const handle = normalizeHandle(c.req.param("handle"));
  if (!handle) return c.json({ error: "DJ not found" }, 404);
  const target = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle) as
    | { id: string }
    | undefined;
  if (!target) return c.json({ error: "DJ not found" }, 404);
  if (target.id === user.id) return c.json({ error: "Cannot follow yourself" }, 400);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`,
  ).run(user.id, target.id, now);
  return c.json({ ok: true, following: true });
});

community.delete("/auth/follow/:handle", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const handle = normalizeHandle(c.req.param("handle"));
  if (!handle) return c.json({ error: "DJ not found" }, 404);
  const target = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle) as
    | { id: string }
    | undefined;
  if (!target) return c.json({ error: "DJ not found" }, 404);
  db.prepare(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`).run(
    user.id,
    target.id,
  );
  return c.json({ ok: true, following: false });
});

community.get("/auth/follow/:handle", async (c) => {
  const user = await resolveAccount(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const handle = normalizeHandle(c.req.param("handle"));
  if (!handle) return c.json({ error: "DJ not found" }, 404);
  const target = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle) as
    | { id: string }
    | undefined;
  if (!target) return c.json({ error: "DJ not found" }, 404);
  const row = db
    .prepare(`SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`)
    .get(user.id, target.id);
  return c.json({ following: Boolean(row) });
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
