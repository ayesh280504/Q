/**
 * Per-DJ "active crates" selection — lets a DJ scope tonight's playable pool
 * to specific Serato crates or Rekordbox playlists (e.g. "Latin night").
 *
 * Stored separately for Serato (by crate file path) and Rekordbox (by playlist
 * path) so switching DJ software preserves both selections.
 *
 * Empty `selected` means "all crates" (default behavior).
 */

const SERATO_KEY = "q-active-serato-crates-v1";
const REKORDBOX_KEY = "q-active-rekordbox-playlists-v1";

export interface CrateSelection {
  /** When true, treat every crate as selected (no filtering). */
  useAll: boolean;
  /** Set of identifiers — crate file paths (Serato) or playlist paths (Rekordbox). */
  selected: string[];
}

function defaultSelection(): CrateSelection {
  return { useAll: true, selected: [] };
}

function load(key: string): CrateSelection {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultSelection();
    const parsed = JSON.parse(raw) as Partial<CrateSelection>;
    return {
      useAll: parsed.useAll ?? true,
      selected: Array.isArray(parsed.selected) ? parsed.selected.filter(Boolean) : [],
    };
  } catch {
    return defaultSelection();
  }
}

function save(key: string, sel: CrateSelection): void {
  try {
    localStorage.setItem(key, JSON.stringify(sel));
  } catch {
    /* ignore */
  }
}

export function loadSeratoSelection(): CrateSelection {
  return load(SERATO_KEY);
}
export function saveSeratoSelection(sel: CrateSelection): void {
  save(SERATO_KEY, sel);
}
export function loadRekordboxSelection(): CrateSelection {
  return load(REKORDBOX_KEY);
}
export function saveRekordboxSelection(sel: CrateSelection): void {
  save(REKORDBOX_KEY, sel);
}

export function isCrateActive(id: string, sel: CrateSelection): boolean {
  if (sel.useAll) return true;
  if (sel.selected.length === 0) return false;
  return sel.selected.includes(id);
}
