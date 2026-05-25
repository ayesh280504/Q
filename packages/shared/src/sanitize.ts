/**
 * DJ libraries contain track titles with version tags that are useful at the
 * booth but ugly to the crowd. We strip a known set of suffixes so the
 * audience sees a clean "Title — Artist", while the DJ keeps the original
 * locally.
 *
 * Examples:
 *   "Starships (Dirty Intro)"       -> "Starships"
 *   "Domino [Radio Edit]"           -> "Domino"
 *   "Levitating - Extended Mix"     -> "Levitating"
 *   "Roses (feat. ROZES) - Clean"   -> "Roses (feat. ROZES)"
 */

const VERSION_TAG_PATTERNS: RegExp[] = [
  /\b(?:dirty|clean|explicit|censored|radio\s*edit|short\s*edit|edit|extended\s*mix|extended|original\s*mix|club\s*mix|club|album\s*version|album\s*mix|main\s*version|main|instrumental|inst\.?|acapella|acap|a\s*cappella|intro|outro|intro\s*dirty|intro\s*clean|dirty\s*intro|clean\s*intro|quick\s*hit|quickie|short|long|loop|stem|stems|dub|vox|vocal|no\s*vocal|capella)\b/i,
  /\b(?:remastered|remaster|remastered\s+\d{4}|\d{4}\s+remaster|\d{4}\s+remastered|mono|stereo)\b/i,
  /\b(?:explicit|clean)\s*version\b/i,
];

function containsOnlyVersionTags(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  for (const pat of VERSION_TAG_PATTERNS) {
    if (pat.test(trimmed)) {
      const stripped = trimmed.replace(pat, "").replace(/[\s\-_,&/+]+/g, "").trim();
      if (stripped.length === 0) return true;
      if (containsOnlyVersionTags(stripped)) return true;
    }
  }
  return false;
}

function stripBracketedTags(input: string, open: string, close: string): string {
  let out = "";
  let i = 0;
  while (i < input.length) {
    const start = input.indexOf(open, i);
    if (start === -1) {
      out += input.slice(i);
      break;
    }
    let depth = 0;
    let end = -1;
    for (let j = start; j < input.length; j++) {
      if (input[j] === open) depth++;
      else if (input[j] === close) {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) {
      out += input.slice(i);
      break;
    }
    const content = input.slice(start + 1, end);
    const lower = content.toLowerCase();
    // Keep collaborator parens like "(feat. X)", "(with X)", "(prod. X)"
    const isCredit =
      /^\s*(feat\.?|featuring|ft\.?|with|w\/|prod\.?|produced\s*by)\b/i.test(content);
    if (!isCredit && containsOnlyVersionTags(lower)) {
      out += input.slice(i, start).trimEnd();
      i = end + 1;
      while (i < input.length && /\s/.test(input[i]!)) i++;
      if (out.length > 0 && i < input.length && !/[\s]/.test(out[out.length - 1]!)) {
        out += " ";
      }
    } else {
      out += input.slice(i, end + 1);
      i = end + 1;
    }
  }
  return out;
}

function stripDashSuffix(input: string): string {
  // " - Radio Edit", " — Extended Mix", " – Clean"
  const dashes = /\s+[-–—]\s+/g;
  let last = -1;
  let m: RegExpExecArray | null;
  while ((m = dashes.exec(input)) !== null) last = m.index;
  if (last === -1) return input;
  const tail = input.slice(last).replace(/^\s+[-–—]\s+/, "");
  if (containsOnlyVersionTags(tail.toLowerCase())) {
    return input.slice(0, last).trimEnd();
  }
  return input;
}

/** Clean a track title for crowd display. Idempotent and safe to call repeatedly. */
export function sanitizeTrackTitle(raw: string | undefined | null): string {
  if (!raw) return "";
  let s = String(raw).trim();
  // Repeat to catch nested tags like "Title (Dirty) (Radio Edit)"
  for (let pass = 0; pass < 3; pass++) {
    const before = s;
    s = stripBracketedTags(s, "(", ")");
    s = stripBracketedTags(s, "[", "]");
    s = stripBracketedTags(s, "{", "}");
    s = stripDashSuffix(s);
    s = s.replace(/\s{2,}/g, " ").trim();
    if (s === before) break;
  }
  return s || String(raw).trim();
}

/** Light cleanup for artist names — strip trailing "- DJ Edit" type fluff. */
export function sanitizeTrackArtist(raw: string | undefined | null): string {
  if (!raw) return "";
  let s = String(raw).trim();
  s = stripDashSuffix(s);
  s = s.replace(/\s{2,}/g, " ").trim();
  return s || String(raw).trim();
}

/**
 * Looks like a custom mashup (e.g. "Starships x Domino", "Get Low / Sandstorm").
 * Used by the privacy filter so DJs can auto-hide their mashups from the crowd.
 */
export function looksLikeMashup(title: string | undefined | null): boolean {
  if (!title) return false;
  const t = String(title);
  // Word + " x " + Word, case-insensitive, not at start
  if (/\s[xX×]\s+\S/.test(t) && /\S\s[xX×]\s/.test(t)) return true;
  // "A vs B", "A v.s B"
  if (/\s(?:vs\.?|v\.?s\.?)\s+\S/i.test(t)) return true;
  // Title with slash separating two song-length names ("Get Low / Sandstorm")
  if (/^[^\/]{3,}\s*\/\s*[^\/]{3,}$/.test(t)) return true;
  return false;
}
