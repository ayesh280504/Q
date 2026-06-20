import type { TrackRecord } from "@q/shared";

export interface SeratoCrateInfo {
  /** Absolute path to the .crate file. */
  path: string;
  /** Human display name (filename without extension, with %% separators converted to "/"). */
  name: string;
  /** Number of unique tracks in this crate. */
  trackCount: number;
}

export interface SeratoParseResult {
  tracks: TrackRecord[];
  sourcePath: string;
  crateFilesRead: number;
  /** Per-crate metadata. Empty when only a single crate file was provided. */
  crates: SeratoCrateInfo[];
}

/** Convert "Hip%%Hop%%2026.crate" → "Hip / Hop / 2026" (Serato nesting). */
export function crateDisplayName(filePath: string): string {
  const file = filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
  const stem = file.replace(/\.crate$/i, "");
  return stem.split("%%").join(" / ");
}

type SeratoNode = { tag: string; value: SeratoNode[] | string | number | Uint8Array };

function decodeUtf16Be(data: Uint8Array): string {
  if (data.length < 2) return "";
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const units: number[] = [];
  for (let i = 0; i + 1 < data.length; i += 2) {
    const code = view.getUint16(i, false);
    if (code === 0) break;
    units.push(code);
  }
  return String.fromCharCode(...units);
}

function readUInt32Be(data: Uint8Array): number {
  if (data.length < 4) return 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return view.getUint32(0, false);
}

function fieldIdFromTag(tag: string): number | null {
  if (tag.length !== 4) return null;
  return (
    (tag.charCodeAt(0) << 24) |
    (tag.charCodeAt(1) << 16) |
    (tag.charCodeAt(2) << 8) |
    tag.charCodeAt(3)
  );
}

/** History session fields (see Serato History .session format). */
const HISTORY_STRING_FIELDS = new Set([2, 3, 6, 7, 8, 9, 0x11]);
/** Field 4 holds BPM (sometimes scaled ×100), field 5 the playedAt epoch. */
const HISTORY_UINT_FIELDS = new Set([4, 5, 0x2d]);

function decodeValue(data: Uint8Array, tag: string): SeratoNode["value"] {
  const fieldId = fieldIdFromTag(tag);
  if (fieldId !== null && HISTORY_STRING_FIELDS.has(fieldId)) {
    return decodeUtf16Be(data);
  }
  if (fieldId !== null && HISTORY_UINT_FIELDS.has(fieldId)) {
    return readUInt32Be(data);
  }
  if (tag === "vrsn" || tag.startsWith("t") || tag.startsWith("p")) {
    return decodeUtf16Be(data);
  }
  if (tag === "sbav" || tag.startsWith("b")) return data;
  if (tag.startsWith("u")) return readUInt32Be(data);
  if (tag.startsWith("o")) return decodeCrate(data);
  return decodeCrate(data);
}

function decodeCrate(data: Uint8Array): SeratoNode[] {
  const records: SeratoNode[] = [];
  let i = 0;
  while (i + 8 <= data.length) {
    const tag = String.fromCharCode(
      data[i]!,
      data[i + 1]!,
      data[i + 2]!,
      data[i + 3]!,
    );
    const len = readUInt32Be(data.subarray(i + 4, i + 8));
    const valueBytes = data.subarray(i + 8, i + 8 + len);
    i += 8 + len;
    if (len < 0 || i > data.length) break;
    records.push({ tag, value: decodeValue(valueBytes, tag) });
  }
  return records;
}

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? path;
}

function titleArtistFromPath(filePath: string): { title: string; artist: string } {
  const name = basename(filePath).replace(/\.[^.]+$/, "");
  const dash = name.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dash) return { artist: dash[1]!.trim(), title: dash[2]!.trim() };
  return { artist: "Unknown Artist", title: name || "Unknown Track" };
}

function extractFromOtrk(nodes: SeratoNode[]): TrackRecord[] {
  const out: TrackRecord[] = [];

  for (const node of nodes) {
    if (node.tag === "otrk" && Array.isArray(node.value)) {
      let path: string | undefined;
      let title: string | undefined;
      let artist: string | undefined;
      let album: string | undefined;
      let bpmStr: string | undefined;
      let keyStr: string | undefined;
      let lengthStr: string | undefined;

      for (const child of node.value) {
        if (typeof child.value !== "string") continue;
        if (child.tag === "ptrk" || child.tag === "ptah") path = child.value;
        if (child.tag === "tsng") title = child.value;
        if (child.tag === "tart" || child.tag === "tarj") artist = child.value;
        if (child.tag === "talb") album = child.value;
        if (child.tag === "tbpm") bpmStr = child.value;
        if (child.tag === "tkey") keyStr = child.value;
        if (child.tag === "tlen") lengthStr = child.value;
      }

      const cleanPath = path?.replace(/^\w+:\/\/localhost\/?/i, "").replace(/^\w+:\/\//, "");
      const fromPath = cleanPath ? titleArtistFromPath(cleanPath) : null;

      const finalTitle = title?.trim() || fromPath?.title || "Unknown Track";
      const finalArtist = artist?.trim() || fromPath?.artist || "Unknown Artist";
      const externalId = cleanPath || `${finalArtist}::${finalTitle}`;

      const bpmNum = bpmStr ? Number.parseFloat(bpmStr) : NaN;
      const bpm = Number.isFinite(bpmNum) && bpmNum >= 40 && bpmNum <= 250 ? Math.round(bpmNum) : undefined;
      const lenNum = lengthStr ? Number.parseFloat(lengthStr) : NaN;
      const durationSec = Number.isFinite(lenNum) && lenNum > 0 ? Math.round(lenNum) : undefined;

      out.push({
        externalId,
        title: finalTitle,
        artist: finalArtist,
        album: album?.trim() || undefined,
        bpm,
        key: keyStr?.trim() || undefined,
        durationSec,
        localPath: cleanPath,
      });
    } else if (Array.isArray(node.value)) {
      out.push(...extractFromOtrk(node.value));
    }
  }

  return out;
}

export interface SeratoNowPlaying {
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  playedAt?: number;
}

type SessionEntry = SeratoNowPlaying;

function extractFromOent(nodes: SeratoNode[]): SessionEntry[] {
  const out: SessionEntry[] = [];

  for (const node of nodes) {
    if (node.tag === "oent" && Array.isArray(node.value)) {
      let title: string | undefined;
      let artist: string | undefined;
      let path: string | undefined;
      let playedAt: number | undefined;
      let key: string | undefined;
      let bpm: number | undefined;

      for (const child of node.value) {
        if (child.tag !== "adat" || !Array.isArray(child.value)) continue;
        for (const field of child.value) {
          const id = fieldIdFromTag(field.tag);
          if (id === 6 && typeof field.value === "string") title = field.value;
          if (id === 7 && typeof field.value === "string") artist = field.value;
          if (id === 2 && typeof field.value === "string") path = field.value;
          if (id === 3 && typeof field.value === "string") key = field.value;
          if (id === 5 && typeof field.value === "number") playedAt = field.value;
          if (id === 4 && typeof field.value === "number") {
            const v = field.value;
            bpm = v > 400 ? Math.round(v / 100) : v;
          }
        }
      }

      const fromPath = path ? titleArtistFromPath(path) : null;
      const finalTitle = title?.trim() || fromPath?.title || "";
      const finalArtist = artist?.trim() || fromPath?.artist || "Unknown Artist";
      if (finalTitle) {
        out.push({
          title: finalTitle,
          artist: finalArtist,
          playedAt,
          key: key?.trim() || undefined,
          bpm: bpm && bpm >= 40 && bpm <= 250 ? bpm : undefined,
        });
      }
    } else if (Array.isArray(node.value)) {
      out.push(...extractFromOent(node.value));
    }
  }

  return out;
}

/** All tracks from a Serato History session file (chronological plays tonight). */
export function parseSeratoHistorySessionTracks(bytes: Uint8Array): SeratoNowPlaying[] {
  const tree = decodeCrate(bytes);
  return extractFromOent(tree).sort((a, b) => (a.playedAt ?? 0) - (b.playedAt ?? 0));
}

/**
 * Current / most recent track from a History .session file.
 * Serato appends rows in play order — last chronological row is what's on deck.
 */
export function parseSeratoHistorySession(bytes: Uint8Array): SeratoNowPlaying | null {
  const entries = parseSeratoHistorySessionTracks(bytes);
  if (entries.length === 0) return null;
  return entries[entries.length - 1]!;
}

export function parseSeratoCrate(bytes: Uint8Array, sourcePath: string): SeratoParseResult {
  const tree = decodeCrate(bytes);
  const tracks = dedupeTracks(extractFromOtrk(tree));
  return {
    tracks,
    sourcePath,
    crateFilesRead: 1,
    crates: [{ path: sourcePath, name: crateDisplayName(sourcePath), trackCount: tracks.length }],
  };
}

/** Full Serato library snapshot — richer BPM/key than individual crate files. */
export function parseSeratoDatabaseV2(bytes: Uint8Array, sourcePath: string): SeratoParseResult {
  const tree = decodeCrate(bytes);
  const tracks = dedupeTracks(extractFromOtrk(tree));
  return {
    tracks,
    sourcePath,
    crateFilesRead: 0,
    crates: [],
  };
}

/** Merge crate import with database metadata (BPM/key/duration) when paths match. */
export function mergeSeratoLibraryMeta(
  primary: TrackRecord[],
  database: TrackRecord[],
): TrackRecord[] {
  const byPath = new Map<string, TrackRecord>();
  const byTitleArtist = new Map<string, TrackRecord>();
  for (const t of database) {
    if (t.externalId) byPath.set(t.externalId.toLowerCase(), t);
    const key = `${t.title}\0${t.artist}`.toLowerCase();
    if (!byTitleArtist.has(key)) byTitleArtist.set(key, t);
  }
  return primary.map((t) => {
    const fromPath = t.externalId ? byPath.get(t.externalId.toLowerCase()) : undefined;
    const fromNames = byTitleArtist.get(`${t.title}\0${t.artist}`.toLowerCase());
    const meta = fromPath ?? fromNames;
    if (!meta) return t;
    return {
      ...t,
      bpm: t.bpm ?? meta.bpm,
      key: t.key ?? meta.key,
      durationSec: t.durationSec ?? meta.durationSec,
      album: t.album ?? meta.album,
    };
  });
}

export function parseSeratoCrates(
  crates: Array<{ path: string; bytes: Uint8Array }>,
  sourceLabel: string,
): SeratoParseResult {
  const merged: TrackRecord[] = [];
  const crateInfo: SeratoCrateInfo[] = [];
  for (const crate of crates) {
    const cTracks = extractFromOtrk(decodeCrate(crate.bytes));
    const unique = dedupeTracks(cTracks);
    crateInfo.push({
      path: crate.path,
      name: crateDisplayName(crate.path),
      trackCount: unique.length,
    });
    merged.push(...unique);
  }
  return {
    tracks: dedupeTracks(merged),
    sourcePath: sourceLabel,
    crateFilesRead: crates.length,
    crates: crateInfo,
  };
}

function dedupeTracks(tracks: TrackRecord[]): TrackRecord[] {
  const map = new Map<string, TrackRecord>();
  for (const t of tracks) {
    const key = t.externalId.toLowerCase();
    if (!map.has(key)) map.set(key, t);
  }
  return [...map.values()];
}

/** Typical Serato Subcrates folder locations */
export function getDefaultSeratoSubcratesPaths(): string[] {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const paths: string[] = [];

  if (process.platform === "win32") {
    const music = process.env.USERPROFILE
      ? `${process.env.USERPROFILE}\\Music\\_Serato_\\Subcrates`
      : "";
    if (music) paths.push(music);
    if (process.env.MUSIC) paths.push(`${process.env.MUSIC}\\_Serato_\\Subcrates`);
  } else if (process.platform === "darwin") {
    paths.push(`${home}/Music/_Serato_/Subcrates`);
  }

  return paths;
}
