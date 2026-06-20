import type { MixSuggestionHit } from "@q/shared";
import { scoreMixability } from "@q/shared";
import { db } from "./db.js";

type TrackRow = {
  id: string;
  external_id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string | null;
};

export function buildMixSuggestions(
  sessionId: string,
  opts: {
    bpm?: number | null;
    key?: string | null;
    title?: string | null;
    artist?: string | null;
    limit?: number;
    excludePlayedTonight?: boolean;
  },
): MixSuggestionHit[] {
  const limit = Math.min(24, Math.max(1, opts.limit ?? 12));
  const rows = db
    .prepare(
      `SELECT id, external_id, title, artist, bpm, key FROM tracks WHERE session_id = ? LIMIT 8000`,
    )
    .all(sessionId) as TrackRow[];

  if (rows.length === 0) return [];

  let playedTitles: Set<string> | null = null;
  if (opts.excludePlayedTonight) {
    const played = db
      .prepare(`SELECT title, artist FROM played_tracks WHERE session_id = ?`)
      .all(sessionId) as { title: string; artist: string }[];
    playedTitles = new Set(played.map((p) => `${p.title}\0${p.artist}`.toLowerCase()));
  }

  const fromTitle = opts.title?.trim().toLowerCase();
  const fromArtist = opts.artist?.trim().toLowerCase();

  const scored = rows
    .filter((r) => {
      if (fromTitle && r.title.toLowerCase() === fromTitle && fromArtist && r.artist.toLowerCase() === fromArtist) {
        return false;
      }
      if (playedTitles?.has(`${r.title}\0${r.artist}`.toLowerCase())) return false;
      return true;
    })
    .map((r) => {
      const mix = scoreMixability({
        fromBpm: opts.bpm,
        fromKey: opts.key,
        toBpm: r.bpm,
        toKey: r.key,
      });
      return {
        id: r.id,
        externalId: r.external_id,
        title: r.title,
        artist: r.artist,
        bpm: r.bpm ?? undefined,
        key: r.key ?? undefined,
        score: mix.score,
        matchLabel: mix.label,
        matchDetail: mix.detail,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
