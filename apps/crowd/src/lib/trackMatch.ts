function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isUnknownArtist(artist: string): boolean {
  return !artist || artist === "unknown" || artist === "unknown artist";
}

/** Loose match between a guest request and DJ now-playing. */
export function crowdTracksMatch(
  reqTitle: string,
  reqArtist: string,
  liveTitle: string,
  liveArtist: string,
): boolean {
  const t1 = normalizeTitle(reqTitle);
  const t2 = normalizeTitle(liveTitle);
  if (!t1 || !t2) return false;
  const titleOk = t1 === t2 || t1.includes(t2) || t2.includes(t1);
  if (!titleOk) return false;

  const r1 = normalizeTitle(reqArtist);
  const r2 = normalizeTitle(liveArtist);
  if (isUnknownArtist(r1) || isUnknownArtist(r2)) return true;
  return r1 === r2 || r1.includes(r2) || r2.includes(r1);
}
