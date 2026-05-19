import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseRekordboxXml, type RekordboxParseResult } from "@q/rekordbox";

export async function importRekordboxFromDialog(): Promise<RekordboxParseResult | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Rekordbox XML", extensions: ["xml"] }],
    title: "Select rekordbox.xml",
  });

  if (!selected || typeof selected !== "string") return null;
  return importRekordboxFromPath(selected);
}

export async function importRekordboxAuto(): Promise<RekordboxParseResult | null> {
  const path = await invoke<string | null>("detect_rekordbox_xml");
  if (!path) return null;
  return importRekordboxFromPath(path);
}

async function importRekordboxFromPath(path: string): Promise<RekordboxParseResult> {
  const xml = await invoke<string>("read_text_file", { path });
  return parseRekordboxXml(xml, path);
}
