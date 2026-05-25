/**
 * Color coding for BPM and musical key, modeled after the Mixed In Key /
 * Serato "Camelot wheel" so DJs can read harmonic compatibility at a glance.
 *
 * Adjacent Camelot numbers (e.g. 7A → 8A) are harmonically compatible, and
 * the wheel uses a hue ramp so adjacent colors look related.
 */

const CAMELOT_COLORS: Record<string, string> = {
  "1A": "#52e6c3", // light teal (G♭m / F#m)
  "1B": "#39d4af", // teal (B / Cb)
  "2A": "#4fd1d9", // cyan-teal (D♭m / C#m)
  "2B": "#3ec6da", // cyan (F# / Gb)
  "3A": "#4aa9e8", // light blue (A♭m / G#m)
  "3B": "#3994e8", // blue (D♭ / C#)
  "4A": "#7a86f5", // blue-violet (E♭m / D#m)
  "4B": "#8d77ee", // violet (A♭ / G#)
  "5A": "#b06bea", // purple (B♭m / A#m)
  "5B": "#c862e5", // magenta (E♭ / D#)
  "6A": "#e85ad5", // pink (Fm)
  "6B": "#f25fb6", // hot pink (B♭ / A#)
  "7A": "#fa6995", // pink-red (Cm)
  "7B": "#fa7a76", // coral (F)
  "8A": "#f78c5d", // orange (Gm)
  "8B": "#f4a247", // amber (C)
  "9A": "#e9bb3a", // yellow (Dm)
  "9B": "#cad636", // yellow-green (G)
  "10A": "#9fdb3e", // lime (Am)
  "10B": "#73db52", // green (D)
  "11A": "#4dd66e", // bright green (Em)
  "11B": "#3fd596", // mint (A)
  "12A": "#39d3b4", // sea green (Bm)
  "12B": "#3ed1c2", // teal-green (E)
};

const TRADITIONAL_TO_CAMELOT: Record<string, string> = {
  // Minor keys (A)
  "g♭m": "1A",
  "gbm": "1A",
  "f#m": "1A",
  "f♯m": "1A",
  "d♭m": "2A",
  "dbm": "2A",
  "c#m": "2A",
  "c♯m": "2A",
  "a♭m": "3A",
  "abm": "3A",
  "g#m": "3A",
  "g♯m": "3A",
  "e♭m": "4A",
  "ebm": "4A",
  "d#m": "4A",
  "d♯m": "4A",
  "b♭m": "5A",
  "bbm": "5A",
  "a#m": "5A",
  "a♯m": "5A",
  "fm": "6A",
  "cm": "7A",
  "gm": "8A",
  "dm": "9A",
  "am": "10A",
  "em": "11A",
  "bm": "12A",
  // Major keys (B)
  b: "1B",
  cb: "1B",
  "c♭": "1B",
  "f#": "2B",
  "f♯": "2B",
  gb: "2B",
  "g♭": "2B",
  "d♭": "3B",
  db: "3B",
  "c#": "3B",
  "c♯": "3B",
  "a♭": "4B",
  ab: "4B",
  "g#": "4B",
  "g♯": "4B",
  "e♭": "5B",
  eb: "5B",
  "d#": "5B",
  "d♯": "5B",
  "b♭": "6B",
  bb: "6B",
  "a#": "6B",
  "a♯": "6B",
  f: "7B",
  c: "8B",
  g: "9B",
  d: "10B",
  a: "11B",
  e: "12B",
};

/** Normalise a key string to a Camelot code, or null if we can't map it. */
export function toCamelot(key: string | undefined | null): string | null {
  if (!key) return null;
  const raw = key.trim().replace(/\s+/g, "").toLowerCase();
  if (!raw) return null;

  // Already Camelot? Accept "8a", "8A", "11b".
  const camelot = raw.match(/^(\d{1,2})([ab])$/);
  if (camelot) {
    const num = parseInt(camelot[1]!, 10);
    if (num >= 1 && num <= 12) return `${num}${camelot[2]!.toUpperCase()}`;
  }

  // Already an Open Key code? "1d", "11m" → not handled, fall through.
  // Traditional notation (Am, F#, B♭m, etc.)
  if (raw in TRADITIONAL_TO_CAMELOT) return TRADITIONAL_TO_CAMELOT[raw]!;

  return null;
}

/** Color for a musical key (Camelot or traditional). Falls back to a neutral. */
export function keyColor(key: string | undefined | null): string {
  const camelot = toCamelot(key);
  if (camelot && camelot in CAMELOT_COLORS) return CAMELOT_COLORS[camelot]!;
  return "#7c7c8e";
}

/** Color for a BPM by tempo zone. Mirrors how DJs mentally bucket energy. */
export function bpmColor(bpm: number | undefined | null): string {
  if (bpm == null || !Number.isFinite(bpm)) return "#7c7c8e";
  if (bpm < 90) return "#5fa8d3"; // chill
  if (bpm < 105) return "#52d3a4"; // mid
  if (bpm < 120) return "#a8d352"; // groove
  if (bpm < 130) return "#e8c84a"; // peak
  if (bpm < 145) return "#f08a3c"; // high energy
  return "#ef4444"; // hardcore
}
