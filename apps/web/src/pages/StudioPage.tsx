import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import LaunchAppButton from "../components/LaunchAppButton";
import WebOnboardingTour, { hasCompletedWebOnboarding } from "../components/WebOnboardingTour";
import { useAuth } from "../context/AuthContext";
import {
  createMix,
  deleteMix,
  fetchMyMixes,
  getAccountToken,
  updateMix,
} from "../lib/accountApi";
import type { DjProfile, Mix } from "@q/shared";
import "../community.css";
import "../studio.css";

export default function StudioPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const { loading, profileLoading, profile, supabaseSession } = useAuth();
  const [user, setUser] = useState<DjProfile | null>(null);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!supabaseSession && !getAccountToken() && !profile) {
      navigate("/login", { replace: true });
      return;
    }
    if (supabaseSession && !profile) {
      navigate("/welcome", { replace: true });
      return;
    }
    if (!profile) return;
    setUser(profile);
    void fetchMyMixes()
      .then((list) => setMixes(list.mixes))
      .catch(() => navigate("/login", { replace: true }));
  }, [loading, profileLoading, profile, supabaseSession, navigate]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { mix } = await createMix({
        title,
        externalUrl,
        description: description || undefined,
        isPublic,
      });
      setMixes((prev) => [mix, ...prev]);
      setTitle("");
      setExternalUrl("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save mix");
    }
  }

  async function togglePublic(m: Mix) {
    const { mix } = await updateMix(m.id, { isPublic: !m.isPublic });
    setMixes((prev) => prev.map((x) => (x.id === mix.id ? mix : x)));
  }

  async function removeMix(m: Mix) {
    if (!confirm(`Delete “${m.title}”?`)) return;
    await deleteMix(m.id);
    setMixes((prev) => prev.filter((x) => x.id !== m.id));
  }

  function clearOnboardQuery() {
    if (search.get("onboard") === "1") {
      search.delete("onboard");
      setSearch(search, { replace: true });
    }
  }

  if (loading || profileLoading || !user) {
    return <p className="muted community-page">Loading studio…</p>;
  }

  const showOnboarding =
    search.get("onboard") === "1" && !hasCompletedWebOnboarding();
  const publicCount = mixes.filter((m) => m.isPublic).length;

  return (
    <div className="community-page studio-page">
      <WebOnboardingTour force={showOnboarding} onDone={clearOnboardQuery} />
      <CommunityNav />
      <main className="community-main">
        <header className="studio-hero">
          <p className="studio-hero-kicker">DJ workspace</p>
          <h1>Hey, @{user.handle}</h1>
          <p className="muted">
            Your mix locker for the web. Run the booth app on your laptop for gigs, QR, and
            requests.
          </p>
        </header>

        <div className="studio-actions">
          <div className="studio-action-card accent">
            <LaunchAppButton label="Start your gig" intent="start-gig" className="btn primary" />
            <span>Opens Q and starts tonight&apos;s session + QR</span>
          </div>
          <Link to={`/dj/${user.handle}`} className="studio-action-card">
            <strong>View public profile</strong>
            <span>What fans see — mixes, bio, socials</span>
          </Link>
          <Link to="/settings" className="studio-action-card">
            <strong>Settings</strong>
            <span>Bio, Instagram, X, SoundCloud, and more</span>
          </Link>
        </div>

        <div className="studio-mix-panel">
          <h2>Mix locker</h2>
          <p className="muted small" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
            {mixes.length} total · {publicCount} on the public feed
          </p>

          <form className="auth-form" onSubmit={onAdd}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Stream link
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="SoundCloud, Mixcloud, YouTube…"
                required
              />
            </label>
            <label>
              Description (optional)
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Show on community feed
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn primary">
              Add mix
            </button>
          </form>

          <ul className="mix-feed" style={{ marginTop: "1.5rem" }}>
            {mixes.map((m) => (
              <li key={m.id} className="mix-card">
                <h3>{m.title}</h3>
                {m.description && <p className="mix-desc">{m.description}</p>}
                <p className="muted small">
                  {m.isPublic ? "Public" : "Private"} · {m.playCount} plays
                </p>
                <div className="mix-engagement">
                  <button type="button" className="mix-engagement-btn" onClick={() => void togglePublic(m)}>
                    {m.isPublic ? "Make private" : "Publish"}
                  </button>
                  <button type="button" className="mix-engagement-btn" onClick={() => void removeMix(m)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {mixes.length === 0 && (
            <p className="muted" style={{ marginTop: "1rem" }}>
              No mixes yet — add your first link above.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
