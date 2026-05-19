import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { useAuth } from "../context/AuthContext";
import { saveAccountToken, syncProfile } from "../lib/accountApi";
import { supabase } from "../lib/supabase";
import "../community.css";

/** First-time Supabase sign-in: pick a public handle before using studio. */
export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { supabaseSession, refreshProfile } = useAuth();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseSession) {
      navigate("/login", { replace: true });
      return;
    }
    const meta = supabaseSession.user.user_metadata as {
      full_name?: string;
      name?: string;
      avatar_url?: string;
    };
    const name =
      meta.full_name || meta.name || supabaseSession.user.email?.split("@")[0] || "";
    if (name && !displayName) setDisplayName(name);
  }, [supabaseSession, navigate, displayName]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setBusy(true);
    try {
      const meta = supabaseSession?.user.user_metadata as { avatar_url?: string };
      const res = await syncProfile({
        handle,
        displayName: displayName || handle,
        avatarUrl: meta?.avatar_url,
      });
      saveAccountToken(res.accountToken);
      await refreshProfile();
      navigate("/studio?onboard=1", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main auth-form-wrap">
        <h1>Finish your profile</h1>
        <p className="muted">
          Choose a handle for your public page and permanent booth QR (
          <code>/dj/your-handle</code>).
        </p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Handle (e.g. dj_ayesh)
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              pattern="[a-z][a-z0-9_]{2,23}"
              title="3–24 chars, lowercase letters, numbers, underscore"
            />
          </label>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="DJ Ayesh"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "…" : "Continue to studio"}
          </button>
        </form>
      </main>
    </div>
  );
}
