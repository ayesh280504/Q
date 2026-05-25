import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseSeratoCrate, parseSeratoCrates, type SeratoParseResult } from "@q/serato";
import { isCratePrivate, type PrivacyFilters } from "./lib/privacyFilter";

async function readCrateFile(path: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>("read_binary_file", { path });
  return new Uint8Array(bytes);
}

export interface SeratoImportResult extends SeratoParseResult {
  /** Crate files skipped because they matched the DJ's privacy filter. */
  skippedCrates: string[];
}

function filterCrateFiles(
  files: string[],
  filters: PrivacyFilters | undefined,
): { keep: string[]; skipped: string[] } {
  if (!filters) return { keep: files, skipped: [] };
  const keep: string[] = [];
  const skipped: string[] = [];
  for (const path of files) {
    if (isCratePrivate(path, filters)) skipped.push(path);
    else keep.push(path);
  }
  return { keep, skipped };
}

export async function importSeratoAuto(
  filters?: PrivacyFilters,
): Promise<SeratoImportResult | null> {
  const dir = await invoke<string | null>("detect_serato_subcrates");
  if (!dir) return null;

  const allFiles = await invoke<string[]>("list_crate_files", { dir });
  if (allFiles.length === 0) return null;

  const { keep, skipped } = filterCrateFiles(allFiles, filters);
  if (keep.length === 0) return { tracks: [], sourcePath: dir, crateFilesRead: 0, skippedCrates: skipped };

  const crates = await Promise.all(
    keep.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return { ...parseSeratoCrates(crates, dir), skippedCrates: skipped };
}

export async function importSeratoFromDialog(
  filters?: PrivacyFilters,
): Promise<SeratoImportResult | null> {
  const selected = await open({
    multiple: false,
    directory: true,
    title: "Select Serato Subcrates folder",
  });

  if (!selected || typeof selected !== "string") {
    const file = await open({
      multiple: false,
      filters: [{ name: "Serato crate", extensions: ["crate"] }],
      title: "Or select a .crate file",
    });
    if (!file || typeof file !== "string") return null;
    if (filters && isCratePrivate(file, filters)) {
      return { tracks: [], sourcePath: file, crateFilesRead: 0, skippedCrates: [file] };
    }
    const bytes = await readCrateFile(file);
    return { ...parseSeratoCrate(bytes, file), skippedCrates: [] };
  }

  const allFiles = await invoke<string[]>("list_crate_files", { dir: selected });
  if (allFiles.length === 0) return null;

  const { keep, skipped } = filterCrateFiles(allFiles, filters);
  if (keep.length === 0)
    return { tracks: [], sourcePath: selected, crateFilesRead: 0, skippedCrates: skipped };

  const crates = await Promise.all(
    keep.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return { ...parseSeratoCrates(crates, selected), skippedCrates: skipped };
}
