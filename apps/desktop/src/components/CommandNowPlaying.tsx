import type { NowPlaying } from "../lib/trackMatch";
import type { SeratoLinkStatus } from "../hooks/useSeratoPlayback";
import type { ProlinkStatus } from "../hooks/useProlinkPlayback";

const WAVE_BARS = 48;

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

function waveHeights(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return Array.from({ length: WAVE_BARS }, (_, i) => {
    const t = (h + i * 17) % 100;
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

/** Command Center now-playing card with waveform (falls back to idle copy). */
export default function CommandNowPlaying({
  nowPlaying,
  seratoActive,
  seratoLinkStatus,
  prolinkStatus,
  autoAdvanceActive,
  djSoftware,
}: Props) {
  const heights = waveHeights(nowPlaying?.title ?? "idle");
  const activeBars = nowPlaying ? Math.floor(WAVE_BARS * 0.42) : 0;

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
          <div className="command-now-wave" aria-hidden>
            {heights.map((pct, i) => (
              <span
                key={i}
                style={{
                  height: `${pct}%`,
                  opacity: i < activeBars ? 1 : 0.22,
                }}
              />
            ))}
          </div>
          <div className="command-now-meta">
            <span>Live</span>
            <span>
              {nowPlaying.bpm ? `${nowPlaying.bpm} BPM` : "—"}
              {nowPlaying.key ? ` · ${nowPlaying.key}` : ""}
            </span>
            <span>—</span>
          </div>
        </>
      ) : (
        <p className="command-now-empty muted">{idleMessage}</p>
      )}
    </div>
  );
}
