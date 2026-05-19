import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { parseSeratoHistorySessionTracks } from "@q/serato";
import type { NowPlaying, PlayedTrack } from "../lib/trackMatch";

interface UseSeratoPlaybackOptions {
  enabled: boolean;
  onNowPlaying: (track: NowPlaying | null) => void;
  onHistory: (tracks: PlayedTrack[]) => void;
}

/** Poll Serato History — now playing, full session history, BPM/key when present. */
export function useSeratoPlayback({
  enabled,
  onNowPlaying,
  onHistory,
}: UseSeratoPlaybackOptions) {
  const onNowPlayingRef = useRef(onNowPlaying);
  const onHistoryRef = useRef(onHistory);
  onNowPlayingRef.current = onNowPlaying;
  onHistoryRef.current = onHistory;
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastKeyRef.current = null;
      return;
    }

    let stopped = false;

    const poll = async () => {
      try {
        const bytes = await invoke<number[] | null>("get_serato_latest_session");
        if (stopped || !bytes?.length) return;

        const entries = parseSeratoHistorySessionTracks(new Uint8Array(bytes));
        if (entries.length === 0) return;

        onHistoryRef.current(
          entries.map((e) => ({
            title: e.title,
            artist: e.artist,
            playedAt: e.playedAt,
          })),
        );

        const latest = entries.reduce((a, b) =>
          (b.playedAt ?? 0) >= (a.playedAt ?? 0) ? b : a,
        );

        const key = `${latest.playedAt ?? 0}:${latest.title}:${latest.artist}:${latest.bpm ?? ""}:${latest.key ?? ""}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        onNowPlayingRef.current({
          title: latest.title,
          artist: latest.artist,
          bpm: latest.bpm,
          key: latest.key,
          playedAt: latest.playedAt,
        });
      } catch {
        /* Tauri unavailable or Serato folder missing */
      }
    };

    void poll();
    const id = setInterval(poll, 1500);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [enabled]);
}
