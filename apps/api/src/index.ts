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
import { buildMixSuggestions } from "./mix-suggestions.js";
import { buildSuggestions } from "./suggestions.js";
import {
  getDjCurrentlyPlaying,
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
  SessionLiveStatus,
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

/**
 * Tauri auto-updater manifest. Proxies the latest GitHub Release so DJs get
 * notified in-app when a new build is available — no manual JSON to maintain.
 *
 * Env vars:
 *   Q_GITHUB_REPO    "owner/repo" (e.g. "qdj/q") — required
 *   Q_GITHUB_TOKEN   optional, for private repos
 */
interface GithubAsset {
  name: string;
  browser_download_url: string;
}
interface GithubRelease {
  tag_name: string;
  name?: string;
  body?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets: GithubAsset[];
}

const updateManifestCache: { fetchedAt: number; value: GithubRelease | null } = {
  fetchedAt: 0,
  value: null,
};

async function fetchLatestRelease(): Promise<GithubRelease | null> {
  const repo = process.env.Q_GITHUB_REPO;
  if (!repo) return null;
  const ttlMs = 60_000;
  if (Date.now() - updateManifestCache.fetchedAt < ttlMs && updateManifestCache.value) {
    return updateManifestCache.value;
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "q-updater",
  };
  if (process.env.Q_GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.Q_GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  if (!res.ok) return null;
  const release = (await res.json()) as GithubRelease;
  updateManifestCache.value = release;
  updateManifestCache.fetchedAt = Date.now();
  return release;
}

interface AssetMatchers {
  exe: RegExp;
  sig: RegExp;
}

const TARGET_ASSETS: Record<string, AssetMatchers> = {
  "windows-x86_64": {
    exe: /_x64-setup\.exe$/i,
    sig: /_x64-setup\.exe\.sig$/i,
  },
  "darwin-aarch64": {
    exe: /\.app\.tar\.gz$/i,
    sig: /\.app\.tar\.gz\.sig$/i,
  },
  "darwin-x86_64": {
    exe: /\.app\.tar\.gz$/i,
    sig: /\.app\.tar\.gz\.sig$/i,
  },
  "linux-x86_64": {
    exe: /\.AppImage$/i,
    sig: /\.AppImage\.sig$/i,
  },
};

app.get("/desktop/update.json", async (c) => {
  const target = c.req.query("target") ?? "windows-x86_64";
  const current = c.req.query("current_version")?.replace(/^v/, "") ?? "0.0.0";

  const release = await fetchLatestRelease().catch(() => null);
  if (!release || release.draft) {
    return c.body(null, 204);
  }

  const version = (release.tag_name || "").replace(/^v/, "");
  if (!version) return c.body(null, 204);
  if (version === current) return c.body(null, 204);

  const matchers = TARGET_ASSETS[target];
  if (!matchers) return c.body(null, 204);

  const exe = release.assets.find((a) => matchers.exe.test(a.name));
  const sig = release.assets.find((a) => matchers.sig.test(a.name));
  if (!exe || !sig) return c.body(null, 204);

  let signature = "";
  try {
    const sigRes = await fetch(sig.browser_download_url);
    if (sigRes.ok) signature = (await sigRes.text()).trim();
  } catch {
    /* If sig fetch fails the updater will skip the install. */
  }
  if (!signature) return c.body(null, 204);

  return c.json({
    version,
    pub_date: release.published_at ?? new Date().toISOString(),
    notes: release.body ?? "",
    platforms: {
      [target]: {
        signature,
        url: exe.browser_download_url,
      },
    },
  });
});

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
  library_source?: string | null;
  is_live?: number | null;
  ended_at?: string | null;
  dj_user_id?: string | null;
  public_wall?: number | null;
  allow_shoutouts?: number | null;
};

type LibrarySourceValue = "local" | "spotify" | "both";

function parseLibrarySource(value: unknown): LibrarySourceValue | undefined {
  if (value === "local" || value === "spotify" || value === "both") return value;
  return undefined;
}

/**
 * Map the DJ's gig-start library profile to the streaming-search flag.
 * - `local`: crowd should ONLY see tracks the DJ has on disk (no Spotify hits).
 * - `spotify` or `both`: crowd needs Spotify catalog access in addition to
 *   whatever local library exists.
 * - `undefined` (legacy sessions): preserve the previous default behaviour
 *   (streaming-on whenever Spotify is configured).
 */
function streamingFlagFor(source: LibrarySourceValue | undefined): number {
  if (source === "local") return 0;
  if (source === "spotify" || source === "both") return 1;
  return 1;
}

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
  decline_reason?: string | null;
};

function clampLimit(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function sessionUsesStreamingSearch(row: SessionRow): boolean {
  return isSpotifyConfigured() && (row.streaming_search ?? 1) !== 0;
}

function djHandleForUser(djUserId: string | null | undefined): string | undefined {
  if (!djUserId) return undefined;
  const user = db
    .prepare(`SELECT handle FROM users WHERE id = ?`)
    .get(djUserId) as { handle: string } | undefined;
  return user?.handle;
}

function sessionIsLive(row: SessionRow): boolean {
  return (row.is_live ?? 1) !== 0;
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
    librarySource: parseLibrarySource(row.library_source),
    isLive: sessionIsLive(row),
    endedAt: row.ended_at ?? undefined,
    djHandle: djHandleForUser(row.dj_user_id),
    publicWall: (row.public_wall ?? 0) !== 0,
    allowShoutouts: (row.allow_shoutouts ?? 1) !== 0,
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
    declineReason: (row.decline_reason as CrowdRequest["declineReason"]) ?? undefined,
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

const HOT_PLAY_THRESHOLD = 3;
const NEW_TRACK_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function getSessionDjUserId(sessionId: string): string | null {
  const row = db
    .prepare(`SELECT dj_user_id FROM sessions WHERE id = ?`)
    .get(sessionId) as { dj_user_id: string | null } | undefined;
  return row?.dj_user_id ?? null;
}

function isAddedRecently(addedAtIso: string | null | undefined): boolean {
  if (!addedAtIso) return false;
  const ts = Date.parse(addedAtIso);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < NEW_TRACK_WINDOW_MS;
}

function isHotForDj(djUserId: string | null, title: string, artist: string): boolean {
  if (!djUserId) return false;
  const row = db
    .prepare(
      `SELECT count FROM dj_play_counts WHERE dj_user_id = ? AND title_key = ? AND artist_key = ?`,
    )
    .get(djUserId, title.toLowerCase(), artist.toLowerCase()) as
    | { count: number }
    | undefined;
  return (row?.count ?? 0) >= HOT_PLAY_THRESHOLD;
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

/** Phase 1.5 — Spotify booth parity stub (OAuth currently-playing TBD). */
app.get("/sessions/:sessionId/spotify/now-playing", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);
  const sessRow = db
    .prepare(`SELECT dj_user_id FROM sessions WHERE id = ?`)
    .get(sessionId) as { dj_user_id: string | null } | undefined;
  if (!sessRow?.dj_user_id) {
    return c.json({
      configured: isSpotifyConfigured(),
      oauthLinked: false,
      playing: null,
      hint: "Sign in on desktop to link your DJ account.",
    });
  }
  const playing = await getDjCurrentlyPlaying(sessRow.dj_user_id);
  return c.json({
    configured: isSpotifyConfigured(),
    oauthLinked: false,
    playing,
    hint: playing
      ? undefined
      : "Spotify OAuth for booth tracking ships in v0.1.9 — use Serato History or desktop live push for now.",
  });
});


app.post("/sessions", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    displayName?: string;
    maxPendingRequests?: number;
    maxRequestsPerGuest?: number;
    librarySource?: unknown;
    publicWall?: boolean;
    allowShoutouts?: boolean;
  };
  const sessionId = id();
  const code = sessionCode();
  const djToken = id();
  const now = new Date().toISOString();
  const name = body.name?.trim() || "Tonight";
  let displayName = body.displayName?.trim() || name;
  const maxPending = clampLimit(body.maxPendingRequests ?? 20, 1, 100);
  const maxPerGuest = clampLimit(body.maxRequestsPerGuest ?? 3, 1, 20);
  const librarySource = parseLibrarySource(body.librarySource);
  // Local-only DJs explicitly want their crowd to ONLY see tracks the booth
  // has on disk — we honour that even if Spotify is configured server-side.
  const streamingSearch = streamingFlagFor(librarySource);
  const publicWall = body.publicWall ? 1 : 0;
  const allowShoutouts = body.allowShoutouts === false ? 0 : 1;

  const accountUser = await resolveAccount(c);
  const djUserId = accountUser?.id ?? null;
  if (accountUser && (!body.displayName?.trim() || displayName === name)) {
    displayName = accountUser.display_name;
  }

  db.prepare(
    `INSERT INTO sessions (id, code, name, display_name, dj_token, created_at, max_pending_requests, max_requests_per_guest, dj_user_id, streaming_search, library_source, public_wall, allow_shoutouts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    streamingSearch,
    librarySource ?? null,
    publicWall,
    allowShoutouts,
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
      streamingSearch: streamingSearch !== 0 && isSpotifyConfigured(),
      librarySource,
      publicWall: publicWall !== 0,
      allowShoutouts: allowShoutouts !== 0,
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

  // If the DJ flips their library profile mid-gig (e.g. realises they're
  // also pulling from Spotify), reshape the crowd's search scope to match.
  const nextLibrarySource =
    body.librarySource !== undefined
      ? parseLibrarySource(body.librarySource) ?? null
      : (parseLibrarySource(row.library_source) ?? null);
  const streamingSearch =
    body.librarySource !== undefined
      ? streamingFlagFor(nextLibrarySource ?? undefined)
      : (row.streaming_search ?? 1);
  const publicWall =
    body.publicWall !== undefined ? (body.publicWall ? 1 : 0) : (row.public_wall ?? 0);
  const allowShoutouts =
    body.allowShoutouts !== undefined
      ? body.allowShoutouts
        ? 1
        : 0
      : (row.allow_shoutouts ?? 1);

  db.prepare(
    `UPDATE sessions SET display_name = ?, max_pending_requests = ?, max_requests_per_guest = ?, library_source = ?, streaming_search = ?, public_wall = ?, allow_shoutouts = ? WHERE id = ?`,
  ).run(
    displayName,
    maxPending,
    maxPerGuest,
    nextLibrarySource,
    streamingSearch,
    publicWall,
    allowShoutouts,
    sessionId,
  );

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

/** Lightweight poll for crowd tabs — detects end gig without full session payload. */
app.get("/sessions/:code/status", (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const row = db
    .prepare(`SELECT code, is_live, ended_at FROM sessions WHERE code = ?`)
    .get(code) as { code: string; is_live: number | null; ended_at: string | null } | undefined;
  if (!row) return c.json({ error: "Session not found" }, 404);
  return c.json({
    code: row.code,
    isLive: (row.is_live ?? 1) !== 0,
    endedAt: row.ended_at ?? undefined,
  });
});

/** Public now-playing for crowd celebration (desktop pushes via live-status). */
app.get("/sessions/:code/now-playing", (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT id, is_live FROM sessions WHERE code = ?`)
    .get(code) as { id: string; is_live: number | null } | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);
  if ((session.is_live ?? 1) === 0) return c.json({ nowPlaying: null });

  const row = db
    .prepare(
      `SELECT title, artist, bpm, key, updated_at FROM session_live_status WHERE session_id = ?`,
    )
    .get(session.id) as
    | {
        title: string;
        artist: string;
        bpm: number | null;
        key: string | null;
        updated_at: string;
      }
    | undefined;
  if (!row?.title?.trim()) return c.json({ nowPlaying: null });
  return c.json({
    nowPlaying: {
      title: row.title,
      artist: row.artist,
      bpm: row.bpm ?? undefined,
      key: row.key ?? undefined,
      updatedAt: row.updated_at,
    },
  });
});

/** Live request wall for the crowd — pending + accepted, no guest ids. */
app.get("/sessions/:code/wall", (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT id, public_wall, is_live FROM sessions WHERE code = ?`)
    .get(code) as
    | { id: string; public_wall: number | null; is_live: number | null }
    | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);
  if ((session.public_wall ?? 0) === 0) {
    return c.json({ enabled: false, requests: [] });
  }
  if ((session.is_live ?? 1) === 0) {
    return c.json({ enabled: false, requests: [] });
  }

  const rows = db
    .prepare(
      `SELECT id, title, artist, message, status, created_at, bpm, key
       FROM requests
       WHERE session_id = ? AND status IN ('pending', 'accepted')
       ORDER BY created_at DESC
       LIMIT 40`,
    )
    .all(session.id) as Array<{
      id: string;
      title: string;
      artist: string;
      message: string | null;
      status: string;
      created_at: string;
      bpm: number | null;
      key: string | null;
    }>;

  return c.json({
    enabled: true,
    requests: rows.map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      message: r.message?.trim() || undefined,
      status: r.status,
      createdAt: r.created_at,
      bpm: r.bpm ?? undefined,
      key: r.key ?? undefined,
    })),
  });
});

/** Post-gig rating from crowd (one per guest per session). */
app.post("/sessions/:code/rating", async (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const row = db
    .prepare(`SELECT id, is_live FROM sessions WHERE code = ?`)
    .get(code) as { id: string; is_live: number | null } | undefined;
  if (!row) return c.json({ error: "Session not found" }, 404);
  if ((row.is_live ?? 1) !== 0) {
    return c.json({ error: "Rate the set after it ends.", code: "gig_live" }, 403);
  }

  const guestId = c.req.header("X-Q-Guest-Id")?.trim().slice(0, 64);
  if (!guestId) {
    return c.json({ error: "Missing guest id — refresh and try again." }, 400);
  }

  const body = (await c.req.json()) as { score?: number; comment?: string | null };
  const scoreRaw = body.score != null ? Math.round(Number(body.score)) : null;
  const comment =
    body.comment !== undefined
      ? String(body.comment).trim().slice(0, 280) || null
      : undefined;

  const existing = db
    .prepare(`SELECT score, comment FROM gig_ratings WHERE session_id = ? AND guest_id = ?`)
    .get(row.id, guestId) as { score: number; comment: string | null } | undefined;

  const score =
    scoreRaw != null && Number.isFinite(scoreRaw) && scoreRaw >= 1 && scoreRaw <= 5
      ? scoreRaw
      : existing?.score;

  if (score == null || !Number.isFinite(score) || score < 1 || score > 5) {
    return c.json({ error: "Score must be 1–5" }, 400);
  }

  const now = new Date().toISOString();
  const finalComment = comment !== undefined ? comment : (existing?.comment ?? null);

  db.prepare(
    `INSERT INTO gig_ratings (session_id, guest_id, score, comment, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(session_id, guest_id) DO UPDATE SET
       score = excluded.score,
       comment = COALESCE(excluded.comment, gig_ratings.comment),
       created_at = excluded.created_at`,
  ).run(row.id, guestId, score, finalComment, now);

  return c.json({ ok: true, score, comment: finalComment });
});

app.post("/sessions/:sessionId/library", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json()) as { tracks?: TrackRecord[] };
  const tracks = body.tracks ?? [];
  const now = new Date().toISOString();

  // Snapshot existing tracks so we can preserve their `added_at` across the
  // re-sync. external_id is unique per session.
  const existingRows = db
    .prepare(`SELECT external_id, added_at FROM tracks WHERE session_id = ?`)
    .all(sessionId) as Array<{ external_id: string; added_at: string | null }>;
  const existingAddedAt = new Map<string, string>();
  for (const r of existingRows) {
    if (r.added_at) existingAddedAt.set(r.external_id, r.added_at);
  }

  const del = db.prepare(`DELETE FROM tracks WHERE session_id = ?`);
  const ins = db.prepare(
    `INSERT INTO tracks (id, session_id, external_id, title, artist, album, bpm, key, duration_sec, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    del.run(sessionId);
    for (const t of tracks) {
      const addedAt = existingAddedAt.get(t.externalId) ?? now;
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
        addedAt,
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
          `SELECT id, external_id, title, artist, album, bpm, key, duration_sec, added_at
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
        added_at: string | null;
      }>)
    : [];

  const djUserId = getSessionDjUserId(session.id);
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
      isNew: isAddedRecently(r.added_at),
      isHot: isHotForDj(djUserId, r.title, r.artist),
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
    // Wrapped in try/catch so a Spotify outage never breaks crowd search —
    // we still want to return any local-library matches we have.
    try {
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
    } catch (e) {
      console.error(
        `[search] searchSpotifyTracks threw for q="${q}":`,
        e instanceof Error ? `${e.message}\n${e.stack}` : e,
      );
    }
  }

  const localRows = db
    .prepare(
      `SELECT id, external_id, title, artist, album, bpm, key, duration_sec, added_at
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
    added_at: string | null;
  }>;

  const djUserId = getSessionDjUserId(session.id);

  for (const r of localRows) {
    const dk = dedupeKey(r.title, r.artist);
    if (seen.has(dk)) {
      const existing = hits.find((h) => dedupeKey(h.title, h.artist) === dk);
      if (existing) {
        existing.inStock = true;
        existing.libraryTrackId = r.id;
        if (!existing.bpm && r.bpm) existing.bpm = r.bpm;
        if (!existing.key && r.key) existing.key = r.key ?? undefined;
        if (isAddedRecently(r.added_at)) existing.isNew = true;
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
      isNew: isAddedRecently(r.added_at),
      isHot: isHotForDj(djUserId, r.title, r.artist),
    });
  }

  // Spotify hits also get a HOT flag if the DJ has played that track often.
  if (djUserId) {
    for (const hit of hits) {
      if (!hit.isHot) {
        hit.isHot = isHotForDj(djUserId, hit.title, hit.artist);
      }
    }
  }

  if (hits.length === 0) {
    const localCount = (
      db.prepare(`SELECT COUNT(*) as n FROM tracks WHERE session_id = ?`).get(session.id) as {
        n: number;
      }
    ).n;
    if (!streaming) {
      return c.json({
        results: [],
        mode: "library" as const,
        streamingSearch: false,
        hint:
          localCount === 0
            ? "The DJ hasn't synced their library yet. In Q on the laptop: Auto-import Serato/Rekordbox, then Sync now."
            : "No matches in the DJ's library for that search — try different words or request manually below.",
      });
    }
    return c.json({
      results: [],
      mode: "spotify" as const,
      streamingSearch: true,
      hint:
        localCount === 0
          ? "No Spotify matches. Try different words, or ask the DJ to sync their crate (Auto-import + Sync in Q)."
          : "No Spotify matches for that search — try different words.",
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

  // Look up the DJ user so we can also bump cross-session play counts.
  const sessRow = db
    .prepare(`SELECT dj_user_id FROM sessions WHERE id = ?`)
    .get(sessionId) as { dj_user_id: string | null } | undefined;
  const djUserId = sessRow?.dj_user_id ?? null;
  const nowIso = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM played_tracks WHERE session_id = ?`).run(sessionId);
    const insPlay = db.prepare(
      `INSERT INTO played_tracks (id, session_id, title, artist, played_at) VALUES (?, ?, ?, ?, ?)`,
    );
    const upsertCount = db.prepare(
      `INSERT INTO dj_play_counts (dj_user_id, title_key, artist_key, count, last_played_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(dj_user_id, title_key, artist_key)
       DO UPDATE SET count = count + 1, last_played_at = excluded.last_played_at`,
    );
    for (const t of tracks) {
      if (!t.title?.trim()) continue;
      const title = t.title.trim();
      const artist = t.artist?.trim() || "Unknown Artist";
      insPlay.run(id(), sessionId, title, artist, t.playedAt ?? null);
      if (djUserId) {
        upsertCount.run(djUserId, title.toLowerCase(), artist.toLowerCase(), nowIso);
      }
    }
  });
  tx();

  return c.json({ synced: tracks.length });
});

/** Desktop pushes now-playing for Q Booth mobile (tiny JSON, ~1KB). */
app.post("/sessions/:sessionId/live-status", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const body = (await c.req.json().catch(() => ({}))) as {
    title?: string;
    artist?: string;
    bpm?: number;
    key?: string;
  };
  const title = body.title?.trim();
  const artist = body.artist?.trim();
  if (!title) return c.json({ error: "title required" }, 400);

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO session_live_status (session_id, title, artist, bpm, key, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       title = excluded.title,
       artist = excluded.artist,
       bpm = excluded.bpm,
       key = excluded.key,
       updated_at = excluded.updated_at`,
  ).run(sessionId, title, artist || "Unknown Artist", body.bpm ?? null, body.key ?? null, now);

  const status: SessionLiveStatus = {
    sessionId,
    title,
    artist: artist || "Unknown Artist",
    bpm: body.bpm,
    key: body.key,
    updatedAt: now,
  };
  return c.json({ status });
});

app.get("/sessions/:sessionId/live-status", (c) => {
  const sessionId = c.req.param("sessionId");
  const row = db
    .prepare(
      `SELECT session_id, title, artist, bpm, key, updated_at FROM session_live_status WHERE session_id = ?`,
    )
    .get(sessionId) as
    | {
        session_id: string;
        title: string;
        artist: string;
        bpm: number | null;
        key: string | null;
        updated_at: string;
      }
    | undefined;
  if (!row) return c.json({ status: null as SessionLiveStatus | null });
  return c.json({
    status: {
      sessionId: row.session_id,
      title: row.title,
      artist: row.artist,
      bpm: row.bpm ?? undefined,
      key: row.key ?? undefined,
      updatedAt: row.updated_at,
    } satisfies SessionLiveStatus,
  });
});

/** Harmonic / tempo-ranked next tracks from synced library (Mix Coach). */
app.get("/sessions/:sessionId/mix-suggestions", (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);

  const useLive = c.req.query("fromLive") === "1";
  let bpm: number | undefined;
  let key: string | undefined;
  let title: string | undefined;
  let artist: string | undefined;

  const qBpm = c.req.query("bpm");
  if (qBpm) {
    const n = Number(qBpm);
    if (Number.isFinite(n)) bpm = n;
  }
  key = c.req.query("key")?.trim() || undefined;
  title = c.req.query("title")?.trim() || undefined;
  artist = c.req.query("artist")?.trim() || undefined;

  if (useLive) {
    const live = db
      .prepare(
        `SELECT title, artist, bpm, key FROM session_live_status WHERE session_id = ?`,
      )
      .get(sessionId) as
      | { title: string; artist: string; bpm: number | null; key: string | null }
      | undefined;
    if (live) {
      title = live.title;
      artist = live.artist;
      if (live.bpm != null) bpm = live.bpm;
      if (live.key) key = live.key;
    }
  }

  const suggestions = buildMixSuggestions(sessionId, {
    bpm,
    key,
    title,
    artist,
    excludePlayedTonight: c.req.query("excludePlayed") !== "0",
    limit: Number(c.req.query("limit") ?? 12),
  });

  return c.json({
    from: { title, artist, bpm, key },
    suggestions,
  });
});

/** Marks session not live — unlocks permanent QR offline state. */
app.post("/sessions/:sessionId/end", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!requireDj(c, sessionId)) return c.json({ error: "Unauthorized" }, 401);
  const now = new Date().toISOString();
  db.prepare(`UPDATE sessions SET is_live = 0, ended_at = ? WHERE id = ?`).run(now, sessionId);
  db.prepare(`DELETE FROM session_live_status WHERE session_id = ?`).run(sessionId);
  return c.json({ ok: true, endedAt: now });
});

app.post("/sessions/:code/requests", async (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT * FROM sessions WHERE code = ?`)
    .get(code) as SessionRow | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);
  if (!sessionIsLive(session)) {
    return c.json(
      { error: "This set is over — requests are closed.", code: "gig_ended" },
      403,
    );
  }

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

  const shoutoutsOk = (session.allow_shoutouts ?? 1) !== 0;
  let guestMessage = body.message?.trim() || null;
  if (guestMessage && !shoutoutsOk) guestMessage = null;
  if (guestMessage && guestMessage.length > 200) {
    guestMessage = guestMessage.slice(0, 200);
  }

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
    guestMessage,
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
    message: guestMessage,
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

/**
 * Public status lookup for a single request — used by the crowd app to follow
 * what happened to the song they just submitted, including the decline reason
 * if the DJ picked one. Intentionally no auth: we only return non-sensitive
 * fields (status, decline_reason) and clamp to the same gig the URL is for.
 */
app.get("/sessions/:code/requests/:requestId/status", (c) => {
  const code = c.req.param("code").trim().toUpperCase();
  const session = db
    .prepare(`SELECT id FROM sessions WHERE code = ?`)
    .get(code) as { id: string } | undefined;
  if (!session) return c.json({ error: "Session not found" }, 404);
  const requestId = c.req.param("requestId");
  const row = db
    .prepare(
      `SELECT status, decline_reason FROM requests WHERE id = ? AND session_id = ?`,
    )
    .get(requestId, session.id) as
    | { status: string; decline_reason: string | null }
    | undefined;
  if (!row) return c.json({ error: "Request not found" }, 404);
  return c.json({
    status: row.status as CrowdRequest["status"],
    declineReason: (row.decline_reason as CrowdRequest["declineReason"]) ?? undefined,
  });
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

  const body = (await c.req.json()) as { status?: string; declineReason?: string };
  if (!body.status || !["accepted", "declined"].includes(body.status)) {
    return c.json({ error: "status must be accepted or declined" }, 400);
  }

  const allowedReasons = new Set([
    "vibe",
    "genre",
    "tempo",
    "explicit",
    "duplicate",
    "already_played",
    "not_now",
    "unavailable",
    "other",
  ]);
  const declineReason =
    body.status === "declined" && body.declineReason && allowedReasons.has(body.declineReason)
      ? body.declineReason
      : null;

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE requests SET status = ?, decline_reason = ?, updated_at = ? WHERE id = ? AND session_id = ?`,
    )
    .run(body.status, declineReason, now, c.req.param("requestId"), sessionId);

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
    const live = db
      .prepare(`SELECT bpm, key FROM session_live_status WHERE session_id = ?`)
      .get(sessionId) as { bpm: number | null; key: string | null } | undefined;
    suggestions = getPlan(c) === "pro"
      ? buildProSuggestions(
          base,
          sessionId,
          row.matched_track_id,
          row.title,
          row.artist,
          live?.bpm,
          live?.key,
        )
      : base;
  }

  return c.json({ request: rowToRequest(row), suggestions, plan: getPlan(c) });
});

const port = parseInt(process.env.PORT || "8787", 10);
const hostname = process.env.Q_HOST || "0.0.0.0";
console.log(`Q API listening on http://localhost:${port} (LAN: http://${hostname === "0.0.0.0" ? "<your-ip>" : hostname}:${port})`);
serve({ fetch: app.fetch, port, hostname });
