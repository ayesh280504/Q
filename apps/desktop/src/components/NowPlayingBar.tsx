import type { NowPlaying } from "../lib/trackMatch";
import type { SeratoLinkStatus } from "../hooks/useSeratoPlayback";
import type { ProlinkStatus } from "../hooks/useProlinkPlayback";
import TrackMeta from "./TrackMeta";

interface NowPlayingBarProps {
  nowPlaying: NowPlaying | null;
  seratoActive: boolean;
  seratoLinkStatus?: SeratoLinkStatus;
  prolinkStatus?: ProlinkStatus;
  autoAdvanceActive?: boolean;
  djSoftware: "rekordbox" | "serato";
}

function rekordboxIdleMessage(
  prolinkStatus: ProlinkStatus | undefined,
  autoAdvanceActive: boolean,
): string {
  if (prolinkStatus === "connected") {
    return "Pro DJ Link connected — load a track on master deck and we'll show it here.";
  }
  if (autoAdvanceActive) {
    return "Auto-advance is on. Accept a request and we'll start the deck timer automatically.";
  }
  if (prolinkStatus === "listening" || prolinkStatus === "idle") {
    return "Tap Playing on a queue track when you mix it, or plug in a CDJ-3000 / DDJ-1000 / XDJ for live Pro DJ Link.";
  }
  return "Tap Playing on a queue track when you mix it.";
}

export default function NowPlayingBar({
  nowPlaying,
  seratoActive,
  seratoLinkStatus,
  prolinkStatus,
  autoAdvanceActive = false,
  djSoftware,
}: NowPlayingBarProps) {
  return (
    <div className="now-playing-bar">
      <span className="now-playing-label">Now playing</span>
      {nowPlaying ? (
        <div className="now-playing-track">
          <strong>{nowPlaying.title}</strong>
          <span>{nowPlaying.artist}</span>
          <TrackMeta bpm={nowPlaying.bpm} musicalKey={nowPlaying.key} />
        </div>
      ) : (
        <p className="now-playing-empty muted">
          {djSoftware === "serato" && seratoActive && seratoLinkStatus === "no_folder"
            ? "Can't find Serato History — play a track in Serato DJ Pro first"
            : djSoftware === "serato" && seratoActive && seratoLinkStatus === "empty"
              ? "Serato History is empty — start today's session in Serato"
              : djSoftware === "serato" && seratoActive
                ? "Play a track in Serato (updates in ~1s)…"
                : djSoftware === "serato"
                  ? "Serato auto-detect when gig is active"
                  : rekordboxIdleMessage(prolinkStatus, autoAdvanceActive)}
        </p>
      )}
    </div>
  );
}
