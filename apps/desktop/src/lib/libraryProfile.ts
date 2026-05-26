/**
 * Library source profile — the DJ's gig-time answer to "where do you get your
 * tracks from tonight?" This drives a lot of downstream UX:
 *
 *  - `local` (USB / hard drive only): import flow is front-and-centre. Q
 *    Requests auto-crate works normally. BPM/key health matters.
 *  - `spotify` (streaming only): import flow is hidden — there's no `.crate`
 *    file to read because everything lives in Spotify's cloud. Q Requests
 *    auto-crate doesn't write to disk (Spotify tracks aren't files). The
 *    crowd's Spotify-search fallback is the source of truth instead.
 *  - `both`: show import flow, but caveat the auto-crate ("Spotify-sourced
 *    requests stay in your queue — Q can only auto-crate tracks you own as
 *    files.").
 *
 * Picked once at gig start; remembered across sessions; changeable from the
 * sidebar Settings section.
 */

export type LibrarySource = "local" | "spotify" | "both";

const STORAGE_KEY = "q-library-source";

export function loadLibrarySource(): LibrarySource | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "local" || raw === "spotify" || raw === "both") return raw;
    return null;
  } catch {
    return null;
  }
}

export function saveLibrarySource(source: LibrarySource) {
  try {
    localStorage.setItem(STORAGE_KEY, source);
  } catch {
    /* ignore */
  }
}

export function clearLibrarySource() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether to show / nag the DJ about the library import flow. */
export function shouldImportLocalLibrary(source: LibrarySource | null): boolean {
  return source === "local" || source === "both" || source === null;
}

/** Whether the auto-built Q Requests playlist is meaningful for this DJ. */
export function autoCrateApplies(source: LibrarySource | null): boolean {
  return source === "local" || source === "both" || source === null;
}

export const LIBRARY_SOURCE_LABELS: Record<LibrarySource, { title: string; summary: string }> = {
  local: {
    title: "Local files only (USB / hard drive)",
    summary:
      "Classic setup. Q syncs your Rekordbox/Serato library so the crowd can search what you own.",
  },
  spotify: {
    title: "Spotify streaming only",
    summary:
      "You DJ from Spotify's catalogue inside Serato/Rekordbox. Q skips the import step and uses crowd-side Spotify search instead.",
  },
  both: {
    title: "Both — local files and Spotify",
    summary:
      "Best of both. Q syncs your local library and lets the crowd find Spotify tracks too. Auto-crate only fills with files you own.",
  },
};
