import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import CrowdHero from "../components/CrowdHero";
import PostGigCta from "../components/PostGigCta";
import PostGigRating from "../components/PostGigRating";
import PublicWall from "../components/PublicWall";
import ShareBooth from "../components/ShareBooth";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useSessionLivePoll } from "../hooks/useSessionLivePoll";
import type { CrowdRequest, DeclineReason, Session, TrackSearchHit } from "@q/shared";
import { DECLINE_REASON_LABELS, sanitizeTrackArtist, sanitizeTrackTitle } from "@q/shared";

/**
 * The API also sanitizes, but we run again here so existing libraries
 * (uploaded before this build) display cleanly without re-import.
 */
function cleanHit(t: TrackSearchHit): TrackSearchHit {
  return {
    ...t,
    title: sanitizeTrackTitle(t.title) || t.title,
    artist: sanitizeTrackArtist(t.artist) || t.artist,
  };
}

function sessionStillLive(session: Session | null): boolean {
  return session != null && session.isLive !== false;
}

export default function RequestPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase();
  const [session, setSession] = useState<Session | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackSearchHit[]>([]);
  const [emptySearchHint, setEmptySearchHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [declineToast, setDeclineToast] = useState<{
    title: string;
    reason?: DeclineReason;
  } | null>(null);
  const [acceptToast, setAcceptToast] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const trackedRequestsRef = useRef<Map<string, { title: string; status: "pending" | "accepted" | "declined" }>>(
    new Map(),
  );

  const loadSession = useCallback(async () => {
    if (!code) return null;
    const data = await api<{ session: Session }>(`/sessions/${code}`);
    setSession(data.session);
    return data.session;
  }, [code]);

  useEffect(() => {
    if (!code) return;
    loadSession().catch((e) => {
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
  }, [code, loadSession]);

  const refreshWhenEnded = useCallback(() => {
    loadSession().catch(() => {
      /* network blip */
    });
  }, [loadSession]);

  useSessionLivePoll(code, sessionStillLive(session), refreshWhenEnded);

  const search = useCallback(
    async (q: string) => {
      if (!code || q.length < 2 || !sessionStillLive(session)) {
        setResults([]);
        setEmptySearchHint(null);
        return;
      }
      setLoading(true);
      try {
        const data = await api<{
          results: TrackSearchHit[];
          mode: "spotify" | "library" | "none";
          streamingSearch?: boolean;
          hint?: string;
        }>(`/sessions/${code}/tracks/search?q=${encodeURIComponent(q)}`);
        setResults(data.results.map(cleanHit));
        setEmptySearchHint(data.results.length === 0 ? (data.hint ?? null) : null);
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
    [code, session],
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
    message?: string;
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
      setPendingNote("");
      setShowNoteField(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send request";
      if (msg.toLowerCase().includes("set is over") || msg.includes("gig_ended")) {
        setSession((prev) => (prev ? { ...prev, isLive: false } : prev));
        return;
      }
      setError(msg);
    }
  }

  /**
   * Poll the status of every request this device has submitted in this session
   * so we can show the DJ's verdict (and decline reason, if they gave one)
   * inline on the crowd page.
   */
  useEffect(() => {
    if (!code || !sessionStillLive(session)) return;
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
          } else if (res.status === "accepted") {
            setAcceptToast(`“${info.title}” — the DJ accepted your request!`);
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
  }, [code, session]);

  function onManual(e: FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    submitRequest({
      title: manualTitle.trim(),
      artist: manualArtist.trim() || "Unknown Artist",
      message: pendingNote.trim() || undefined,
    });
  }

  if (!code) return null;

  const djName = session?.displayName ?? session?.name;
  const gigEnded = session != null && session.isLive === false;

  if (gigEnded) {
    return (
      <div className="app post-gig-page">
        <CrowdHero
          kicker={`// ${session.code}`}
          title={
            <>
              {djName}
              <span className="crowd-title-accent"> · ended</span>
            </>
          }
        />
        <PostGigRating sessionCode={session.code} displayName={djName ?? "the DJ"} />
        <PostGigCta
          variant="ended"
          displayName={djName ?? "the DJ"}
          handle={session.djHandle}
        />
      </div>
    );
  }

  const streaming = session?.streamingSearch ?? false;
  const librarySource = session?.librarySource;
  const searchScope: "local" | "spotify" | "both" =
    librarySource === "local"
      ? "local"
      : librarySource === "spotify"
        ? "spotify"
        : librarySource === "both"
          ? "both"
          : streaming
            ? "both"
            : "local";
  const searchPlaceholder =
    searchScope === "spotify"
      ? "Search any Spotify track…"
      : searchScope === "both"
        ? "Search any song (Spotify + DJ's crate)…"
        : "Search title or artist in DJ library…";
  const searchHint =
    searchScope === "spotify"
      ? "Search Spotify's catalog — the DJ is spinning from Spotify tonight"
      : searchScope === "both"
        ? "Search any song — Spotify hits and DJ's own crate both show up"
        : "Search the DJ's synced library";

  return (
    <div className="app">
      <CrowdHero
        kicker={session ? `// ${session.code}` : "// Loading"}
        title={
          error ? (
            "Request a track"
          ) : session ? (
            <>
              {djName}
              <span className="crowd-title-accent"> · live</span>
            </>
          ) : (
            "Loading…"
          )
        }
      >
        {session && !error && (
          <p className="sub hero-hint">
            No need to shout at the booth — your request shows on the DJ&apos;s screen.
          </p>
        )}
      </CrowdHero>
      {session && (
        <p className="sub limits-hint">
          Up to {session.maxRequestsPerGuest ?? 3} requests per person · {searchHint}
        </p>
      )}

      {session && !error && (
        <ShareBooth sessionCode={session.code} displayName={djName ?? session.name} />
      )}

      {session && session.publicWall && !error && <PublicWall sessionCode={session.code} />}

      <input
        className="search"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        disabled={!session}
      />

      {loading && !error && <p className="sub">Searching…</p>}
      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="sub search-empty">
          {emptySearchHint ?? "No matches — try different words or request manually below."}
        </p>
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
                  message: pendingNote.trim() || undefined,
                })
              }
            >
              Request
            </button>
          </li>
        ))}
      </ul>

      {session?.allowShoutouts && (
        <div className="shoutout-field">
          <button
            type="button"
            className="shoutout-toggle"
            onClick={() => setShowNoteField((v) => !v)}
          >
            {showNoteField ? "Hide note" : "Add a note for the DJ"}
          </button>
          {showNoteField && (
            <input
              className="search shoutout-input"
              placeholder="Shoutout, dedication, or vibe note (optional)"
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value.slice(0, 200))}
              maxLength={200}
            />
          )}
        </div>
      )}

      <section className="manual">
        <h2>Don&apos;t see it?</h2>
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
          <button type="submit" className="btn ghost" style={{ width: "100%" }} disabled={!session}>
            Request anyway
          </button>
        </form>
      </section>

      {acceptToast && (
        <div className="toast toast-accepted" role="status">
          <strong>{acceptToast}</strong>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setAcceptToast(null)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
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
