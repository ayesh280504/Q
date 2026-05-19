import type { TransitionSuggestion } from "@q/shared";
import { db } from "./db.js";

const CAMELOT: Record<string, string> = {
  "1A": "Ab minor", "2A": "Eb minor", "3A": "Bb minor", "4A": "F minor",
  "5A": "C minor", "6A": "G minor", "7A": "D minor", "8A": "A minor",
  "9A": "E minor", "10A": "B minor", "11A": "F# minor", "12A": "C# minor",
  "1B": "B major", "2B": "F# major", "3B": "Db major", "4B": "Ab major",
  "5B": "Eb major", "6B": "Bb major", "7B": "F major", "8B": "C major",
  "9B": "G major", "10B": "D major", "11B": "A major", "12B": "E major",
};

function normalizeKey(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  const k = key.trim().toUpperCase();
  if (CAMELOT[k]) return k;
  return key;
}

/** Free tier: simple “up next” card — no Pro transition copy. */
export function buildSuggestions(
  sessionId: string,
  acceptedTrackId: string | null,
  requestTitle: string,
  requestArtist: string,
): TransitionSuggestion[] {
  type AcceptedRow = { title: string; artist: string; bpm: number | null; key: string | null };
  let accepted: AcceptedRow | undefined;

  if (acceptedTrackId) {
    accepted = db
      .prepare(
        `SELECT title, artist, bpm, key FROM tracks WHERE id = ? AND session_id = ?`,
      )
      .get(acceptedTrackId, sessionId) as AcceptedRow | undefined;
  }

  const title = accepted?.title ?? requestTitle;
  const artist = accepted?.artist ?? requestArtist;
  const meta: string[] = [];
  if (accepted?.bpm) meta.push(`${accepted.bpm} BPM`);
  if (accepted?.key) {
    const cam = normalizeKey(accepted.key);
    meta.push(cam && CAMELOT[cam] ? `${cam} · ${CAMELOT[cam]}` : accepted.key);
  }

  return [
    {
      type: "track",
      label: title,
      detail: meta.length > 0 ? `${artist} · ${meta.join(" · ")}` : artist,
    },
  ];
}

/** Pro-only transition hints (BPM, key, creative bridges). */
export function buildProTransitionHints(
  sessionId: string,
  acceptedTrackId: string | null,
): TransitionSuggestion[] {
  if (!acceptedTrackId) return [];

  const accepted = db
    .prepare(
      `SELECT title, artist, bpm, key FROM tracks WHERE id = ? AND session_id = ?`,
    )
    .get(acceptedTrackId, sessionId) as {
      title: string;
      artist: string;
      bpm: number | null;
      key: string | null;
    } | undefined;

  if (!accepted) return [];

  const hints: TransitionSuggestion[] = [];

  if (accepted.bpm) {
    hints.push({
      type: "bpm",
      label: "Tempo",
      detail: `~${accepted.bpm} BPM — “${accepted.title}”`,
      pro: true,
    });
  }

  if (accepted.key) {
    const cam = normalizeKey(accepted.key);
    hints.push({
      type: "key",
      label: "Key",
      detail:
        cam && CAMELOT[cam]
          ? `${cam} (${CAMELOT[cam]})`
          : accepted.key,
      pro: true,
    });
  }

  hints.push({
    type: "note",
    label: "Creative bridge",
    detail: `Wordplay or energy bridge into “${accepted.title}”.`,
    pro: true,
  });

  return hints;
}
