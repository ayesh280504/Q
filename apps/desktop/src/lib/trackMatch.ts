export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeArtist(s: string): string {
  return normalizeTitle(s);
}

function isUnknownArtist(artist: string): boolean {
  return !artist || artist === "unknown" || artist === "unknown artist";
}

/** Loose match for “same song” between Serato, requests, and library rows. */
export function tracksMatch(
  aTitle: string,
  aArtist: string,
  bTitle: string,
  bArtist: string,
): boolean {
  const t1 = normalizeTitle(aTitle);
  const t2 = normalizeTitle(bTitle);
  if (!t1 || !t2) return false;

  const titleOk = t1 === t2 || t1.includes(t2) || t2.includes(t1);
  if (!titleOk) return false;

  const r1 = normalizeArtist(aArtist);
  const r2 = normalizeArtist(bArtist);
  if (isUnknownArtist(r1) || isUnknownArtist(r2)) return true;

  return r1 === r2 || r1.includes(r2) || r2.includes(r1);
}

export interface NowPlaying {
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  playedAt?: number;
  /** Track length in seconds — used by the auto-advance timer for Rekordbox. */
  durationSec?: number;
}

export interface UpNextItem {
  requestId: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  playedEarlierTonight?: boolean;
  /** Carried through from the imported library so auto-advance can time it. */
  durationSec?: number;
}

export interface PlayedTrack {
  title: string;
  artist: string;
  playedAt?: number;
}

export function pruneQueueAgainstNowPlaying(
  nowPlaying: NowPlaying | null,
  items: UpNextItem[],
): UpNextItem[] {
  if (!nowPlaying) return items;
  return items.filter(
    (item) =>
      !tracksMatch(item.title, item.artist, nowPlaying.title, nowPlaying.artist),
  );
}

/** True if this title was already played earlier tonight (not the deck right now). */
export function wasPlayedEarlierTonight(
  title: string,
  artist: string,
  history: PlayedTrack[],
  nowPlaying: NowPlaying | null,
): boolean {
  const earlier = history.filter((h) => tracksMatch(title, artist, h.title, h.artist));
  if (earlier.length === 0) return false;
  if (!nowPlaying) return true;
  if (!tracksMatch(title, artist, nowPlaying.title, nowPlaying.artist)) return true;
  // Same song on deck now — only “played earlier” if there was a prior play in history.
  if (earlier.length >= 2) return true;
  if (earlier.length === 1 && earlier[0]!.playedAt != null && nowPlaying.playedAt != null) {
    return earlier[0]!.playedAt! < nowPlaying.playedAt!;
  }
  return false;
}
