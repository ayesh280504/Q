import { XMLParser } from "fast-xml-parser";
import type { TrackRecord } from "@q/shared";

export interface RekordboxParseResult {
  tracks: TrackRecord[];
  sourcePath: string;
}

interface RawTrack {
  "@_TrackID"?: string;
  "@_Name"?: string;
  "@_Artist"?: string;
  "@_Album"?: string;
  "@_AverageBpm"?: string;
  "@_Tonality"?: string;
  "@_TotalTime"?: string;
  "@_Location"?: string;
}

function decodeLocation(location: string | undefined): string | undefined {
  if (!location) return undefined;
  try {
    return decodeURIComponent(location.replace(/^file:\/\/localhost\/?/i, "").replace(/^file:\/\//i, ""));
  } catch {
    return location;
  }
}

function parseBpm(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function parseDuration(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export function parseRekordboxXml(xml: string, sourcePath: string): RekordboxParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const doc = parser.parse(xml) as {
    DJ_PLAYLISTS?: {
      COLLECTION?: {
        TRACK?: RawTrack | RawTrack[];
      };
    };
  };

  const raw = doc?.DJ_PLAYLISTS?.COLLECTION?.TRACK;
  const list = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

  const tracks: TrackRecord[] = [];

  for (const t of list) {
    const title = t["@_Name"]?.trim();
    if (!title) continue;

    const externalId = t["@_TrackID"]?.trim() || `${title}-${t["@_Artist"] ?? ""}`;
    decodeLocation(t["@_Location"]);

    tracks.push({
      externalId,
      title,
      artist: t["@_Artist"]?.trim() || "Unknown Artist",
      album: t["@_Album"]?.trim(),
      bpm: parseBpm(t["@_AverageBpm"]),
      key: t["@_Tonality"]?.trim(),
      durationSec: parseDuration(t["@_TotalTime"]),
    });
  }

  return { tracks, sourcePath };
}

/** Common Rekordbox XML locations on Windows and macOS */
export function getDefaultRekordboxXmlPaths(): string[] {
  const paths: string[] = [];
  const home = process.env.HOME || process.env.USERPROFILE || "";

  if (process.platform === "win32") {
    const appData = process.env.APPDATA || `${home}\\AppData\\Roaming`;
    paths.push(
      `${appData}\\Pioneer\\rekordbox\\rekordbox.xml`,
      `${appData}\\Pioneer\\rekordbox\\share.xml`,
      `${appData}\\Native Instruments\\rekordbox\\rekordbox.xml`,
    );
  } else if (process.platform === "darwin") {
    paths.push(
      `${home}/Library/Pioneer/rekordbox/rekordbox.xml`,
      `${home}/Library/Pioneer/rekordbox/share.xml`,
    );
  }

  return paths;
}
