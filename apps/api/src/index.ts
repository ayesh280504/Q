import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { customAlphabet } from "nanoid";
import { db } from "./db.js";
import { resolveAccount } from "./auth.js";
import { community } from "./community.js";

function loadRootEnv(): void {
  const envFile = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key in process.env) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadRootEnv();
import { buildProSuggestions } from "./ai-suggestions.js";
import { buildSuggestions } from "./suggestions.js";
import {
  getSpotifyTrackFeatures,
  isSpotifyConfigured,
  searchSpotifyTracks,
} from "./spotify.js";
import type {
  CreateSessionResponse,
  CrowdRequest,
  PlanTier,
  RequestSource,
  Session,
  SessionSettings,
  SyncStatus,
  TrackRecord,
  TrackSearchHit,
  TransitionSuggestion,
} from "@q/shared";
import { sanitizeTrackArtist, sanitizeTrackTitle } from "@q/shared";

const app = new Hono();
const sessionCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);
const id = () => crypto.randomUUID();

const crowdBaseUrl = process.env.Q_CROWD_URL || "http://localhost:5173";
const webBaseUrl = process.env.Q_WEB_URL || "http://localhost:5174";

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Q-Plan",
      "X-Q-Guest-Id",
      "X-Q-Account-Token",
      "Authorization",
    ],
  }),
);

app.route("/", community);

type SessionRow = {
  id: string;
  code: string;
  name: string;
  created_at: string;
  library_synced_at: string | null;
  display_name?: string | null;
  max_pending_requests?: number | null;
  max_requests_per_guest?: number | null;
  streaming_search?: number | null;
};

type RequestRow = {
  id: string;
  session_id: string;
  title: string;
  artist: string;
  message: string | null;
  in_stock: number;
  matched_track_id: string | null;
  status: string;
  created_at: string;
  source?: string | null;
  external_id?: string | null;
  bpm?: number | null;
  key?: string | null;
  album_art_url?: string | null;
};

function clampLimit(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function sessionUsesStreamingSearch(row: SessionRow): boolean {
  return isSpotifyConfigured() && (row.streaming_search ?? 1) !== 0;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
    librarySyncedAt: row.library_synced_at ?? undefined,
    displayName: row.display_name?.trim() || row.name,
    maxPendingRequests: row.max_pending_requests ?? 20,
    maxRequestsPerGuest: row.max_requests_per_guest ?? 3,
    streamingSearch: sessionUsesStreamingSearch(row),
  };
}

function rowToRequest(row: RequestRow): CrowdRequest {
  const sessionId = row.session_id;
  const libraryMeta = trackMetaForRequest(sessionId, row.matched_track_id);
  return {
    id: row.id,
    sessionId,
    title: row.title,
    artist: row.artist,
    message: row.message ?? undefined,
    inStock: row.in_stock === 1,
    matchedTrackId: row.matched_track_id ?? undefined,
    source: (row.source as RequestSource) ?? undefined,
    externalId: row.external_id ?? undefined,
    status: row.status as CrowdRequest["status"],
    createdAt: row.created_at,
    bpm: row.bpm ?? libraryMeta.bpm ?? undefined,
    key: row.key ?? libraryMeta.key ?? undefined,
    albumArtUrl: row.album_art_url ?? undefined,
    playedEarlierTonight: isPlayedEarlierTonight(sessionId, row.title, row.artist),
  };
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isUnknownArtist(artist: string): boolean {
  return !artist || artist === "unknown" || artist === "unknown artist";
}

function titlesMatch(a: string, b: string): boolean {
  const t1 = normalizeTitle(a);
  const t2 = normalizeTitle(b);
  if (!t1 || !t2) return false;
  return t1 === t2 || t1.includes(t2) || t2.includes(t1);
}

function tracksMatchApi(aTitle: string, aArtist: string, bTitle: string, bArtist: string): boolean {
  if (!titlesMatch(aTitle, bTitle)) return false;
  const r1 = normalizeTitle(aArtist);
  const r2 = normalizeTitle(bArtist);
  if (isUnknownArtist(r1) || isUnknownArtist(r2)) return true;
  return r1 === r2 || r1.includes(r2) || r2.includes(r1);
}

function isPlayedEarlierTonight(sessionId: string, title: string, artist: string): boolean {
  const rows = db
    .prepare(`SELECT title, artist FROM played_tracks WHERE session_id = ?`)
    .all(sessionId) as { title: string; artist: string }[];
  return rows.some((r) => tracksMatchApi(title, artist, r.title, r.artist));
}

function trackMetaForRequest(
  sessionId: string,
  matchedTrackId: string | null,
): { bpm?: number; key?: string } {
  if (!matchedTrackId) return {};
  const t = db
    .prepare(`SELECT bpm, key FROM tracks WHERE id = ? AND session_id = ?`)
    .get(matchedTrackId, sessionId) as { bpm: number | null; key: string | null } | undefined;
  return {
    bpm: t?.bpm ?? undefined,
    key: t?.key ?? undefined,
  };
}

function getPlan(c: { req: { header: (n: string) => string | undefined } }): PlanTier {
  const plan = c.req.header("X-Q-Plan")?.toLowerCase();
  return plan === "pro" ? "pro" : "free";
}

function requireDj(c: { req: { header: (n: string) => string | undefined } }, sessionId: string) {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const row = db
    .prepare(`SELECT id FROM sessions WHERE id = ? AND dj_token = ?`)
    .get(sessionId, token) as { id: string } | undefined;
  return row?.id ?? null;
}

app.get("/health", (c) =>
  c.json({ ok: true, service: "q-api", spotifySearch: isSpotifyConfigured() }),
);

app.post("/sessions", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    displayName?: string;
    maxPendingRequests?: number;
    maxRequestsPerGuest?: number;
  };
  const sessionId = id();
  const code = sessionCode();
  const djToken = id();
  const now = new Date().toISOString();
  const name = body.name?.trim() || "Tonight";
  let displayName = body.displayName?.trim() || name;
  const maxPending = clampLimit(body.maxPendingRequests ?? 20, 1, 100);
  const maxPerGuest = clampLimit(body.maxRequestsPerGuest ?? 3, 1, 20);

  const accountUser = await resolveAccount(c);
  const djUserId = accountUser?.id ?? null;
  if (accountUser && (!body.displayName?.trim() || displayName === name)) {
    displayName = accountUser.display_name;
  }

  db.prepare(
    `INSERT INTO sessions (id, code, name, display_name, dj_token, created_at, max_pending_requests, max_requests_per_guest, dj_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    sessionId,
    code,
    name,
    displayName,
    djToken,
    now,
    maxPending,
    maxPerGuest,
    djUserId,
  );

  const response: CreateSessionResponse = {
    session: {
      id: sessionId,
      code,
      name,
      createdAt: now,
      displayName,
      maxPendingRequests: maxPending,
      maxRequestsPerGuest: maxPerGuest,
      streamingSearch: isSpotifyConfigured(),
    },
    djToken,
    crowdUrl: `${crowdBaseUrl}/r/${code}`,
    profileUrl: accountUser ? `${webBaseUrl}/dj/${accountUser.handle}` : undefined,
    crowdProfileUrl: accountUser
      ? `${crowdBaseUrl}/dj/${accountUser.handle}`
      : undefined,
  };

  return c.json(response, 201);
});

app.patch("/sessions/:sessionId/settings", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json().catch(() => ({}))) as SessionSettings;
  const row = db
    .prepare(`SELECT * FROM sessions WHERE id = ?`)
    .get(sessionId) as SessionRow | undefined;
  if (!row) return c.json({ error: "Session not found" }, 404);

  const displayName =
    body.displayName !== undefined ? body.displayName.trim() || row.name : row.display_name ?? row.name;
  const maxPending =
    body.maxPendingRequests !== undefined
      ? clampLimit(body.maxPendingRequests, 1, 100)
      : (row.max_pending_requests ?? 20);
  const maxPerGuest =
    body.maxRequestsPerGuest !== undefined
      ? clampLimit(body.maxRequestsPerGuest, 1, 20)
      : (row.max_requests_per_guest ?? 3);

  db.prepare(
    `UPDATE sessions SET display_name = ?, max_pending_requests = ?, max_requests_per_guest = ? WHERE id = ?`,
  ).run(displayName, maxPending, maxPerGuest, sessionId);

  const updated = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as SessionRow;
  return c.json({ session: rowToSession(updated) });
});

app.get("/sessions/:code", (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const row = db
    .prepare(`SELECT * FROM sessions WHERE code = ?`)
    .get(code) as Parameters<typeof rowToSession>[0] | undefined;

  if (!row) return c.json({ error: "Session not found" }, 404);
  return c.json({ session: rowToSession(row) });
});

app.post("/sessions/:sessionId/library", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as { tracks?: TrackRecord[] };
  const tracks = body.tracks ?? [];
  const now = new Date().toISOString();

  const del = db.prepare(`DELETE FROM tracks WHERE session_id = ?`);
  const ins = db.prepare(
    `INSERT INTO tracks (id, session_id, external_id, title, artist, album, bpm, key, duration_sec)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    del.run(sessionId);
    for (const t of tracks) {
      ins.run(
        id(),
        sessionId,
        t.externalId,
        t.title,
        t.artist,
        t.album ?? null,
        t.bpm ?? null,
        t.key ?? null,
        t.durationSec ?? null,
      );
    }
    db.prepare(`UPDATE sessions SET library_synced_at = ? WHERE id = ?`).run(now, sessionId);
  });
  tx();

  return c.json({ synced: tracks.length, librarySyncedAt: now });
});

app.get("/sessions/:code/library/search", (c) => {
  const q = c.req.query("q")?.trim().toLowerCase() ?? "";
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT id FROM sessions WHERE code = ?`)
    .get(code) as { id: string } | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);

  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);

  const rows = q
    ? (db
        .prepare(
          `SELECT id, external_id, title, artist, album, bpm, key, duration_sec
           FROM tracks WHERE session_id = ?
           AND (lower(title) LIKE ? OR lower(artist) LIKE ?)
           ORDER BY title LIMIT ?`,
        )
        .all(session.id, `%${q}%`, `%${q}%`, limit) as Array<{
        id: string;
        external_id: string;
        title: string;
        artist: string;
        album: string | null;
        bpm: number | null;
        key: string | null;
        duration_sec: number | null;
      }>)
    : [];

  return c.json({
    results: rows.map((r) => ({
      id: r.id,
      externalId: r.external_id,
      title: sanitizeTrackTitle(r.title) || r.title,
      artist: sanitizeTrackArtist(r.artist) || r.artist,
      album: r.album ?? undefined,
      bpm: r.bpm ?? undefined,
      key: r.key ?? undefined,
      durationSec: r.duration_sec ?? undefined,
      inStock: true,
      playedEarlierTonight: isPlayedEarlierTonight(session.id, r.title, r.artist),
    })),
  });
});

/** Open search: Spotify catalog (+ optional matches in DJ's synced library). */
app.get("/sessions/:code/tracks/search", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT * FROM sessions WHERE code = ?`)
    .get(code) as SessionRow | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);

  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 50);
  if (q.length < 2) {
    return c.json({ results: [], mode: "none" as const, streamingSearch: sessionUsesStreamingSearch(session) });
  }

  const streaming = sessionUsesStreamingSearch(session);
  const hits: TrackSearchHit[] = [];
  const seen = new Set<string>();

  const dedupeKey = (title: string, artist: string) =>
    `${normalizeTitle(title)}|${normalizeTitle(artist)}`;

  if (streaming) {
    const spotify = await searchSpotifyTracks(q, limit);
    for (const t of spotify) {
      const dk = dedupeKey(t.title, t.artist);
      seen.add(dk);
      hits.push({
        id: `spotify:${t.spotifyId}`,
        title: t.title,
        artist: t.artist,
        album: t.album,
        bpm: t.bpm,
        key: t.key,
        durationSec: t.durationSec,
        albumArtUrl: t.albumArtUrl,
        source: "spotify",
        inStock: false,
        spotifyId: t.spotifyId,
        playedEarlierTonight: isPlayedEarlierTonight(session.id, t.title, t.artist),
      });
    }
  }

  const localRows = db
    .prepare(
      `SELECT id, external_id, title, artist, album, bpm, key, duration_sec
       FROM tracks WHERE session_id = ?
       AND (lower(title) LIKE ? OR lower(artist) LIKE ?)
       ORDER BY title LIMIT ?`,
    )
    .all(session.id, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, limit) as Array<{
    id: string;
    external_id: string;
    title: string;
    artist: string;
    album: string | null;
    bpm: number | null;
    key: string | null;
    duration_sec: number | null;
  }>;

  for (const r of localRows) {
    const dk = dedupeKey(r.title, r.artist);
    if (seen.has(dk)) {
      const existing = hits.find((h) => dedupeKey(h.title, h.artist) === dk);
      if (existing) {
        existing.inStock = true;
        existing.libraryTrackId = r.id;
        if (!existing.bpm && r.bpm) existing.bpm = r.bpm;
        if (!existing.key && r.key) existing.key = r.key ?? undefined;
      }
      continue;
    }
    seen.add(dk);
    hits.push({
      id: r.id,
      title: sanitizeTrackTitle(r.title) || r.title,
      artist: sanitizeTrackArtist(r.artist) || r.artist,
      album: r.album ?? undefined,
      bpm: r.bpm ?? undefined,
      key: r.key ?? undefined,
      durationSec: r.duration_sec ?? undefined,
      source: "library",
      inStock: true,
      libraryTrackId: r.id,
      playedEarlierTonight: isPlayedEarlierTonight(session.id, r.title, r.artist),
    });
  }

  if (!streaming && hits.length === 0) {
    return c.json({
      results: [],
      mode: "library" as const,
      streamingSearch: false,
      hint: "Sync your library in the booth app, or configure Spotify API keys on the server.",
    });
  }

  return c.json({
    results: hits.slice(0, limit),
    mode: streaming ? ("spotify" as const) : ("library" as const),
    streamingSearch: streaming,
  });
});

app.post("/sessions/:sessionId/played-tracks", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as {
    tracks?: Array<{ title: string; artist: string; playedAt?: number }>;
  };
  const tracks = body.tracks ?? [];

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM played_tracks WHERE session_id = ?`).run(sessionId);
    const ins = db.prepare(
      `INSERT INTO played_tracks (id, session_id, title, artist, played_at) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const t of tracks) {
      if (!t.title?.trim()) continue;
      ins.run(
        id(),
        sessionId,
        t.title.trim(),
        t.artist?.trim() || "Unknown Artist",
        t.playedAt ?? null,
      );
    }
  });
  tx();

  return c.json({ synced: tracks.length });
});

app.post("/sessions/:code/requests", async (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT * FROM sessions WHERE code = ?`)
    .get(code) as SessionRow | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);

  const guestId = c.req.header("X-Q-Guest-Id")?.trim().slice(0, 64);
  if (!guestId) {
    return c.json({ error: "Missing guest id — refresh the page and try again." }, 400);
  }

  const maxPending = session.max_pending_requests ?? 20;
  const maxPerGuest = session.max_requests_per_guest ?? 3;

  const pendingCount = db
    .prepare(`SELECT COUNT(*) as n FROM requests WHERE session_id = ? AND status = 'pending'`)
    .get(session.id) as { n: number };
  if ((pendingCount?.n ?? 0) >= maxPending) {
    return c.json(
      {
        error: `The DJ queue is full (${maxPending} pending). Try again in a few minutes.`,
        code: "queue_full",
      },
      429,
    );
  }

  const guestCount = db
    .prepare(`SELECT COUNT(*) as n FROM requests WHERE session_id = ? AND guest_id = ?`)
    .get(session.id, guestId) as { n: number };
  if ((guestCount?.n ?? 0) >= maxPerGuest) {
    return c.json(
      {
        error: `You've reached the limit of ${maxPerGuest} requests for this set.`,
        code: "guest_limit",
      },
      429,
    );
  }

  const body = (await c.req.json()) as {
    title?: string;
    artist?: string;
    message?: string;
    trackId?: string;
    spotifyId?: string;
    bpm?: number;
    key?: string;
    albumArtUrl?: string;
  };

  const title = body.title?.trim();
  const artist = body.artist?.trim() || "Unknown Artist";
  if (!title) return c.json({ error: "Title required" }, 400);

  let inStock = false;
  let matchedTrackId: string | null = null;
  let source: RequestSource = "manual";
  let externalId: string | null = null;
  let reqBpm: number | null = body.bpm ?? null;
  let reqKey: string | null = body.key?.trim() || null;
  let albumArt: string | null = body.albumArtUrl?.trim() || null;

  if (body.spotifyId?.trim()) {
    source = "spotify";
    externalId = body.spotifyId.trim();
    if (reqBpm == null || !reqKey) {
      const feat = await getSpotifyTrackFeatures(externalId);
      if (reqBpm == null && feat.bpm) reqBpm = feat.bpm;
      if (!reqKey && feat.key) reqKey = feat.key;
    }
  }

  const libraryId = body.trackId?.trim();
  if (libraryId) {
    const track = db
      .prepare(`SELECT id, bpm, key FROM tracks WHERE id = ? AND session_id = ?`)
      .get(libraryId, session.id) as
      | { id: string; bpm: number | null; key: string | null }
      | undefined;
    if (track) {
      inStock = true;
      matchedTrackId = track.id;
      source = "library";
      if (reqBpm == null && track.bpm) reqBpm = track.bpm;
      if (!reqKey && track.key) reqKey = track.key;
    }
  } else {
    const match = db
      .prepare(
        `SELECT id, bpm, key FROM tracks WHERE session_id = ?
         AND lower(title) = lower(?) AND lower(artist) = lower(?)
         LIMIT 1`,
      )
      .get(session.id, title, artist) as
      | { id: string; bpm: number | null; key: string | null }
      | undefined;
    if (match) {
      inStock = true;
      matchedTrackId = match.id;
      source = source === "spotify" ? "spotify" : "library";
      if (reqBpm == null && match.bpm) reqBpm = match.bpm;
      if (!reqKey && match.key) reqKey = match.key;
    }
  }

  const requestId = id();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO requests (id, session_id, title, artist, message, in_stock, matched_track_id, status, created_at, updated_at, guest_id, source, external_id, bpm, key, album_art_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    requestId,
    session.id,
    title,
    artist,
    body.message?.trim() || null,
    inStock ? 1 : 0,
    matchedTrackId,
    now,
    now,
    guestId,
    source,
    externalId,
    reqBpm,
    reqKey,
    albumArt,
  );

  const inserted: RequestRow = {
    id: requestId,
    session_id: session.id,
    title,
    artist,
    message: body.message?.trim() || null,
    in_stock: inStock ? 1 : 0,
    matched_track_id: matchedTrackId,
    status: "pending",
    created_at: now,
    source,
    external_id: externalId,
    bpm: reqBpm,
    key: reqKey,
    album_art_url: albumArt,
  };

  return c.json({
    request: rowToRequest(inserted),
    message:
      "Request sent — it appears on the DJ's screen. No need to shout; they'll Accept or Decline when ready.",
  }, 201);
});

app.get("/sessions/:sessionId/sync-status", (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const pending = db
    .prepare(`SELECT COUNT(*) as n FROM requests WHERE session_id = ? AND status = 'pending'`)
    .get(sessionId) as { n: number };
  const total = db
    .prepare(`SELECT COUNT(*) as n FROM requests WHERE session_id = ?`)
    .get(sessionId) as { n: number };
  const lib = db
    .prepare(`SELECT library_synced_at FROM sessions WHERE id = ?`)
    .get(sessionId) as { library_synced_at: string | null } | undefined;

  const status: SyncStatus = {
    pendingCount: pending?.n ?? 0,
    totalRequests: total?.n ?? 0,
    librarySynced: Boolean(lib?.library_synced_at),
  };
  return c.json(status);
});

app.get("/sessions/:sessionId/requests", (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const since = c.req.query("since");
  const rows = since
    ? (db
        .prepare(
          `SELECT * FROM requests WHERE session_id = ? AND created_at > ? ORDER BY created_at ASC`,
        )
        .all(sessionId, since) as Array<Parameters<typeof rowToRequest>[0]>)
    : (db
        .prepare(`SELECT * FROM requests WHERE session_id = ? ORDER BY created_at ASC`)
        .all(sessionId) as Array<Parameters<typeof rowToRequest>[0]>);

  return c.json({ requests: rows.map(rowToRequest) });
});

app.patch("/sessions/:sessionId/requests/:requestId", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as { status?: string };
  if (!body.status || !["accepted", "declined"].includes(body.status)) {
    return c.json({ error: "status must be accepted or declined" }, 400);
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE requests SET status = ?, updated_at = ? WHERE id = ? AND session_id = ?`,
    )
    .run(body.status, now, c.req.param("requestId"), sessionId);

  if (result.changes === 0) return c.json({ error: "Request not found" }, 404);

  const row = db
    .prepare(`SELECT * FROM requests WHERE id = ?`)
    .get(c.req.param("requestId")) as Parameters<typeof rowToRequest>[0];

  let suggestions: TransitionSuggestion[] = [];
  if (body.status === "accepted") {
    const base = buildSuggestions(
      sessionId,
      row.matched_track_id,
      row.title,
      row.artist,
    );
    suggestions = getPlan(c) === "pro"
      ? buildProSuggestions(base, sessionId, row.matched_track_id, row.title, row.artist)
      : base;
  }

  return c.json({ request: rowToRequest(row), suggestions, plan: getPlan(c) });
});

const port = parseInt(process.env.PORT || "8787", 10);
const hostname = process.env.Q_HOST || "0.0.0.0";
console.log(`Q API listening on http://localhost:${port} (LAN: http://${hostname === "0.0.0.0" ? "<your-ip>" : hostname}:${port})`);
serve({ fetch: app.fetch, port, hostname });
