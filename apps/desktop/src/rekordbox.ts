import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseRekordboxXml, type RekordboxParseResult } from "@q/rekordbox";
import { isCrateActive, type CrateSelection } from "./lib/crateSelection";

export interface RekordboxImportResult extends RekordboxParseResult {
  /** Playlists skipped because they weren't in the active selection. */
  inactivePlaylists: string[];
  /** Tracks that exist in the collection but aren't in any active playlist. */
  excludedTrackIds: string[];
}

interface RekordboxImportOptions {
  selection?: CrateSelection;
}

function applySelection(
  parsed: RekordboxParseResult,
  selection?: CrateSelection,
): RekordboxImportResult {
  if (!selection || selection.useAll) {
    return { ...parsed, inactivePlaylists: [], excludedTrackIds: [] };
  }
  const activeIds = new Set<string>();
  const inactivePlaylists: string[] = [];
  for (const pl of parsed.playlists) {
    if (isCrateActive(pl.path, selection)) {
      for (const id of pl.trackIds) activeIds.add(id);
    } else {
      inactivePlaylists.push(pl.path);
    }
  }
  if (activeIds.size === 0 && parsed.playlists.length > 0) {
    return {
      ...parsed,
      tracks: [],
      inactivePlaylists,
      excludedTrackIds: parsed.tracks.map((t) => t.externalId),
    };
  }
  const kept = parsed.tracks.filter((t) => activeIds.has(t.externalId));
  const excluded = parsed.tracks.filter((t) => !activeIds.has(t.externalId)).map((t) => t.externalId);
  return {
    ...parsed,
    tracks: kept,
    inactivePlaylists,
    excludedTrackIds: excluded,
  };
}

export async function importRekordboxFromDialog(
  opts?: RekordboxImportOptions,
): Promise<RekordboxImportResult | null> {
  // Open the picker rooted at the Pioneer config folder (where Rekordbox
  // writes `rekordbox.xml`). DJs commonly navigate to their *music* folder
  // looking for it — but the XML is the library *index*, not the audio
  // files, and lives under `%APPDATA%\Pioneer\rekordbox\` on Windows /
  // `~/Library/Pioneer/rekordbox/` on Mac, both of which are hidden by
  // default in their respective file managers.
  let defaultPath: string | undefined;
  try {
    const dir = await invoke<string | null>("rekordbox_pioneer_dir");
    if (dir) defaultPath = dir;
  } catch {
    /* fallback to the OS default (last-used dir) */
  }

  const selected = await open({
    multiple: false,
    filters: [{ name: "Rekordbox XML (rekordbox.xml)", extensions: ["xml"] }],
    title: "Select rekordbox.xml — Pioneer's library index, NOT your music folder",
    defaultPath,
  });

  if (!selected || typeof selected !== "string") return null;
  return importRekordboxFromPath(selected, opts);
}

export async function importRekordboxAuto(
  opts?: RekordboxImportOptions,
): Promise<RekordboxImportResult | null> {
  const path = await invoke<string | null>("detect_rekordbox_xml");
  if (!path) return null;
  return importRekordboxFromPath(path, opts);
}

async function importRekordboxFromPath(
  path: string,
  opts?: RekordboxImportOptions,
): Promise<RekordboxImportResult> {
  const xml = await invoke<string>("read_text_file", { path });
  return applySelection(parseRekordboxXml(xml, path), opts?.selection);
}
