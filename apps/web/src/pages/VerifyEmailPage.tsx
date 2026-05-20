import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { fetchMe, saveAccountToken, syncProfile } from "../lib/accountApi";
import { clearPendingSignup, loadPendingSignup } from "../lib/authPending";
import { supabase } from "../lib/supabase";
import "../community.css";

/** Enter 6-digit code from Supabase confirmation email after sign-up. */
export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const email = search.get("email")?.trim() ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finishProfileSetup() {
    const pending = loadPendingSignup();
    try {
      await fetchMe();
      clearPendingSignup();
      navigate("/studio", { replace: true });
    } catch {
      if (!pending?.handle) {
        navigate("/welcome", { replace: true });
        return;
      }
      const res = await syncProfile({
        handle: pending.handle,
        displayName: pending.displayName || pending.handle,
      });
      saveAccountToken(res.accountToken);
      clearPendingSignup();
      navigate("/studio?onboard=1", { replace: true });
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !email) return;
    const token = code.replace(/\D/g, "").trim();
    if (token.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let verified = false;
      for (const type of ["signup", "email"] as const) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email,
          token,
          type,
        });
        if (!otpError) {
          verified = true;
          break;
        }
      }
      if (!verified) {
        throw new Error("Invalid or expired code. Try again or resend.");
      }
      await finishProfileSetup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!supabase || !email) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) throw resendError;
      setInfo("We sent a new code to your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <div className="community-page">
        <CommunityNav />
        <main className="community-main auth-form-wrap">
          <p className="error">Missing email. Start from <Link to="/register">register</Link>.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main auth-form-wrap">
        <h1>Verify your email</h1>
        <p className="muted">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your
          account.
        </p>

        <form className="auth-form" onSubmit={onVerify}>
          <label>
            Verification code
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
          {info && <p className="muted">{info}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "…" : "Verify & continue"}
          </button>
        </form>

        <p className="muted switch-auth">
          Didn&apos;t get it?{" "}
          <button type="button" className="btn-link-nav" disabled={busy} onClick={() => void onResend()}>
            Resend code
          </button>
        </p>
        <p className="muted switch-auth">
          <Link to="/login">Back to sign in</Link>
        </p>
      </main>
    </div>
  );
}
