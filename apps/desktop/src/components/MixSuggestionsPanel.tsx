import { useCallback, useEffect, useState } from "react";
import type { MixSuggestionHit } from "@q/shared";
import { fetchMixSuggestions } from "../api";
import DraggableTrackRow, { mixHitToDraggable } from "./DraggableTrackRow";
import type { TrackRecord } from "@q/shared";

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
      <section className="mix-coach mix-coach-empty">
        <p className="command-section-kicker">// Mix coach</p>
        <p className="muted">Start playing — Q ranks your library for the next blend.</p>
      </section>
    );
  }

  if (trackCount === 0) {
    return (
      <section className="mix-coach mix-coach-empty">
        <p className="command-section-kicker">// Mix coach</p>
        <p className="muted">Import library + Sync so Q can suggest harmonic matches.</p>
      </section>
    );
  }

  return (
    <section className="mix-coach">
      <div className="mix-coach-head">
        <p className="command-section-kicker command-section-kicker--mix">
          // Mix coach · drag onto deck
        </p>
        <p className="mix-coach-from muted">
          From {nowPlaying.title}
          {nowPlaying.bpm ? ` · ${nowPlaying.bpm} BPM` : ""}
          {nowPlaying.key ? ` · ${nowPlaying.key}` : ""}
        </p>
      </div>
      {loading && hits.length === 0 && <p className="muted">Ranking your crate…</p>}
      {error && <p className="muted">{error}</p>}
      {!loading && hits.length === 0 && !error && (
        <p className="muted">No strong matches in synced library — try Sync after import.</p>
      )}
      <ul className="mix-coach-list">
        {hits.map((hit) => {
          const local = hit.externalId ? importIndex.get(hit.externalId) : undefined;
          const localPath = local?.localPath;
          const track = mixHitToDraggable(hit, localPath);
          return (
            <DraggableTrackRow
              key={hit.id}
              track={track}
              variant="suggestion"
              onLoad={
                onAddToCrate && local?.externalId
                  ? () => onAddToCrate(local.externalId, hit.title, hit.artist)
                  : undefined
              }
            />
          );
        })}
      </ul>
      <p className="mix-coach-hint muted">
        Drag ⠿ onto Serato or Rekordbox — no API key needed.
      </p>
    </section>
  );
}
