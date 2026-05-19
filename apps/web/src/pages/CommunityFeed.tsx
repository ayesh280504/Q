import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { fetchFeed, recordMixPlay } from "../lib/accountApi";
import type { Mix } from "@q/shared";
import "../community.css";

type FeedMix = Mix & {
  dj: { handle: string; displayName: string; verified: boolean; avatarUrl?: string };
};

export default function CommunityFeed() {
  const [mixes, setMixes] = useState<FeedMix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed()
      .then((d) => setMixes(d.mixes))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load feed"))
      .finally(() => setLoading(false));
  }, []);

  function openMix(m: FeedMix) {
    void recordMixPlay(m.id).catch(() => {});
    window.open(m.externalUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main">
        <header className="community-header">
          <h1>Mix feed</h1>
          <p className="muted">Discover sets from DJs on Q — link your SoundCloud or Mixcloud.</p>
        </header>

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}

        <ul className="mix-feed">
          {mixes.map((m) => (
            <li key={m.id} className="mix-card">
              <div className="mix-card-top">
                <Link to={`/dj/${m.dj.handle}`} className="dj-link">
                  {m.dj.displayName}
                  {m.dj.verified && <span className="verified">✓</span>}
                </Link>
                <span className="plays">{m.playCount} plays</span>
              </div>
              <h2>{m.title}</h2>
              {m.description && <p className="mix-desc">{m.description}</p>}
              <button type="button" className="btn primary" onClick={() => openMix(m)}>
                Listen
              </button>
            </li>
          ))}
        </ul>

        {!loading && mixes.length === 0 && (
          <p className="muted">No public mixes yet. Be the first — sign in and add one in Studio.</p>
        )}
      </main>
    </div>
  );
}
