/** Camelot wheel codes (Serato / Mixed In Key style). */
const CAMELOT = new Set([
  "1A", "2A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "10A", "11A", "12A",
  "1B", "2B", "3B", "4B", "5B", "6B", "7B", "8B", "9B", "10B", "11B", "12B",
]);

const KEY_TO_CAMELOT: Record<string, string> = {
  "ab min": "1A", "g# min": "1A", "g#m": "1A", "abm": "1A",
  "eb min": "2A", "d# min": "2A", "d#m": "2A", "ebm": "2A",
  "bb min": "3A", "a# min": "3A", "a#m": "3A", "bbm": "3A",
  "f min": "4A", "fm": "4A",
  "c min": "5A", "cm": "5A",
  "g min": "6A", "gm": "6A",
  "d min": "7A", "dm": "7A",
  "a min": "8A", "am": "8A",
  "e min": "9A", "em": "9A",
  "b min": "10A", "bm": "10A",
  "f# min": "11A", "gb min": "11A", "f#m": "11A", "gbm": "11A",
  "c# min": "12A", "db min": "12A", "c#m": "12A", "dbm": "12A",
  "b maj": "1B", "b": "1B",
  "f# maj": "2B", "gb maj": "2B", "f#": "2B", "gb": "2B",
  "db maj": "3B", "c# maj": "3B", "db": "3B", "c#": "3B",
  "ab maj": "4B", "g# maj": "4B", "ab": "4B", "g#": "4B",
  "eb maj": "5B", "d# maj": "5B", "eb": "5B", "d#": "5B",
  "bb maj": "6B", "a# maj": "6B", "bb": "6B", "a#": "6B",
  "f maj": "7B", "f": "7B",
  "c maj": "8B", "c": "8B",
  "g maj": "9B", "g": "9B",
  "d maj": "10B", "d": "10B",
  "a maj": "11B", "a": "11B",
  "e maj": "12B", "e": "12B",
};

export function normalizeCamelot(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  const raw = key.trim().toUpperCase().replace(/\s+/g, "");
  if (CAMELOT.has(raw)) return raw;
  const spaced = key.trim().toLowerCase().replace(/\s+/g, " ");
  return KEY_TO_CAMELOT[spaced];
}

function camelotNumber(code: string): number {
  const n = parseInt(code.replace(/[AB]/, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** 0 = same key, 1 = adjacent / energy shift, higher = farther. */
export function camelotDistance(a: string, b: string): number {
  const na = camelotNumber(a);
  const nb = camelotNumber(b);
  const ring = Math.min(Math.abs(na - nb), 12 - Math.abs(na - nb));
  const modeFlip = a.endsWith("A") && b.endsWith("B") || a.endsWith("B") && b.endsWith("A");
  if (a === b) return 0;
  if (ring === 0 && modeFlip) return 1;
  if (ring === 1 && a.slice(-1) === b.slice(-1)) return 1;
  if (ring === 1 && modeFlip) return 2;
  return ring + (modeFlip ? 1 : 0);
}

export interface MixabilityInput {
  fromBpm?: number | null;
  fromKey?: string | null;
  toBpm?: number | null;
  toKey?: string | null;
}

export interface MixabilityScore {
  score: number;
  label: string;
  detail: string;
}

export function scoreMixability(input: MixabilityInput): MixabilityScore {
  const fromCam = normalizeCamelot(input.fromKey);
  const toCam = normalizeCamelot(input.toKey);
  const fromBpm = input.fromBpm ?? null;
  const toBpm = input.toBpm ?? null;

  let score = 50;
  const parts: string[] = [];

  if (fromBpm != null && toBpm != null) {
    const delta = Math.abs(toBpm - fromBpm);
    const half = Math.abs(toBpm * 2 - fromBpm) <= 3 || Math.abs(fromBpm * 2 - toBpm) <= 3;
    if (delta <= 2) {
      score += 25;
      parts.push("BPM match");
    } else if (delta <= 6) {
      score += 12;
      parts.push(`±${delta.toFixed(0)} BPM`);
    } else if (half) {
      score += 10;
      parts.push("Half/double tempo");
    } else {
      score -= Math.min(20, delta);
      parts.push(`${delta.toFixed(0)} BPM apart`);
    }
  }

  if (fromCam && toCam) {
    const dist = camelotDistance(fromCam, toCam);
    if (dist === 0) {
      score += 25;
      parts.push(`Same key ${fromCam}`);
    } else if (dist === 1) {
      score += 18;
      parts.push(`Harmonic ${fromCam} → ${toCam}`);
    } else if (dist === 2) {
      score += 8;
      parts.push(`Near key ${toCam}`);
    } else {
      score -= dist * 4;
      parts.push(`Key stretch ${fromCam} → ${toCam}`);
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = "Wildcard";
  if (score >= 85) label = "Perfect blend";
  else if (score >= 70) label = "Smooth mix";
  else if (score >= 55) label = "Workable";
  else if (score >= 40) label = "Energy shift";

  return {
    score,
    label,
    detail: parts.length > 0 ? parts.join(" · ") : "Limited metadata",
  };
}
