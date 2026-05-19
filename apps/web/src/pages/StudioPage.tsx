import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import WebOnboardingTour from "../components/WebOnboardingTour";
import { useAuth } from "../context/AuthContext";
import {
  createMix,
  deleteMix,
  fetchMyMixes,
  getAccountToken,
  updateMix,
  updateProfile,
} from "../lib/accountApi";
import type { DjProfile, Mix } from "@q/shared";
import "../community.css";

export default function StudioPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { loading, profile, refreshProfile, supabaseSession } = useAuth();
  const [user, setUser] = useState<DjProfile | null>(null);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
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
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? "");
    void fetchMyMixes()
      .then((list) => setMixes(list.mixes))
      .catch(() => navigate("/login", { replace: true }));
  }, [loading, profile, supabaseSession, navigate]);

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

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setProfileSaved(false);
    try {
      const { user: updated } = await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      });
      setUser(updated);
      await refreshProfile();
      setProfileSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
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

  if (loading || !user) return <p className="muted community-page">Loading studio…</p>;

  const showOnboarding = search.get("onboard") === "1";

  return (
    <div className="community-page">
      <WebOnboardingTour force={showOnboarding} />
      <CommunityNav />
      <main className="community-main">
        <header className="community-header">
          <h1>My studio</h1>
          <p className="muted">
            Profile: <Link to={`/dj/${user.handle}`}>/dj/{user.handle}</Link>
          </p>
        </header>

        <form className="auth-form" onSubmit={onSaveProfile}>
          <h2>Profile</h2>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
          <label>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Short bio for your public page"
            />
          </label>
          {profileSaved && <p className="muted small">Profile saved.</p>}
          <button type="submit" className="btn ghost">
            Save profile
          </button>
        </form>

        <form className="auth-form mix-form" onSubmit={onAdd}>
          <h2>Add a mix</h2>
          <p className="muted small">
            Paste a link to your set (SoundCloud, Mixcloud, etc.). You keep the files — Q only
            links.
          </p>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Stream URL
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              required
              placeholder="https://soundcloud.com/..."
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
            Show on my public profile &amp; feed
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary">
            Save mix
          </button>
        </form>

        <h2 className="section-label">Your mixes</h2>
        <ul className="mix-feed">
          {mixes.map((m) => (
            <li key={m.id} className="mix-card">
              <h3>{m.title}</h3>
              <p className="muted small">
                {m.isPublic ? "Public" : "Private"} · {m.playCount} plays
              </p>
              <div className="mix-card-actions" style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="btn ghost" onClick={() => togglePublic(m)}>
                  {m.isPublic ? "Make private" : "Make public"}
                </button>
                <button type="button" className="btn ghost" onClick={() => removeMix(m)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
