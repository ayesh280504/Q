/**
 * "Q Requests" auto-crate: writes accepted-request file paths to a real
 * playlist on disk so the DJ never has to search the song up in Serato or
 * Rekordbox after accepting.
 *
 *  - `~/Music/Q Requests.m3u8` — drag into Rekordbox (File → Import Playlist)
 *    or open directly in Serato. Works for both apps.
 *  - `~/Music/_Serato_/Subcrates/Q Requests.crate` — Serato auto-loads this
 *    on its next library refresh, so accepted tracks just appear in the
 *    sidebar with no manual import.
 *
 * Tracks are looked up by `externalId` against the import snapshot captured
 * in `lastImportRef`, so the API never needs to know the local file path.
 */

import type { TrackRecord } from "@q/shared";
import { tracksMatch } from "./trackMatch";

const STORAGE_KEY_PREFIX = "q-requests-crate";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function storageKey(sessionId: string): string {
  return `${STORAGE_KEY_PREFIX}:${sessionId}`;
}

interface QueueCrateState {
  /** Absolute local file paths, in accept order. Duplicates are de-duped. */
  paths: string[];
  /** "serato" | "rekordbox" — informs which crate format to write. */
  djSoftware: "serato" | "rekordbox";
}

function loadState(sessionId: string): QueueCrateState {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return { paths: [], djSoftware: "serato" };
    const parsed = JSON.parse(raw) as Partial<QueueCrateState>;
    return {
      paths: Array.isArray(parsed.paths) ? parsed.paths : [],
      djSoftware: parsed.djSoftware === "rekordbox" ? "rekordbox" : "serato",
    };
  } catch {
    return { paths: [], djSoftware: "serato" };
  }
}

function saveState(sessionId: string, state: QueueCrateState) {
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/** Wipe the saved queue for a new gig. */
export function resetQueueCrate(sessionId: string) {
  try {
    localStorage.removeItem(storageKey(sessionId));
  } catch {
    /* ignore */
  }
}

export interface CrateWriteResult {
  m3u8Path?: string;
  seratoCratePath?: string;
  /** Surface-level message safe to show in the UI. */
  message: string;
}

async function writeFiles(
  paths: string[],
  djSoftware: "serato" | "rekordbox",
): Promise<CrateWriteResult> {
  if (!isTauri()) {
    return { message: "Auto-crate works in the installed booth app, not browser dev mode." };
  }
  const { invoke } = await import("@tauri-apps/api/core");

  let m3u8Path: string | undefined;
  try {
    m3u8Path = await invoke<string>("write_q_requests_playlist", { trackPaths: paths });
  } catch (err) {
    return {
      message: `Couldn't write Q Requests playlist: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let seratoCratePath: string | undefined;
  if (djSoftware === "serato") {
    try {
      seratoCratePath = await invoke<string>("write_serato_q_requests_crate", {
        trackPaths: paths,
      });
    } catch {
      // Serato folder might not exist (first install, never opened Serato).
      // Fall back to the m3u8 — DJ can still load it manually.
    }
  }

  const niceMessage = seratoCratePath
    ? `Added to your "Q Requests" crate in Serato.`
    : djSoftware === "rekordbox"
      ? // First-accept-of-the-gig nudge: surface the path so the DJ can import
        // the playlist into Rekordbox once. After that they can ignore this
        // message and we'll keep silently appending tracks in the background.
        paths.length === 1 && m3u8Path
        ? `Q Requests playlist saved to ${m3u8Path}. In Rekordbox: File → Import Playlist → pick this file once. Future accepts will keep adding here automatically.`
        : `Added to Q Requests.m3u8 — your imported playlist in Rekordbox is updating.`
      : `Added to Q Requests.m3u8 — open it from Serato → Files.`;

  return { m3u8Path, seratoCratePath, message: niceMessage };
}

/**
 * Adds the accepted track to the Q Requests crate. Quietly no-ops if we don't
 * know the track's local file path (e.g. crowd requested via Spotify, not the
 * DJ's synced library).
 */
export async function addToQueueCrate(opts: {
  sessionId: string;
  djSoftware: "serato" | "rekordbox";
  track: { externalId?: string; title: string; artist: string };
  /** externalId → TrackRecord (with localPath) snapshot from the last import. */
  importIndex: Map<string, TrackRecord>;
}): Promise<CrateWriteResult | null> {
  const { sessionId, djSoftware, track, importIndex } = opts;
  const local = track.externalId ? importIndex.get(track.externalId) : undefined;
  const path = local?.localPath?.trim();
  if (!path) return null;

  const state = loadState(sessionId);
  state.djSoftware = djSoftware;
  if (!state.paths.includes(path)) state.paths.push(path);
  saveState(sessionId, state);

  return writeFiles(state.paths, djSoftware);
}

/** Returns the saved local file paths for this gig (in accept order). */
export function getQueueCratePaths(sessionId: string): string[] {
  return loadState(sessionId).paths;
}

/** Build an externalId → TrackRecord index from an import snapshot. */
export function buildImportIndex(tracks: TrackRecord[]): Map<string, TrackRecord> {
  const out = new Map<string, TrackRecord>();
  for (const t of tracks) {
    if (t.externalId) out.set(t.externalId, t);
  }
  return out;
}

/** Resolve a library row (with localPath) from sync id or loose title/artist match. */
export function lookupInImportIndex(
  importIndex: Map<string, TrackRecord>,
  opts: { externalId?: string | null; matchedTrackId?: string | null; title?: string; artist?: string },
): TrackRecord | undefined {
  for (const id of [opts.matchedTrackId, opts.externalId]) {
    if (!id) continue;
    const hit = importIndex.get(id);
    if (hit) return hit;
  }
  const title = opts.title?.trim();
  if (!title) return undefined;
  for (const t of importIndex.values()) {
    if (tracksMatch(t.title, t.artist, title, opts.artist ?? "")) return t;
  }
  return undefined;
}
