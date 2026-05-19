import { FormEvent, useCallback, useEffect, useState } from "react";
import QLogo from "../components/QLogo";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { Session } from "@q/shared";

interface SearchHit {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  inStock: boolean;
  playedEarlierTonight?: boolean;
}

export default function RequestPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase();
  const [session, setSession] = useState<Session | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");

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
            `No gig found for code “${code}”. Copy the URL from the DJ app after Start gig (codes are case-sensitive).`,
          );
        } else {
          setError(msg || "Could not load this session. Start a new gig on the DJ app.");
        }
      });
  }, [code]);

  const search = useCallback(async (q: string) => {
    if (!code || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ results: SearchHit[] }>(
        `/sessions/${code}/library/search?q=${encodeURIComponent(q)}`,
      );
      setResults(data.results);
    } catch (e) {
      setResults([]);
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError(
          "Cannot reach the Q server. Check that npm run dev:stack is running on the DJ laptop.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function submitRequest(payload: {
    title: string;
    artist: string;
    trackId?: string;
  }) {
    if (!code) return;
    setError(null);
    try {
      const res = await api<{ message?: string }>(`/sessions/${code}/requests`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSent(
        res.message ??
          `Request sent for “${payload.title}”. The DJ will see it when they sync.`,
      );
      setQuery("");
      setResults([]);
      setManualTitle("");
      setManualArtist("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send request");
    }
  }

  function onManual(e: FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    submitRequest({
      title: manualTitle.trim(),
      artist: manualArtist.trim() || "Unknown Artist",
    });
  }

  if (!code) return null;

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
      {session && (
        <p className="sub limits-hint">
          Up to {session.maxRequestsPerGuest ?? 3} requests per person this set.
        </p>
      )}
      {session && !session.librarySyncedAt && (
        <p className="sub library-hint">
          The DJ hasn&apos;t synced their library yet — search may be empty. You can still request
          any track below.
        </p>
      )}

      <input
        className="search"
        placeholder="Search title or artist…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      {loading && !error && <p className="sub">Searching…</p>}
      {session && !loading && query.length >= 2 && results.length === 0 && (
        <p className="sub">No matches — try another spelling or use “Request anyway” below.</p>
      )}

      <ul className="results">
        {results.map((t) => (
          <li key={t.id} className="track">
            <div>
              <h3>{t.title}</h3>
              <p>{t.artist}{t.bpm ? ` · ${t.bpm} BPM` : ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              {t.playedEarlierTonight && (
                <span className="badge played-earlier">Played once already</span>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={() => submitRequest({ title: t.title, artist: t.artist, trackId: t.id })}
              >
                Request
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="manual">
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>Don&apos;t see it?</h2>
        <p className="sub" style={{ marginTop: 0 }}>
          Type any title — the DJ will see it even if it&apos;s not in their library search.
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

      {sent && <p className="toast">{sent}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
