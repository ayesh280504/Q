import { useEffect, useState } from "react";
import type { NowPlaying } from "../lib/trackMatch";
import type { SeratoLinkStatus } from "../hooks/useSeratoPlayback";
import type { ProlinkStatus } from "../hooks/useProlinkPlayback";
import TrackMeta from "./TrackMeta";

const WAVE_BARS = 48;
const PLAYHEAD_WIDTH = 14;

function rekordboxIdleMessage(
  prolinkStatus: ProlinkStatus | undefined,
  autoAdvanceActive: boolean,
): string {
  if (prolinkStatus === "connected") {
    return "Pro DJ Link connected — load a track on master deck.";
  }
  if (autoAdvanceActive) {
    return "Auto-advance on — accept a request to start the timer.";
  }
  if (prolinkStatus === "listening" || prolinkStatus === "idle") {
    return "Tap Playing on a queue track, or connect Pro DJ Link.";
  }
  return "Tap Playing on a queue track when you mix it.";
}

/** Decorative bar heights seeded from track title — shifts while the same track plays. */
function waveHeights(seed: string, tick: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return Array.from({ length: WAVE_BARS }, (_, i) => {
    const t = (h + i * 17 + tick * 3) % 100;
    return 22 + Math.sin(i * 0.7 + t * 0.1) * 28 + 28;
  });
}

interface Props {
  nowPlaying: NowPlaying | null;
  seratoActive: boolean;
  seratoLinkStatus?: SeratoLinkStatus;
  prolinkStatus?: ProlinkStatus;
  autoAdvanceActive?: boolean;
  djSoftware: "rekordbox" | "serato";
}

/** Command Center now-playing card — track from Serato; waveform is stylized motion. */
export default function CommandNowPlaying({
  nowPlaying,
  seratoActive,
  seratoLinkStatus,
  prolinkStatus,
  autoAdvanceActive,
  djSoftware,
}: Props) {
  const [tick, setTick] = useState(0);
  const [playhead, setPlayhead] = useState(0);

  useEffect(() => {
    if (!nowPlaying) {
      setTick(0);
      setPlayhead(0);
      return;
    }
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setPlayhead((p) => (p + 1) % WAVE_BARS);
    }, 140);
    return () => window.clearInterval(id);
  }, [nowPlaying?.title, nowPlaying?.artist]);

  const heights = waveHeights(nowPlaying?.title ?? "idle", tick);

  const idleMessage =
    djSoftware === "serato" && seratoActive && seratoLinkStatus === "no_folder"
      ? "Can't find Serato History — play a track in Serato first"
      : djSoftware === "serato" && seratoActive && seratoLinkStatus === "empty"
        ? "Serato History is empty — start today's session"
        : djSoftware === "serato" && seratoActive
          ? "Play a track in Serato (updates in ~1s)…"
          : djSoftware === "serato"
            ? "Serato auto-detect when gig is active"
            : rekordboxIdleMessage(prolinkStatus, autoAdvanceActive ?? false);

  return (
    <div className="command-now-card">
      <div className="command-now-card-glow" aria-hidden />
      <p className="command-now-kicker">// Now Playing</p>
      {nowPlaying ? (
        <>
          <p className="command-now-title">{nowPlaying.title}</p>
          <p className="command-now-artist">{nowPlaying.artist}</p>
          <TrackMeta bpm={nowPlaying.bpm} musicalKey={nowPlaying.key} />
          <div className="command-now-wave" aria-hidden>
            {heights.map((pct, i) => {
              const inPlayhead =
                i >= playhead && i < playhead + PLAYHEAD_WIDTH;
              return (
                <span
                  key={i}
                  className={inPlayhead ? "command-now-bar command-now-bar--hot" : "command-now-bar"}
                  style={{ height: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="command-now-meta">
            <span>Track live from Serato</span>
            <span className="command-now-meta-hint">Stylized viz</span>
          </div>
        </>
      ) : (
        <p className="command-now-empty muted">{idleMessage}</p>
      )}
    </div>
  );
}
