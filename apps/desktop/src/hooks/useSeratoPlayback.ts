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

type SqliteTrack = {
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  played_at: number;
  is_playing: boolean;
};

type SqliteHistory = {
  session_id: number;
  now_playing?: SqliteTrack | null;
  entries: SqliteTrack[];
};

function sqliteToNowPlaying(track: SqliteTrack): NowPlaying {
  return {
    title: track.title,
    artist: track.artist,
    bpm: track.bpm != null && Number.isFinite(track.bpm) ? Math.round(track.bpm) : undefined,
    key: track.key?.trim() || undefined,
    playedAt: track.played_at > 0 ? track.played_at * 1000 : Date.now(),
  };
}

/** Poll Serato live history — prefers DJ Pro 3.x `master.sqlite`, falls back to legacy `.session` files. */
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

    const applyNowPlaying = (activeNow: NowPlaying) => {
      const key = `${activeNow.playedAt ?? 0}:${activeNow.title}:${activeNow.artist}:${activeNow.bpm ?? ""}:${activeNow.key ?? ""}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;
      onNowPlayingRef.current(activeNow);
    };

    const pollSqlite = async (): Promise<boolean> => {
      try {
        const data = await invoke<SqliteHistory | null>("get_serato_sqlite_history");
        if (stopped || !data?.entries?.length) return false;

        onLinkStatusRef.current?.("ok");
        onHistoryRef.current(
          data.entries.map((e) => ({
            title: e.title,
            artist: e.artist,
            playedAt: e.played_at > 0 ? e.played_at * 1000 : undefined,
          })),
        );

        const live =
          data.now_playing ??
          data.entries.find((e) => e.is_playing) ??
          data.entries[data.entries.length - 1];
        if (!live) return false;

        applyNowPlaying(sqliteToNowPlaying(live));
        return true;
      } catch {
        return false;
      }
    };

    const pollSessionFiles = async () => {
      try {
        const paths = await invoke<string[]>("list_serato_recent_sessions", {
          limit: 5,
        });
        if (stopped) return;

        if (!paths.length) {
          onLinkStatusRef.current?.("no_folder");
          return;
        }

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
        applyNowPlaying(activeNow);
      } catch {
        onLinkStatusRef.current?.("no_folder");
      }
    };

    const poll = async () => {
      const fromSqlite = await pollSqlite();
      if (stopped) return;
      if (!fromSqlite) await pollSessionFiles();
    };

    void poll();
    const id = setInterval(poll, 800);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [enabled]);
}
