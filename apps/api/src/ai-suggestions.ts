import type { TransitionSuggestion } from "@q/shared";
import { buildProTransitionHints } from "./suggestions.js";

/** Pro tier: transition hints + AI co-pilot (LLM hooks in here). */
export function buildProSuggestions(
  base: TransitionSuggestion[],
  sessionId: string,
  acceptedTrackId: string | null,
  requestTitle: string,
  requestArtist: string,
): TransitionSuggestion[] {
  return [
    ...base,
    ...buildProTransitionHints(sessionId, acceptedTrackId),
    {
      type: "ai",
      label: "Wordplay bridge",
      detail: `Look for a lyrical or thematic link between your current track and “${requestTitle}” — crowd-pleasing without forcing the drop.`,
      pro: true,
    },
    {
      type: "ai",
      label: "Energy arc",
      detail: `Ride into “${requestTitle}” by ${requestArtist} over 16–32 bars: filter → add hats → tease the vocal, then full swap.`,
      pro: true,
    },
    {
      type: "ai",
      label: "Pro transitions",
      detail: "Full AI transition map (harmonic paths, popular blends, wordplay) — connect your API key in a future Q Pro build.",
      pro: true,
    },
  ];
}
