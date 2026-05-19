import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseSeratoCrate, parseSeratoCrates, type SeratoParseResult } from "@q/serato";

async function readCrateFile(path: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>("read_binary_file", { path });
  return new Uint8Array(bytes);
}

export async function importSeratoAuto(): Promise<SeratoParseResult | null> {
  const dir = await invoke<string | null>("detect_serato_subcrates");
  if (!dir) return null;

  const files = await invoke<string[]>("list_crate_files", { dir });
  if (files.length === 0) return null;

  const crates = await Promise.all(
    files.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return parseSeratoCrates(crates, dir);
}

export async function importSeratoFromDialog(): Promise<SeratoParseResult | null> {
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
    const bytes = await readCrateFile(file);
    return parseSeratoCrate(bytes, file);
  }

  const files = await invoke<string[]>("list_crate_files", { dir: selected });
  if (files.length === 0) return null;

  const crates = await Promise.all(
    files.map(async (path) => ({ path, bytes: await readCrateFile(path) })),
  );
  return parseSeratoCrates(crates, selected);
}
