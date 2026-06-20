import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthGateModal from "../components/AuthGateModal";
import CommunityLayout from "../components/CommunityLayout";
import MixCommentsModal from "../components/MixCommentsModal";
import { useAuth } from "../context/AuthContext";
import {
  fetchFeed,
  fetchFollowingFeed,
  fetchTopRatedDjs,
  likeMix,
  recordMixPlay,
  saveMix,
  unlikeMix,
  unsaveMix,
  type FeedMix,
  type TopRatedDj,
} from "../lib/accountApi";

type FeedTab = "popular" | "following";

const GENRES = ["All", "Techno", "House", "Afro", "Bass"] as const;
const GRADIENT_VARIANTS = ["g0", "g1", "g2", "g3", "g4", "g5"] as const;
const GENRE_LABELS = [
  "Techno",
  "Melodic House",
  "Industrial",
  "Afro House",
  "Electro",
  "Deep House",
] as const;

function formatStatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function pseudoBpm(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return 118 + (h % 18);
}

function pseudoDuration(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) % 997;
  const hrs = 1 + (h % 2);
  const mins = 8 + (h % 52);
  const secs = h % 60;
  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function MixCard({
  mix,
  index,
  signedIn,
  onOpen,
  onLike,
  onComment,
  onSave,
}: {
  mix: FeedMix;
  index: number;
  signedIn: boolean;
  onOpen: () => void;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
}) {
  const grad = GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length];
  const likes = mix.likeCount ?? mix.playCount;

  return (
    <article className="community-mix-card">
      <button type="button" className="community-mix-art-btn" onClick={onOpen}>
        <div className={`community-mix-art community-mix-art--${grad}`}>
          <div className="community-mix-art-shine" aria-hidden />
          <div className="community-mix-art-meta">
            <span>#{String(index + 1).padStart(3, "0")}</span>
            <span className="community-mix-bpm">{pseudoBpm(mix.id)} BPM</span>
          </div>
          <div className="community-mix-vinyl" aria-hidden />
          <span className="community-mix-duration">{pseudoDuration(mix.id)}</span>
        </div>
      </button>

      <div className="community-mix-body">
        <span className="community-mix-genre">
          {GENRE_LABELS[index % GENRE_LABELS.length]}
        </span>
        <h3 className="community-mix-title">
          <button type="button" className="community-mix-title-btn" onClick={onOpen}>
            {mix.title}
          </button>
        </h3>
        <div className="community-mix-footer">
          <Link to={`/dj/${mix.dj.handle}`} className="community-mix-handle">
            @{mix.dj.handle}
            {mix.dj.verified ? " ✓" : ""}
          </Link>
          {mix.dj.gigRatings && mix.dj.gigRatings.ratingCount > 0 && (
            <span className="community-mix-rating" title="Crowd gig rating">
              ★ {mix.dj.gigRatings.averageScore.toFixed(1)} · {mix.dj.gigRatings.ratingCount} set
              {mix.dj.gigRatings.ratingCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="community-mix-plays">
            <span className="community-mix-plays-dot" aria-hidden />
            {likes.toLocaleString()}
          </span>
        </div>
        <div className="community-mix-actions">
          <button
            type="button"
            className={mix.likedByMe ? "is-active" : ""}
            onClick={onLike}
            title={signedIn ? undefined : "Sign in to like"}
          >
            ♥ {mix.likeCount ?? 0}
          </button>
          <button type="button" onClick={onComment} title={signedIn ? undefined : "Sign in to comment"}>
            💬 {mix.commentCount ?? 0}
          </button>
          <button
            type="button"
            className={mix.savedByMe ? "is-active" : ""}
            onClick={onSave}
            title={signedIn ? undefined : "Sign in to save"}
          >
            {mix.savedByMe ? "Saved" : "Save"}
          </button>
          <button type="button" className="btn-listen" onClick={onOpen}>
            Listen
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyFollowing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="community-empty">
      <div className="community-empty-ring" aria-hidden>
        <span className="community-empty-dot" />
      </div>
      <h2>Nothing here yet.</h2>
      <p>
        {signedIn
          ? "Follow DJs from their profiles to fill your personal feed."
          : "Sign in and start following DJs to fill your personal feed."}
      </p>
      {!signedIn && (
        <Link to="/login" className="community-empty-cta">
          Sign in →
        </Link>
      )}
    </div>
  );
}

export default function CommunityFeed() {
  const { signedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [followBanner, setFollowBanner] = useState<string | null>(
    () => (location.state as { message?: string } | null)?.message ?? null,
  );
  useEffect(() => {
    if (!followBanner) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [followBanner, location.pathname, navigate]);

  const [tab, setTab] = useState<FeedTab>("popular");
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("All");
  const [mixes, setMixes] = useState<FeedMix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateAction, setGateAction] = useState<string | null>(null);
  const [commentMix, setCommentMix] = useState<FeedMix | null>(null);
  const [topRated, setTopRated] = useState<TopRatedDj[]>([]);

  useEffect(() => {
    void fetchTopRatedDjs(6)
      .then((d) => setTopRated(d.djs))
      .catch(() => setTopRated([]));
  }, []);

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

  const filteredMixes = useMemo(() => {
    if (genre === "All") return mixes;
    const g = genre.toLowerCase();
    return mixes.filter(
      (m) =>
        m.title.toLowerCase().includes(g) ||
        (m.description ?? "").toLowerCase().includes(g),
    );
  }, [mixes, genre]);

  const liveStat =
    loading && tab === "popular" ? "—" : formatStatCount(mixes.length || 0);

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

  const showFollowingEmpty =
    tab === "following" && !loading && (!signedIn || filteredMixes.length === 0);

  return (
    <CommunityLayout>
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

      {followBanner && (
        <p className="community-follow-banner" role="status">
          {followBanner}{" "}
          <button type="button" className="btn-link-nav" onClick={() => setFollowBanner(null)}>
            Dismiss
          </button>
        </p>
      )}

      <section className="community-hero">
        <p className="community-hero-kicker">
          <span className="mkt-display-kicker-dot" aria-hidden />
          // Community · live
        </p>
        <div className="community-hero-grid">
          <h1 className="community-hero-title" aria-label="Mix feed">
            <span className="community-hero-line">Mix</span>
            <span className="community-hero-line community-hero-line--gradient">feed.</span>
          </h1>
          <aside className="community-hero-aside">
            <div className="community-stat-row">
              <span className="community-stat-value">{liveStat}</span>
              <span className="community-stat-label">live mixes</span>
            </div>
            <p className="community-hero-note">
              <strong>Popular</strong> is open to everyone. To like, comment, save, and follow
              you&apos;ll need an account.
            </p>
          </aside>
        </div>
      </section>

      {topRated.length > 0 && (
        <section className="community-top-rated" aria-label="Top rated DJs">
          <p className="community-top-rated-kicker">// Top rated · crowd gigs</p>
          <ul className="community-top-rated-list">
            {topRated.map((dj) => (
              <li key={dj.handle}>
                <Link to={`/dj/${dj.handle}`} className="community-top-rated-card">
                  <strong>@{dj.handle}</strong>
                  <span>
                    ★ {dj.gigRatings.averageScore.toFixed(1)} · {dj.gigRatings.ratingCount} set
                    {dj.gigRatings.ratingCount !== 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="community-toolbar-section">
        <div className="community-toolbar">
          <div className="community-feed-toggle" role="tablist" aria-label="Feed">
            {(["popular", "following"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "is-active" : ""}
                onClick={() => (t === "following" ? setTab("following") : setTab("popular"))}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="community-genre-filters" aria-label="Genre">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={genre === g ? "is-active" : ""}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="community-feed-section">
        {loading && <p className="community-status muted">Loading…</p>}
        {error && <p className="community-status error">{error}</p>}

        {showFollowingEmpty ? (
          <EmptyFollowing signedIn={signedIn} />
        ) : (
          <div className="community-mix-matrix">
            {filteredMixes.map((m, i) => (
              <MixCard
                key={m.id}
                mix={m}
                index={i}
                signedIn={signedIn}
                onOpen={() => openMix(m)}
                onLike={() => requireAuth("like mixes", () => void toggleLike(m))}
                onComment={() =>
                  requireAuth("comment on mixes", () => setCommentMix(m))
                }
                onSave={() => requireAuth("save mixes", () => void toggleSave(m))}
              />
            ))}
          </div>
        )}

        {!loading &&
          !showFollowingEmpty &&
          tab === "popular" &&
          filteredMixes.length === 0 && (
            <p className="community-status muted">
              No public mixes yet. Sign in and add one in Studio.
            </p>
          )}
      </section>
    </CommunityLayout>
  );
}
