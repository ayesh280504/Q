import type { ReactNode } from "react";
import type { MixSuggestionHit } from "@q/shared";
import TrackMeta from "./TrackMeta";
import { canDragToDeck, startFileDrag } from "../lib/fileDrag";

export type DraggableTrack = {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  localPath?: string;
  matchLabel?: string;
  matchDetail?: string;
  score?: number;
};

type DraggableTrackRowProps = {
  track: DraggableTrack;
  variant?: "suggestion" | "queue" | "request";
  onLoad?: () => void;
  actions?: ReactNode;
};

export default function DraggableTrackRow({
  track,
  variant = "suggestion",
  onLoad,
  actions,
}: DraggableTrackRowProps) {
  const draggable = canDragToDeck(track.localPath);

  async function handleDragStart() {
    if (!track.localPath) return;
    try {
      await startFileDrag(track.localPath);
    } catch (e) {
      console.warn(e);
    }
  }

  return (
    <li className={`drag-track drag-track--${variant}`}>
      <button
        type="button"
        className={`drag-handle ${draggable ? "drag-handle-active" : "drag-handle-muted"}`}
        title={
          draggable
            ? "Drag onto Serato or Rekordbox deck"
            : "No local file — Spotify-only or not in import"
        }
        disabled={!draggable}
        onMouseDown={(e) => {
          if (!draggable || e.button !== 0) return;
          e.preventDefault();
          void handleDragStart();
        }}
      >
        <span className="drag-glyph" aria-hidden>⠿</span>
      </button>
      <div className="drag-track-body">
        <div className="drag-track-head">
          <strong className="drag-track-title">{track.title}</strong>
          <TrackMeta bpm={track.bpm} musicalKey={track.key} compact />
        </div>
        <span className="drag-track-artist">{track.artist}</span>
        {track.matchLabel && (
          <span className="drag-match-badge">
            {track.matchLabel}
            {track.score != null ? ` · ${track.score}` : ""}
            {track.matchDetail ? ` — ${track.matchDetail}` : ""}
          </span>
        )}
      </div>
      {actions}
      {draggable && onLoad && (
        <button type="button" className="btn ghost drag-load-btn" onClick={onLoad}>
          + Crate
        </button>
      )}
    </li>
  );
}

export function mixHitToDraggable(
  hit: MixSuggestionHit,
  localPath?: string,
): DraggableTrack {
  return {
    id: hit.id,
    title: hit.title,
    artist: hit.artist,
    bpm: hit.bpm,
    key: hit.key,
    localPath,
    matchLabel: hit.matchLabel,
    matchDetail: hit.matchDetail,
    score: hit.score,
  };
}
