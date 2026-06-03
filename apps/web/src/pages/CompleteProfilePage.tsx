import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { hasCompletedWebOnboarding } from "../components/WebOnboardingTour";
import { useAuth } from "../context/AuthContext";
import { fetchMe, saveAccountToken, syncProfile } from "../lib/accountApi";
import { consumeReturnToDesktop } from "../lib/returnToDesktop";
import { supabase } from "../lib/supabase";
import "../community.css";

/** First-time Supabase sign-in: pick a public username before using studio. */
export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { supabaseSession, profileLoading, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseSession) {
      navigate("/login", { replace: true });
      return;
    }
    if (profileLoading) return;
    if (profile?.handle) {
      navigate("/studio", { replace: true });
      return;
    }
    if (username) return;
    const suggested =
      supabaseSession.user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ??
      "";
    if (suggested.length >= 3) setUsername(suggested.slice(0, 24));
  }, [supabaseSession, profileLoading, profile, navigate, username]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setBusy(true);
    try {
      const meta = supabaseSession?.user.user_metadata as { avatar_url?: string };
      const res = await syncProfile({
        handle: username.trim(),
        avatarUrl: meta?.avatar_url,
      });
      saveAccountToken(res.accountToken);
      await refreshProfile();
      if (await consumeReturnToDesktop({ handle: username.trim() })) return;
      const tour = !hasCompletedWebOnboarding();
      navigate(tour ? "/studio?onboard=1" : "/studio", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setBusy(false);
    }
  }

  if (profileLoading) {
    return (
      <AppShell narrow footer={false}>
        <p className="muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell narrow mainClassName="auth-form-wrap">
        <h1 className="q-title">Finish your profile</h1>
        <p className="muted">
          Choose a username for your public page and permanent booth QR (
          <code>/dj/your-username</code>). This is how others find and @mention you.
        </p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Username (e.g. dj_ayesh)
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              pattern="[a-z][a-z0-9_]{2,23}"
              title="3–24 chars, lowercase letters, numbers, underscore"
              autoComplete="username"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "…" : "Continue to studio"}
          </button>
        </form>
    </AppShell>
  );
}
