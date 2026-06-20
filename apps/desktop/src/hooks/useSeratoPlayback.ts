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
          limit: 5,
        });
        if (stopped) return;

        if (!paths.length) {
          onLinkStatusRef.current?.("no_folder");
          return;
        }

        // Paths are newest-modified first. Use the active session file — do NOT
        // pick max playedAt across old session files (shows wrong "now playing").
        let activeNow: NowPlaying | null = null;
        let activeHistory: PlayedTrack[] = [];

        for (const path of paths) {
          const bytes = await invoke<number[]>("read_binary_file", { path });
          if (!bytes?.length) continue;

          const buf = new Uint8Array(bytes);
          const entries = parseSeratoHistorySessionTracks(buf);
          if (entries.length === 0) continue;

          const now = parseSeratoHistorySession(buf);
          activeHistory = entries.map((e) => ({
            title: e.title,
            artist: e.artist,
            playedAt: e.playedAt,
          }));
          activeNow = now ?? {
            title: entries[entries.length - 1]!.title,
            artist: entries[entries.length - 1]!.artist,
            playedAt: entries[entries.length - 1]!.playedAt,
            bpm: entries[entries.length - 1]!.bpm,
            key: entries[entries.length - 1]!.key,
          };
          break;
        }

        if (!activeNow || activeHistory.length === 0) {
          onLinkStatusRef.current?.("empty");
          return;
        }

        onLinkStatusRef.current?.("ok");
        onHistoryRef.current(activeHistory);

        const key = `${activeNow.playedAt ?? 0}:${activeNow.title}:${activeNow.artist}:${activeNow.bpm ?? ""}:${activeNow.key ?? ""}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        onNowPlayingRef.current({
          title: activeNow.title,
          artist: activeNow.artist,
          bpm: activeNow.bpm,
          key: activeNow.key,
          playedAt: activeNow.playedAt,
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
