import type { NowPlaying } from "../lib/trackMatch";
import TrackMeta from "./TrackMeta";

interface NowPlayingBarProps {
  nowPlaying: NowPlaying | null;
  seratoActive: boolean;
  djSoftware: "rekordbox" | "serato";
}

export default function NowPlayingBar({
  nowPlaying,
  seratoActive,
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
          {djSoftware === "serato" && seratoActive
            ? "Start a track in Serato…"
            : djSoftware === "serato"
              ? "Serato auto-detect when gig is active"
              : "Tap Playing on a queue track when you mix it"}
        </p>
      )}
    </div>
  );
}
