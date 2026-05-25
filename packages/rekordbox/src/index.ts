import { XMLParser } from "fast-xml-parser";
import type { TrackRecord } from "@q/shared";

export interface RekordboxPlaylist {
  /** Slash-joined ancestor names, e.g. "Genres/Latin/Reggaeton". */
  path: string;
  /** Just the leaf playlist name. */
  name: string;
  /** Track IDs referenced by this playlist. */
  trackIds: string[];
}

export interface RekordboxParseResult {
  tracks: TrackRecord[];
  sourcePath: string;
  /** Flattened list of playlists (rekordbox's equivalent of Serato crates). */
  playlists: RekordboxPlaylist[];
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

interface RawPlaylistNode {
  "@_Type"?: string;
  "@_Name"?: string;
  "@_Entries"?: string;
  NODE?: RawPlaylistNode | RawPlaylistNode[];
  TRACK?: { "@_Key"?: string } | Array<{ "@_Key"?: string }>;
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

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function flattenPlaylists(
  node: RawPlaylistNode | undefined,
  ancestors: string[],
): RekordboxPlaylist[] {
  if (!node) return [];
  const out: RekordboxPlaylist[] = [];
  const name = node["@_Name"]?.trim() ?? "";
  const type = node["@_Type"];
  const isLeaf = type === "1";
  const nextAncestors = name && name !== "ROOT" ? [...ancestors, name] : ancestors;

  if (isLeaf) {
    const trackRefs = asArray(node.TRACK);
    const trackIds = trackRefs
      .map((t) => t["@_Key"]?.trim())
      .filter((s): s is string => !!s);
    out.push({
      path: nextAncestors.join("/") || name,
      name: name || "(unnamed)",
      trackIds,
    });
  }

  for (const child of asArray(node.NODE)) {
    out.push(...flattenPlaylists(child, nextAncestors));
  }
  return out;
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
      PLAYLISTS?: {
        NODE?: RawPlaylistNode | RawPlaylistNode[];
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
    const localPath = decodeLocation(t["@_Location"]);

    tracks.push({
      externalId,
      title,
      artist: t["@_Artist"]?.trim() || "Unknown Artist",
      album: t["@_Album"]?.trim(),
      bpm: parseBpm(t["@_AverageBpm"]),
      key: t["@_Tonality"]?.trim(),
      durationSec: parseDuration(t["@_TotalTime"]),
      localPath: localPath?.trim() || undefined,
    });
  }

  const rootNodes = asArray(doc?.DJ_PLAYLISTS?.PLAYLISTS?.NODE);
  const playlists: RekordboxPlaylist[] = [];
  for (const root of rootNodes) {
    playlists.push(...flattenPlaylists(root, []));
  }

  return { tracks, sourcePath, playlists };
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
