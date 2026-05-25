import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseSeratoCrate, parseSeratoCrates, type SeratoParseResult } from "@q/serato";
import { isCratePrivate, type PrivacyFilters } from "./lib/privacyFilter";
import { isCrateActive, type CrateSelection } from "./lib/crateSelection";

async function readCrateFile(path: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>("read_binary_file", { path });
  return new Uint8Array(bytes);
}

export interface SeratoImportResult extends SeratoParseResult {
  /** Crate files skipped because they matched the DJ's privacy filter. */
  skippedCrates: string[];
  /** Crate files skipped because they weren't in the active crate selection. */
  inactiveCrates: string[];
}

interface SeratoImportOptions {
  privacy?: PrivacyFilters;
  selection?: CrateSelection;
}

function filterCrateFiles(
  files: string[],
  opts: SeratoImportOptions | undefined,
): { keep: string[]; privacySkipped: string[]; inactive: string[] } {
  const keep: string[] = [];
  const privacySkipped: string[] = [];
  const inactive: string[] = [];
  for (const path of files) {
    if (opts?.privacy && isCratePrivate(path, opts.privacy)) {
      privacySkipped.push(path);
      continue;
    }
    if (opts?.selection && !isCrateActive(path, opts.selection)) {
      inactive.push(path);
      continue;
    }
    keep.push(path);
  }
  return { keep, privacySkipped, inactive };
}

function emptyResult(sourcePath: string, skipped: string[], inactive: string[]): SeratoImportResult {
  return {
    tracks: [],
    sourcePath,
    crateFilesRead: 0,
    crates: [],
    skippedCrates: skipped,
    inactiveCrates: inactive,
  };
}

export async function importSeratoAuto(
  opts?: SeratoImportOptions,
): Promise<SeratoImportResult | null> {
  const dir = await invoke<string | null>("detect_serato_subcrates");
  if (!dir) return null;

  const allFiles = await invoke<string[]>("list_crate_files", { dir });
  if (allFiles.length === 0) return null;

  const { keep, privacySkipped, inactive } = filterCrateFiles(allFiles, opts);
  if (keep.length === 0) return emptyResult(dir, privacySkipped, inactive);

  const crates = await Promise.all(
    keep.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return {
    ...parseSeratoCrates(crates, dir),
    skippedCrates: privacySkipped,
    inactiveCrates: inactive,
  };
}

export async function importSeratoFromDialog(
  opts?: SeratoImportOptions,
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
    if (opts?.privacy && isCratePrivate(file, opts.privacy)) {
      return emptyResult(file, [file], []);
    }
    const bytes = await readCrateFile(file);
    return { ...parseSeratoCrate(bytes, file), skippedCrates: [], inactiveCrates: [] };
  }

  const allFiles = await invoke<string[]>("list_crate_files", { dir: selected });
  if (allFiles.length === 0) return null;

  const { keep, privacySkipped, inactive } = filterCrateFiles(allFiles, opts);
  if (keep.length === 0) return emptyResult(selected, privacySkipped, inactive);

  const crates = await Promise.all(
    keep.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return {
    ...parseSeratoCrates(crates, selected),
    skippedCrates: privacySkipped,
    inactiveCrates: inactive,
  };
}

/** Enumerate available Serato crates without applying any filters. */
export async function enumerateSeratoCrates(): Promise<SeratoImportResult | null> {
  return importSeratoAuto();
}
