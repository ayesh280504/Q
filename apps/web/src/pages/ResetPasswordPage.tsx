import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { supabase, supabaseConfigured } from "../lib/supabase";
import "../community.css";

/** Set a new password after opening the reset link from email. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate("/login", { replace: true, state: { message: "Password updated. Sign in." } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="community-page">
        <CommunityNav />
        <main className="community-main auth-form-wrap">
          <p className="error">Supabase is not configured.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main auth-form-wrap">
        <h1>Choose a new password</h1>
        {!ready ? (
          <p className="muted">
            Open the reset link from your email. Request a new one from{" "}
            <Link to="/forgot-password">forgot password</Link> if it expired.
          </p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "…" : "Update password"}
            </button>
          </form>
        )}
        <p className="muted switch-auth">
          <Link to="/login">Back to sign in</Link>
        </p>
      </main>
    </div>
  );
}
