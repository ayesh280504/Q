import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { supabase, supabaseConfigured } from "../lib/supabase";
import "../community.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "code">("request");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSendEmail(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      setInfo(
        "If that email exists, we sent a reset email with a 6-digit code (and a link). Enter the code below.",
      );
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const token = code.replace(/\D/g, "").trim();
    if (token.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "recovery",
      });
      if (otpError) throw otpError;
      navigate("/reset-password", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
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

        {step === "request" && (
          <>
            <p className="muted">We&apos;ll email you a code and a reset link.</p>
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
                {busy ? "…" : "Send reset email"}
              </button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <p className="muted">{info}</p>
            <form className="auth-form" onSubmit={onVerifyCode}>
              <label>
                Reset code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={8}
                  required
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "…" : "Verify code"}
              </button>
            </form>
            <p className="muted small">
              Or open the link in the same email — it will take you straight to set a new password.
            </p>
          </>
        )}

        <p className="muted switch-auth">
          <Link to="/login">Back to sign in</Link>
        </p>
      </main>
    </div>
  );
}
