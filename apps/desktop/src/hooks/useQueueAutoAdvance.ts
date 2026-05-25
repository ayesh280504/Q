/**
 * Time-based auto-advance fallback for laptop-only Rekordbox.
 *
 * Rekordbox doesn't expose a live "now playing" signal the way Serato does,
 * and most USB-only DDJ controllers (DDJ-400 / FLX / REV) don't speak Pro DJ
 * Link either. For those rigs we offer an opt-in heuristic: when the DJ
 * accepts a request, we start a timer for that track's duration. When it
 * fires, we auto-promote the next queued item to "now playing".
 *
 * This is imperfect — the DJ might cut a track short or extend it — but it
 * means a laptop-only Rekordbox DJ never has to babysit the ▶ button. They
 * can always override with a manual ▶ on any queue item.
 */

import { useEffect, useRef } from "react";
import type { NowPlaying, UpNextItem } from "../lib/trackMatch";

interface UseQueueAutoAdvanceOptions {
  /** Whether auto-advance is enabled in settings (default off). */
  enabled: boolean;
  /** Current "now playing" track. Timer keys off this. */
  nowPlaying: NowPlaying | null;
  /** Queue of accepted-but-not-yet-played items, in play order. */
  queue: UpNextItem[];
  /** Called when the timer fires and the next queue item should start. */
  onAdvance: (next: UpNextItem) => void;
  /** Called when the timer fires but the queue is empty — deck is now idle. */
  onDeckIdle?: () => void;
  /** Fallback when a track has no parsed duration (most pop tracks ≈ 3-4 min). */
  defaultDurationSec?: number;
}

export function useQueueAutoAdvance({
  enabled,
  nowPlaying,
  queue,
  onAdvance,
  onDeckIdle,
  defaultDurationSec = 240,
}: UseQueueAutoAdvanceOptions) {
  const onAdvanceRef = useRef(onAdvance);
  const onDeckIdleRef = useRef(onDeckIdle);
  const queueRef = useRef(queue);
  onAdvanceRef.current = onAdvance;
  onDeckIdleRef.current = onDeckIdle;
  queueRef.current = queue;

  // Key built from the current track so React re-runs the effect when the
  // active track actually changes (not when unrelated state mutates).
  const trackKey = nowPlaying
    ? `${nowPlaying.title}\0${nowPlaying.artist}\0${nowPlaying.playedAt ?? ""}`
    : null;

  useEffect(() => {
    if (!enabled || !nowPlaying) return;

    const seconds = nowPlaying.durationSec || defaultDurationSec;
    const ms = Math.max(20_000, seconds * 1000);

    const timer = setTimeout(() => {
      const next = queueRef.current[0];
      if (next) {
        onAdvanceRef.current(next);
      } else {
        onDeckIdleRef.current?.();
      }
    }, ms);

    return () => clearTimeout(timer);
  }, [enabled, trackKey, defaultDurationSec, nowPlaying]);
}
