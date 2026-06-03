import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabase";
import "../community.css";

/** After signup — user confirms via link in email (not a code). */
export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  const email = search.get("email")?.trim() ?? "";
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onResend() {
    if (!supabase || !email) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (resendError) throw resendError;
      setInfo("We sent a new confirmation link to your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <AppShell narrow mainClassName="auth-form-wrap">
          <p className="error">Missing email. Start from <Link to="/register">register</Link>.</p>
      </AppShell>
    );
  }

  return (
    <AppShell narrow mainClassName="auth-form-wrap">
        <h1 className="q-title">Check your email</h1>
        <p className="muted">
          We sent a confirmation link to <strong>{email}</strong>. Open it on this device to
          activate your account — you&apos;ll land back here and go straight to your studio.
        </p>
        <p className="muted small">
          The link expires after a while. If it doesn&apos;t work, resend below or try signing in
          after you&apos;ve clicked it.
        </p>

        {info && <p className="muted">{info}</p>}
        {error && <p className="error">{error}</p>}

        <p className="muted switch-auth">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            className="btn-link-nav"
            disabled={busy}
            onClick={() => void onResend()}
          >
            Resend confirmation email
          </button>
        </p>
        <p className="muted switch-auth">
          Already confirmed? <Link to="/login">Sign in</Link>
        </p>
    </AppShell>
  );
}
