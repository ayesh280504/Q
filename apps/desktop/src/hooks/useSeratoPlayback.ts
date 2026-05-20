import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  parseSeratoHistorySession,
  parseSeratoHistorySessionTracks,
} from "@q/serato";
import type { NowPlaying, PlayedTrack } from "../lib/trackMatch";

export type SeratoLinkStatus = "idle" | "ok" | "no_folder" | "no_session" | "empty";

interface UseSeratoPlaybackOptions {
  enabled: boolean;
  onNowPlaying: (track: NowPlaying | null) => void;
  onHistory: (tracks: PlayedTrack[]) => void;
  onLinkStatus?: (status: SeratoLinkStatus) => void;
}

/** Poll Serato History — now playing, full session history, BPM/key when present. */
export function useSeratoPlayback({
  enabled,
  onNowPlaying,
  onHistory,
  onLinkStatus,
}: UseSeratoPlaybackOptions) {
  const onNowPlayingRef = useRef(onNowPlaying);
  const onHistoryRef = useRef(onHistory);
  const onLinkStatusRef = useRef(onLinkStatus);
  onNowPlayingRef.current = onNowPlaying;
  onHistoryRef.current = onHistory;
  onLinkStatusRef.current = onLinkStatus;
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastKeyRef.current = null;
      onLinkStatusRef.current?.("idle");
      return;
    }

    let stopped = false;

    const poll = async () => {
      try {
        const paths = await invoke<string[]>("list_serato_recent_sessions", {
          limit: 3,
        });
        if (stopped) return;

        if (!paths.length) {
          onLinkStatusRef.current?.("no_folder");
          return;
        }

        let bestNow: NowPlaying | null = null;
        let bestHistory: PlayedTrack[] = [];
        let bestHistoryLen = 0;

        for (const path of paths) {
          const bytes = await invoke<number[]>("read_binary_file", { path });
          if (!bytes?.length) continue;

          const buf = new Uint8Array(bytes);
          const entries = parseSeratoHistorySessionTracks(buf);
          if (entries.length === 0) continue;

          const now = parseSeratoHistorySession(buf);
          if (entries.length >= bestHistoryLen) {
            bestHistoryLen = entries.length;
            bestHistory = entries.map((e) => ({
              title: e.title,
              artist: e.artist,
              playedAt: e.playedAt,
            }));
          }
          if (path === paths[0] && now) {
            bestNow = now;
          }
        }

        if (bestHistoryLen === 0) {
          onLinkStatusRef.current?.("empty");
          return;
        }

        onLinkStatusRef.current?.("ok");
        onHistoryRef.current(bestHistory);

        if (!bestNow) return;

        const key = `${bestNow.playedAt ?? 0}:${bestNow.title}:${bestNow.artist}:${bestNow.bpm ?? ""}:${bestNow.key ?? ""}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        onNowPlayingRef.current({
          title: bestNow.title,
          artist: bestNow.artist,
          bpm: bestNow.bpm,
          key: bestNow.key,
          playedAt: bestNow.playedAt,
        });
      } catch {
        onLinkStatusRef.current?.("no_folder");
      }
    };

    void poll();
    const id = setInterval(poll, 800);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [enabled]);
}
