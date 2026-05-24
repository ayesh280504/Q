import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { useAuth } from "../context/AuthContext";
import { getAccountToken, updateProfile } from "../lib/accountApi";
import type { DjSocialLinks } from "@q/shared";
import "../community.css";
import "../studio.css";

const SOCIAL_FIELDS: Array<{ key: keyof DjSocialLinks; label: string; placeholder: string }> =
  [
    { key: "instagram", label: "Instagram", placeholder: "@yourhandle or full URL" },
    { key: "twitter", label: "X (Twitter)", placeholder: "@yourhandle or full URL" },
    { key: "soundcloud", label: "SoundCloud", placeholder: "Profile URL or username" },
    { key: "tiktok", label: "TikTok", placeholder: "@yourhandle or full URL" },
    { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  ];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { loading, profileLoading, profile, refreshProfile, supabaseSession } = useAuth();
  const [bio, setBio] = useState("");
  const [social, setSocial] = useState<DjSocialLinks>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!supabaseSession && !getAccountToken()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!profile) {
      navigate("/welcome", { replace: true });
      return;
    }
    setBio(profile.bio ?? "");
    setSocial(profile.socialLinks ?? {});
  }, [loading, profileLoading, profile, supabaseSession, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateProfile({ bio: bio.trim() || undefined, socialLinks: social });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  if (loading || profileLoading || !profile) {
    return <p className="muted community-page">Loading settings…</p>;
  }

  return (
    <div className="community-page studio-page">
      <CommunityNav />
      <main className="community-main">
        <header className="studio-hero">
          <p className="studio-hero-kicker">Account</p>
          <h1>Settings</h1>
          <p className="muted">
            Edit what fans see on your{" "}
            <Link to={`/dj/${profile.handle}`}>public profile</Link>. Mixes are managed in{" "}
            <Link to="/studio">My studio</Link>.
          </p>
        </header>

        <form className="auth-form settings-form" onSubmit={onSubmit}>
          <section className="settings-section card">
            <h2>Public profile</h2>
            <p className="muted small">
              Username <strong>@{profile.handle}</strong> is fixed (set at signup).
            </p>
            <label>
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell the crowd who you are…"
              />
            </label>
          </section>

          <section className="settings-section card">
            <h2>Social links</h2>
            <p className="muted small">Shown as buttons on your public DJ page.</p>
            {SOCIAL_FIELDS.map((f) => (
              <label key={String(f.key)}>
                {f.label}
                <input
                  value={social[f.key] ?? ""}
                  onChange={(e) =>
                    setSocial((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                />
              </label>
            ))}
          </section>

          {saved && <p className="muted">Settings saved.</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </main>
    </div>
  );
}
