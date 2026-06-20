import type { TransitionSuggestion } from "@q/shared";
import { scoreMixability } from "@q/shared";
import { buildProTransitionHints } from "./suggestions.js";
import { db } from "./db.js";

/** Pro tier: transition hints + request-aware blend coaching. */
export function buildProSuggestions(
  base: TransitionSuggestion[],
  sessionId: string,
  acceptedTrackId: string | null,
  requestTitle: string,
  requestArtist: string,
  nowBpm?: number | null,
  nowKey?: string | null,
): TransitionSuggestion[] {
  const hints = buildProTransitionHints(sessionId, acceptedTrackId);

  let blendDetail = `Ride into “${requestTitle}” over 16–32 bars — filter, tease vocal, full swap.`;
  if (acceptedTrackId) {
    const accepted = db
      .prepare(`SELECT bpm, key FROM tracks WHERE id = ? AND session_id = ?`)
      .get(acceptedTrackId, sessionId) as { bpm: number | null; key: string | null } | undefined;
    if (accepted) {
      const mix = scoreMixability({
        fromBpm: nowBpm ?? undefined,
        fromKey: nowKey ?? undefined,
        toBpm: accepted.bpm,
        toKey: accepted.key,
      });
      blendDetail = `${mix.label} (${mix.score}/100) — ${mix.detail}. Blend into “${requestTitle}”.`;
    }
  }

  return [
    ...base,
    ...hints,
    {
      type: "ai",
      label: "Request blend",
      detail: blendDetail,
      pro: true,
    },
    {
      type: "ai",
      label: "Crowd moment",
      detail: `Someone asked for “${requestTitle}” — acknowledge the room when you drop it for extra energy.`,
      pro: true,
    },
  ];
}
