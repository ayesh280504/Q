import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthGateModal from "../components/AuthGateModal";
import CommunityNav from "../components/CommunityNav";
import MixCommentsModal from "../components/MixCommentsModal";
import { useAuth } from "../context/AuthContext";
import {
  fetchFeed,
  fetchFollowingFeed,
  likeMix,
  recordMixPlay,
  saveMix,
  unlikeMix,
  unsaveMix,
  type FeedMix,
} from "../lib/accountApi";
import "../community.css";

type FeedTab = "popular" | "following";

export default function CommunityFeed() {
  const { signedIn } = useAuth();
  const [tab, setTab] = useState<FeedTab>("popular");
  const [mixes, setMixes] = useState<FeedMix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateAction, setGateAction] = useState<string | null>(null);
  const [commentMix, setCommentMix] = useState<FeedMix | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "following") {
        if (!signedIn) {
          setMixes([]);
          return;
        }
        const d = await fetchFollowingFeed();
        setMixes(d.mixes);
      } else {
        const d = await fetchFeed();
        setMixes(d.mixes);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load feed");
      setMixes([]);
    } finally {
      setLoading(false);
    }
  }, [tab, signedIn]);

  useEffect(() => {
    if (tab === "following" && !signedIn) return;
    void loadFeed();
  }, [tab, signedIn, loadFeed]);

  function requireAuth(action: string, fn: () => void) {
    if (!signedIn) {
      setGateAction(action);
      return;
    }
    fn();
  }

  function updateMixStats(mixId: string, stats: Partial<FeedMix>) {
    setMixes((prev) =>
      prev.map((m) => (m.id === mixId ? { ...m, ...stats } : m)),
    );
  }

  async function toggleLike(m: FeedMix) {
    const stats = m.likedByMe ? await unlikeMix(m.id) : await likeMix(m.id);
    updateMixStats(m.id, stats);
  }

  async function toggleSave(m: FeedMix) {
    const stats = m.savedByMe ? await unsaveMix(m.id) : await saveMix(m.id);
    updateMixStats(m.id, stats);
  }

  function openMix(m: FeedMix) {
    void recordMixPlay(m.id).catch(() => {});
    window.open(m.externalUrl, "_blank", "noopener,noreferrer");
  }

  function onFollowingTab() {
    if (!signedIn) {
      setGateAction("see mixes from DJs you follow");
      return;
    }
    setTab("following");
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <AuthGateModal
        open={Boolean(gateAction)}
        action={gateAction ?? ""}
        onClose={() => setGateAction(null)}
      />
      {commentMix && signedIn && (
        <MixCommentsModal
          mixId={commentMix.id}
          mixTitle={commentMix.title}
          open
          onClose={() => setCommentMix(null)}
          onPosted={() => void loadFeed()}
        />
      )}

      <main className="community-main">
        <header className="community-header">
          <h1>Mix feed</h1>
          <p className="muted">
            <strong>Popular</strong> is open to everyone. Like, comment, save, and your following
            feed need an account.
          </p>
        </header>

        <div className="feed-tabs">
          <button
            type="button"
            className={`feed-tab ${tab === "popular" ? "active" : ""}`}
            onClick={() => setTab("popular")}
          >
            Popular
          </button>
          <button
            type="button"
            className={`feed-tab ${tab === "following" ? "active" : ""}`}
            onClick={onFollowingTab}
          >
            Following
          </button>
        </div>

        {tab === "following" && !signedIn && (
          <p className="muted feed-hint">
            <button type="button" className="btn-link-nav" onClick={() => setGateAction("follow DJs and see their mixes")}>
              Sign up
            </button>{" "}
            to build your following feed.
          </p>
        )}

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}

        <ul className="mix-feed">
          {mixes.map((m) => (
            <li key={m.id} className="mix-card">
              <div className="mix-card-top">
                <Link to={`/dj/${m.dj.handle}`} className="dj-link">
                  @{m.dj.handle}
                  {m.dj.verified && <span className="verified">✓</span>}
                </Link>
                <span className="plays">{m.playCount} plays</span>
              </div>
              <h2>{m.title}</h2>
              {m.description && <p className="mix-desc">{m.description}</p>}

              <div className="mix-engagement">
                <button
                  type="button"
                  className={`mix-engagement-btn ${m.likedByMe ? "active" : ""}`}
                  onClick={() => requireAuth("like mixes", () => void toggleLike(m))}
                >
                  ♥ {m.likeCount ?? 0}
                </button>
                <button
                  type="button"
                  className="mix-engagement-btn"
                  onClick={() =>
                    requireAuth("comment on mixes", () => setCommentMix(m))
                  }
                >
                  💬 {m.commentCount ?? 0}
                </button>
                <button
                  type="button"
                  className={`mix-engagement-btn ${m.savedByMe ? "active" : ""}`}
                  onClick={() => requireAuth("save mixes", () => void toggleSave(m))}
                >
                  {m.savedByMe ? "★ Saved" : "☆ Save"}
                </button>
              </div>

              <button type="button" className="btn primary" onClick={() => openMix(m)}>
                Listen
              </button>
            </li>
          ))}
        </ul>

        {!loading && tab === "popular" && mixes.length === 0 && (
          <p className="muted">No public mixes yet. Be the first — sign in and add one in Studio.</p>
        )}
        {!loading && tab === "following" && signedIn && mixes.length === 0 && (
          <p className="muted">
            Follow DJs from their profiles to see their latest mixes here.
          </p>
        )}
      </main>
    </div>
  );
}
