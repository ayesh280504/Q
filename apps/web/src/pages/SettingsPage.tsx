import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { getAccountToken, updateProfile } from "../lib/accountApi";
import {
  hasSocialLinks,
  loadProfileSettingsDraft,
  saveProfileSettingsDraft,
  shouldRestoreDraftFromLocal,
} from "../lib/profileSettingsStorage";
import type { DjSocialLinks } from "@q/shared";
import "../community.css";
import "../studio.css";

const SOCIAL_FIELDS: Array<{ key: keyof DjSocialLinks; label: string; placeholder: string }> =
  [
    { key: "instagram", label: "Instagram", placeholder: "@yourhandle or full URL" },
    { key: "twitter", label: "X (Twitter)", placeholder: "@yourhandle or full URL" },
    { key: "soundcloud", label: "SoundCloud", placeholder: "Profile URL or username" },
    { key: "spotify", label: "Spotify", placeholder: "Artist/user URL or username" },
    { key: "tiktok", label: "TikTok", placeholder: "@yourhandle or full URL" },
    { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  ];

function hydrateFromProfile(profile: {
  bio?: string;
  socialLinks?: DjSocialLinks;
  tipUrl?: string;
}) {
  return {
    bio: profile.bio ?? "",
    social: profile.socialLinks ?? {},
    tipUrl: profile.tipUrl ?? "",
  };
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { loading, profileLoading, profile, refreshProfile, supabaseSession } = useAuth();
  const [bio, setBio] = useState("");
  const [social, setSocial] = useState<DjSocialLinks>({});
  const [tipUrl, setTipUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [restoredNote, setRestoredNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hydratedForRef = useRef<string | null>(null);
  const autoRestoreAttemptedRef = useRef<string | null>(null);

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

    if (hydratedForRef.current === profile.id) return;
    hydratedForRef.current = profile.id;

    let next = hydrateFromProfile(profile);
    const draft = loadProfileSettingsDraft(profile.id);
    if (draft && shouldRestoreDraftFromLocal(profile, draft)) {
      next = {
        bio: draft.bio || next.bio,
        social: { ...next.social, ...draft.social },
        tipUrl: draft.tipUrl || next.tipUrl,
      };
      setRestoredNote(true);

      if (autoRestoreAttemptedRef.current !== profile.id) {
        autoRestoreAttemptedRef.current = profile.id;
        void updateProfile({
          bio: next.bio.trim() || undefined,
          socialLinks: next.social,
          tipUrl: next.tipUrl.trim() || undefined,
        })
          .then(({ user }) => {
            saveProfileSettingsDraft(user.id, {
              bio: user.bio ?? "",
              social: user.socialLinks ?? {},
              tipUrl: user.tipUrl ?? "",
              savedAt: new Date().toISOString(),
            });
            void refreshProfile();
          })
          .catch(() => {
            /* user can tap Save */
          });
      }
    }

    setBio(next.bio);
    setSocial(next.social);
    setTipUrl(next.tipUrl);
  }, [loading, profileLoading, profile, supabaseSession, navigate, refreshProfile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSaved(false);
    setRestoredNote(false);
    setBusy(true);
    try {
      const { user } = await updateProfile({
        bio: bio.trim() || undefined,
        socialLinks: social,
        tipUrl: tipUrl.trim() || undefined,
      });
      saveProfileSettingsDraft(user.id, {
        bio: user.bio ?? "",
        social: user.socialLinks ?? {},
        tipUrl: user.tipUrl ?? "",
        savedAt: new Date().toISOString(),
      });
      setBio(user.bio ?? "");
      setSocial(user.socialLinks ?? {});
      setTipUrl(user.tipUrl ?? "");
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  if (loading || profileLoading || !profile) {
    return (
      <AppShell className="studio-page" footer={false}>
        <p className="muted">Loading settings…</p>
      </AppShell>
    );
  }

  const hasSavedSocials = hasSocialLinks(profile.socialLinks) || Boolean(profile.tipUrl?.trim());

  return (
    <AppShell className="studio-page">
        <header className="studio-hero">
          <p className="studio-hero-kicker">// Account</p>
          <h1 className="q-title">Settings</h1>
          <p className="muted">
            Edit what fans see on your{" "}
            <Link to={`/dj/${profile.handle}`}>public profile</Link>. Mixes are managed in{" "}
            <Link to="/studio">My studio</Link>.
          </p>
          {supabaseSession?.user.email ? (
            <p className="muted small">
              Signed in as <strong>{supabaseSession.user.email}</strong>
              {hasSavedSocials ? " · socials saved to your Q profile" : ""}
            </p>
          ) : null}
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
            <p className="muted small">
              Shown on your public profile and after gigs when the set ends. These stay on your
              account until you change them.
            </p>
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

          <section className="settings-section card">
            <h2>Tip link</h2>
            <p className="muted small">
              Stripe Payment Link, PayPal.me, Cash App, Venmo — shown to guests after your set
              ends.
            </p>
            <label>
              Tip URL
              <input
                value={tipUrl}
                onChange={(e) => setTipUrl(e.target.value)}
                placeholder="https://venmo.com/u/you or https://paypal.me/you"
              />
            </label>
          </section>

          {restoredNote && (
            <p className="muted small">
              Restored your last saved links from this browser and synced them to your account.
            </p>
          )}
          {saved && <p className="muted">Settings saved — they&apos;ll be here next time you sign in.</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
    </AppShell>
  );
}
