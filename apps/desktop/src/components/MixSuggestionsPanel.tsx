import { useCallback, useEffect, useState } from "react";
import type { MixSuggestionHit } from "@q/shared";
import { fetchMixSuggestions } from "../api";
import DraggableTrackRow, { mixHitToDraggable } from "./DraggableTrackRow";
import type { TrackRecord } from "@q/shared";
import { lookupInImportIndex } from "../lib/queueCrate";

const MAX_VISIBLE = 4;

type MixSuggestionsPanelProps = {
  sessionId: string;
  djToken: string;
  nowPlaying: {
    title: string;
    artist: string;
    bpm?: number;
    key?: string;
  } | null;
  importIndex: Map<string, TrackRecord>;
  trackCount: number;
  onAddToCrate?: (externalId: string, title: string, artist: string) => void;
};

export default function MixSuggestionsPanel({
  sessionId,
  djToken,
  nowPlaying,
  importIndex,
  trackCount,
  onAddToCrate,
}: MixSuggestionsPanelProps) {
  const [hits, setHits] = useState<MixSuggestionHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!nowPlaying || trackCount === 0) {
      setHits([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMixSuggestions(sessionId, djToken, {
        fromLive: true,
        title: nowPlaying.title,
        artist: nowPlaying.artist,
        bpm: nowPlaying.bpm,
        key: nowPlaying.key,
        limit: 8,
      });
      setHits(data.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load mix ideas");
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, djToken, nowPlaying, trackCount]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(t);
  }, [load]);

  if (!nowPlaying) {
    return (
      <section className="mix-coach mix-coach-compact mix-coach-empty">
        <p className="mix-coach-inline-kicker">Mix coach</p>
        <p className="mix-coach-inline-hint">Starts when Serato reports a track.</p>
      </section>
    );
  }

  if (trackCount === 0) {
    return (
      <section className="mix-coach mix-coach-compact mix-coach-empty">
        <p className="mix-coach-inline-kicker">Mix coach</p>
        <p className="mix-coach-inline-hint">Import + Sync for harmonic picks.</p>
      </section>
    );
  }

  const visible = expanded ? hits : hits.slice(0, MAX_VISIBLE);
  const hiddenCount = hits.length - MAX_VISIBLE;

  return (
    <section className="mix-coach mix-coach-compact">
      <div className="mix-coach-inline-head">
        <p className="mix-coach-inline-kicker">Mix coach</p>
        {loading && hits.length === 0 && <span className="mix-coach-inline-status">…</span>}
        {!loading && hits.length > 0 && (
          <span className="mix-coach-inline-status">{hits.length} matches</span>
        )}
      </div>

      {error && <p className="mix-coach-inline-hint">{error}</p>}
      {!loading && hits.length === 0 && !error && (
        <p className="mix-coach-inline-hint">No strong matches — Sync after import.</p>
      )}

      {visible.length > 0 && (
        <ul className="mix-coach-list mix-coach-list--compact">
          {visible.map((hit) => {
            const local = lookupInImportIndex(importIndex, {
              externalId: hit.externalId,
              title: hit.title,
              artist: hit.artist,
            });
            const track = mixHitToDraggable(
              hit,
              local?.localPath,
              local?.bpm ?? hit.bpm,
              local?.key ?? hit.key,
            );
            return (
              <DraggableTrackRow
                key={hit.id}
                track={{ ...track, matchDetail: undefined }}
                variant="suggestion"
                compact
                onLoad={
                  onAddToCrate && local?.externalId
                    ? () => onAddToCrate(local.externalId, hit.title, hit.artist)
                    : undefined
                }
              />
            );
          })}
        </ul>
      )}

      {!expanded && hiddenCount > 0 && (
        <button type="button" className="mix-coach-more" onClick={() => setExpanded(true)}>
          +{hiddenCount} more
        </button>
      )}
    </section>
  );
}
