import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { supabase, supabaseConfigured } from "../lib/supabase";
import "../community.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSendEmail(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="community-page">
        <CommunityNav />
        <main className="community-main auth-form-wrap">
          <p className="error">Password reset requires Supabase. Check your root <code>.env</code>.</p>
          <Link to="/login">Back to sign in</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main auth-form-wrap">
        <h1>Reset password</h1>

        {sent ? (
          <>
            <p className="muted">
              If <strong>{email}</strong> has an account, we sent a reset link. Open it on this
              device to choose a new password.
            </p>
            <p className="muted small">
              Didn&apos;t get it? Check spam, or try again in a minute.
            </p>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: "1rem" }}
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <p className="muted">We&apos;ll email you a link to reset your password.</p>
            <form className="auth-form" onSubmit={onSendEmail}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="muted switch-auth">
          <Link to="/login">Back to sign in</Link>
        </p>
      </main>
    </div>
  );
}
