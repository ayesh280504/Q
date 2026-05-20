import type { NowPlaying } from "../lib/trackMatch";
import type { SeratoLinkStatus } from "../hooks/useSeratoPlayback";
import TrackMeta from "./TrackMeta";

interface NowPlayingBarProps {
  nowPlaying: NowPlaying | null;
  seratoActive: boolean;
  seratoLinkStatus?: SeratoLinkStatus;
  djSoftware: "rekordbox" | "serato";
}

export default function NowPlayingBar({
  nowPlaying,
  seratoActive,
  seratoLinkStatus,
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
                  : "Tap Playing on a queue track when you mix it"}
        </p>
      )}
    </div>
  );
}
