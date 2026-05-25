import type { TrackRecord } from "@q/shared";
import { looksLikeMashup } from "@q/shared";

export interface PrivacyFilters {
  /** Substring match against track title or artist (case-insensitive). */
  keywords: string[];
  /** Substring match against Serato crate filename (case-insensitive). */
  crates: string[];
  /** Treat any track marked "ID" / "Unknown" specially (off by default). */
  hideUnknown: boolean;
  /** Auto-hide titles that look like custom mashups ("A x B", "A vs B"). */
  hideMashups: boolean;
}

const STORAGE_KEY = "q-privacy-filters-v2";

const DEFAULT_KEYWORDS = ["VIP", "edit", "mashup", "bootleg", "unreleased", "ID", "WIP"];

export function defaultPrivacyFilters(): PrivacyFilters {
  return {
    keywords: [...DEFAULT_KEYWORDS],
    crates: [],
    hideUnknown: false,
    hideMashups: true,
  };
}

export function loadPrivacyFilters(): PrivacyFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrivacyFilters();
    const parsed = JSON.parse(raw) as Partial<PrivacyFilters>;
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
      crates: Array.isArray(parsed.crates) ? parsed.crates.filter(Boolean) : [],
      hideUnknown: Boolean(parsed.hideUnknown),
      hideMashups: parsed.hideMashups ?? true,
    };
  } catch {
    return defaultPrivacyFilters();
  }
}

export function savePrivacyFilters(filters: PrivacyFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* ignore */
  }
}

function matchesKeyword(value: string, keyword: string): boolean {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export function isTrackPrivate(track: TrackRecord, filters: PrivacyFilters): boolean {
  if (filters.hideUnknown) {
    const title = track.title.trim().toLowerCase();
    if (!title || title === "id" || title === "unknown" || title.startsWith("id ")) return true;
  }
  if (filters.hideMashups && looksLikeMashup(track.title)) return true;
  for (const kw of filters.keywords) {
    if (!kw.trim()) continue;
    if (matchesKeyword(track.title, kw) || matchesKeyword(track.artist, kw)) return true;
  }
  return false;
}

export function partitionTracks(
  tracks: TrackRecord[],
  filters: PrivacyFilters,
): { publicTracks: TrackRecord[]; privateTracks: TrackRecord[] } {
  const publicTracks: TrackRecord[] = [];
  const privateTracks: TrackRecord[] = [];
  for (const t of tracks) {
    if (isTrackPrivate(t, filters)) privateTracks.push(t);
    else publicTracks.push(t);
  }
  return { publicTracks, privateTracks };
}

export function isCratePrivate(cratePath: string, filters: PrivacyFilters): boolean {
  if (filters.crates.length === 0) return false;
  const lower = cratePath.toLowerCase();
  return filters.crates.some((c) => c.trim() && lower.includes(c.toLowerCase()));
}
