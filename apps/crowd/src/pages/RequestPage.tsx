import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import QLogo from "../components/QLogo";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { CrowdRequest, DeclineReason, Session, TrackSearchHit } from "@q/shared";
import { DECLINE_REASON_LABELS, sanitizeTrackArtist, sanitizeTrackTitle } from "@q/shared";

/**
 * The API also sanitizes, but we run it again here so existing libraries
 * (uploaded before this build) display cleanly without re-import.
 */
function cleanHit(t: TrackSearchHit): TrackSearchHit {
  return {
    ...t,
    title: sanitizeTrackTitle(t.title) || t.title,
    artist: sanitizeTrackArtist(t.artist) || t.artist,
  };
}

export default function RequestPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase();
  const [session, setSession] = useState<Session | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [declineToast, setDeclineToast] = useState<{
    title: string;
    reason?: DeclineReason;
  } | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const trackedRequestsRef = useRef<Map<string, { title: string; status: "pending" | "accepted" | "declined" }>>(
    new Map(),
  );

  useEffect(() => {
    if (!code) return;
    api<{ session: Session }>(`/sessions/${code}`)
      .then((d) => setSession(d.session))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
          setError(
            "Cannot reach the Q server. On your laptop, run npm run dev:stack and use the same Wi‑Fi.",
          );
        } else if (msg === "Session not found") {
          setError(
            `No gig found for code “${code}”. Copy the URL from the DJ app after Start gig.`,
          );
        } else {
          setError(msg || "Could not load this session.");
        }
      });
  }, [code]);

  const search = useCallback(
    async (q: string) => {
      if (!code || q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await api<{
          results: TrackSearchHit[];
          mode: "spotify" | "library" | "none";
        }>(`/sessions/${code}/tracks/search?q=${encodeURIComponent(q)}`);
        setResults(data.results.map(cleanHit));
      } catch (e) {
        setResults([]);
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
          setError("Cannot reach the Q server. Check npm run dev:stack on the DJ laptop.");
        }
      } finally {
        setLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function submitRequest(payload: {
    title: string;
    artist: string;
    trackId?: string;
    spotifyId?: string;
    bpm?: number;
    key?: string;
    albumArtUrl?: string;
  }) {
    if (!code) return;
    setError(null);
    setDeclineToast(null);
    try {
      const res = await api<{ message?: string; request: CrowdRequest }>(
        `/sessions/${code}/requests`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      setSent(
        res.message ??
          `Request sent for “${payload.title}”. The DJ will see it on their screen — no need to yell over the music.`,
      );
      trackedRequestsRef.current.set(res.request.id, {
        title: payload.title,
        status: "pending",
      });
      setQuery("");
      setResults([]);
      setManualTitle("");
      setManualArtist("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send request");
    }
  }

  /**
   * Poll the status of every request this device has submitted in this session
   * so we can show the DJ's verdict (and decline reason, if they gave one)
   * inline on the crowd page.
   */
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      const active = Array.from(trackedRequestsRef.current.entries()).filter(
        ([, info]) => info.status === "pending",
      );
      if (active.length === 0) return;
      for (const [requestId, info] of active) {
        try {
          const res = await api<{
            status: "pending" | "accepted" | "declined";
            declineReason?: DeclineReason;
          }>(`/sessions/${code}/requests/${requestId}/status`);
          if (cancelled) return;
          if (res.status === info.status) continue;
          trackedRequestsRef.current.set(requestId, { ...info, status: res.status });
          if (res.status === "declined") {
            setDeclineToast({ title: info.title, reason: res.declineReason });
          }
        } catch {
          /* network blip — try again next tick */
        }
      }
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [code]);

  function onManual(e: FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    submitRequest({
      title: manualTitle.trim(),
      artist: manualArtist.trim() || "Unknown Artist",
    });
  }

  if (!code) return null;

  const streaming = session?.streamingSearch ?? false;

  return (
    <div className="app">
      <QLogo size={48} className="brand-mark" />
      <p className="sub">
        {error
          ? null
          : session
            ? `Request a track — ${session.displayName ?? session.name}`
            : "Loading…"}
      </p>
      {session && !error && (
        <p className="sub hero-hint">
          No need to shout at the booth — your request shows on the DJ&apos;s screen.
        </p>
      )}
      {session && (
        <p className="sub limits-hint">
          Up to {session.maxRequestsPerGuest ?? 3} requests per person ·{" "}
          {streaming
            ? "Search any song — BPM & key go to the DJ automatically"
            : "Search the DJ's synced library"}
        </p>
      )}

      <input
        className="search"
        placeholder={
          streaming ? "Search any song (Spotify)…" : "Search title or artist in DJ library…"
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      {loading && !error && <p className="sub">Searching…</p>}
      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="sub">No matches — try different words or request manually below.</p>
      )}

      <ul className="results">
        {results.map((t) => (
          <li key={t.id} className="track">
            {t.albumArtUrl && (
              <img src={t.albumArtUrl} alt="" className="track-art" width={48} height={48} />
            )}
            <div className="track-body">
              <h3>{t.title}</h3>
              <p>
                {t.artist}
                {t.bpm ? ` · ${t.bpm} BPM` : ""}
                {t.key ? ` · ${t.key}` : ""}
              </p>
              <div className="track-badges">
                {t.isHot && (
                  <span className="badge badge-hot" title="DJ plays this track often">
                    <span aria-hidden="true">🔥</span> HOT
                  </span>
                )}
                {t.isNew && (
                  <span className="badge badge-new" title="Newly added to the DJ's library">
                    NEW
                  </span>
                )}
                {t.source === "spotify" && <span className="badge source-spotify">Spotify</span>}
                {t.inStock && <span className="badge source-library">In DJ crate</span>}
                {t.playedEarlierTonight && (
                  <span className="badge played-earlier">Played tonight</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                submitRequest({
                  title: t.title,
                  artist: t.artist,
                  trackId: t.libraryTrackId,
                  spotifyId: t.spotifyId,
                  bpm: t.bpm,
                  key: t.key,
                  albumArtUrl: t.albumArtUrl,
                })
              }
            >
              Request
            </button>
          </li>
        ))}
      </ul>

      <section className="manual">
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>Don&apos;t see it?</h2>
        <p className="sub" style={{ marginTop: 0 }}>
          Type any track — the DJ still gets your request even if search misses it.
        </p>
        <form onSubmit={onManual}>
          <input
            className="search"
            placeholder="Track title"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
          />
          <input
            className="search"
            placeholder="Artist (optional)"
            value={manualArtist}
            onChange={(e) => setManualArtist(e.target.value)}
          />
          <button type="submit" className="btn ghost" style={{ width: "100%" }}>
            Request anyway
          </button>
        </form>
      </section>

      {declineToast && (
        <div className="toast toast-declined" role="status">
          <strong>
            “{declineToast.title}” — the DJ passed on this one.
          </strong>
          {declineToast.reason && (
            <span>
              {" "}
              Reason: <em>{DECLINE_REASON_LABELS[declineToast.reason]}</em>.
            </span>
          )}
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setDeclineToast(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {sent && <p className="toast">{sent}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
