import { useEffect, useRef, type ReactNode } from "react";
import type { MixSuggestionHit } from "@q/shared";
import TrackMeta from "./TrackMeta";
import { canDragToDeck, bindFileDragPointer } from "../lib/fileDrag";

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
  compact?: boolean;
  onLoad?: () => void;
  actions?: ReactNode;
  onDragError?: (message: string) => void;
};

export default function DraggableTrackRow({
  track,
  variant = "suggestion",
  compact,
  onLoad,
  actions,
  onDragError,
}: DraggableTrackRowProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const draggable = canDragToDeck(track.localPath);

  useEffect(() => {
    const el = handleRef.current;
    if (!el || !track.localPath || !draggable) return;
    return bindFileDragPointer(el, track.localPath, onDragError);
  }, [track.localPath, draggable, onDragError]);

  return (
    <li className={`drag-track drag-track--${variant}${compact ? " drag-track--compact" : ""}`}>
      <button
        ref={handleRef}
        type="button"
        className={`drag-handle ${draggable ? "drag-handle-active" : "drag-handle-muted"}`}
        title={
          draggable
            ? "Drag onto Serato or Rekordbox deck"
            : "No local file — import library + Sync, or match in crate"
        }
        disabled={!draggable}
      >
        <span className="drag-glyph" aria-hidden>⠿</span>
      </button>
      <div className="drag-track-body">
        <div className="drag-track-head">
          <strong className="drag-track-title">{track.title}</strong>
          <TrackMeta bpm={track.bpm} musicalKey={track.key} compact />
        </div>
        <span className="drag-track-artist">{track.artist}</span>
        {!compact && track.matchLabel && (
          <span className="drag-match-badge">
            {track.matchLabel}
            {track.score != null ? ` · ${track.score}` : ""}
            {track.matchDetail ? ` — ${track.matchDetail}` : ""}
          </span>
        )}
        {compact && track.matchLabel && (
          <span className="drag-match-badge drag-match-badge--compact">{track.matchLabel}</span>
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
  bpm?: number,
  key?: string,
): DraggableTrack {
  return {
    id: hit.id,
    title: hit.title,
    artist: hit.artist,
    bpm: bpm ?? hit.bpm,
    key: key ?? hit.key,
    localPath,
    matchLabel: hit.matchLabel,
    matchDetail: hit.matchDetail,
    score: hit.score,
  };
}
