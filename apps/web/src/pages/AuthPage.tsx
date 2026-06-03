import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { supabaseConfigured } from "../context/AuthContext";
import { savePendingSignup } from "../lib/authPending";
import { ensureQProfile } from "../lib/ensureQProfile";
import { login, register, saveAccountToken } from "../lib/accountApi";
import { supabase } from "../lib/supabase";
import {
  consumeReturnToDesktop,
  hasReturnToDesktop,
  markReturnToDesktop,
} from "../lib/returnToDesktop";

const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE === "true";

export default function AuthPage() {
  const location = useLocation();
  const mode = location.pathname === "/register" ? "register" : "login";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loginMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => {
    if (searchParams.get("returnTo") === "desktop") markReturnToDesktop();
  }, [searchParams]);
  const returnToDesktop = hasReturnToDesktop();

  useEffect(() => {
    if (!returnToDesktop) return;
    if (!supabase) return;
    let cancelled = false;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      const result = await ensureQProfile(data.session);
      if (cancelled) return;
      if (result.ok) await consumeReturnToDesktop();
    });
    return () => {
      cancelled = true;
    };
  }, [returnToDesktop]);

  async function afterSupabaseSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const result = await ensureQProfile(data.session);
    if (result.ok) {
      if (await consumeReturnToDesktop()) return;
      navigate(result.showTour ? "/studio?onboard=1" : "/studio", { replace: true });
    } else if (result.reason === "sync-failed") {
      setError(result.message ?? "Could not save username");
    } else {
      navigate("/welcome");
    }
  }

  async function onGoogle() {
    if (!supabase) return;
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const handle = username.trim();
    try {
      if (supabaseConfigured && supabase) {
        if (mode === "register") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { handle: handle.trim() },
            },
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            savePendingSignup({ handle });
            navigate(
              `/verify-email?email=${encodeURIComponent(email.trim())}`,
              { replace: true },
            );
            return;
          }
          await afterSupabaseSession();
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            const msg = signInError.message.toLowerCase();
            if (msg.includes("confirm") || msg.includes("verified")) {
              navigate(
                `/verify-email?email=${encodeURIComponent(email.trim())}`,
                { replace: true },
              );
              return;
            }
            throw signInError;
          }
          await afterSupabaseSession();
        }
        return;
      }

      const res =
        mode === "register"
          ? await register({ email, password, handle })
          : await login(email, password);
      saveAccountToken(res.accountToken);
      if (await consumeReturnToDesktop({ handle: res.user.handle })) return;
      navigate("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      formKicker={mode === "register" ? "// New account" : "// Returning DJ"}
      formTitle={mode === "register" ? ["Sign", "Up."] : ["Sign", "In."]}
    >
      <p className="auth-form-sub">
        {mode === "register"
          ? "Claim your handle. Open your booth."
          : "Access your mix locker and studio."}
      </p>

      {returnToDesktop && (
        <div className="auth-from-desktop-banner">
          <strong>Signing in for the Q booth app.</strong>
          <span>
            {" "}
            When you finish, we&apos;ll send you back to the desktop app.
          </span>
        </div>
      )}

      {!supabaseConfigured && (
        <p className="error small" style={{ marginBottom: "1rem" }}>
          Supabase is not loaded — accounts save only on this laptop. Set{" "}
          <code>VITE_SUPABASE_*</code> in the repo root <code>.env</code> and restart{" "}
          <code>npm run dev:stack</code>.
        </p>
      )}

      <form className="auth-mock-form" onSubmit={onSubmit}>
        {mode === "register" && (
          <label>
            Handle
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required={!supabaseConfigured || mode === "register"}
              pattern="[a-z][a-z0-9_]{2,23}"
              title="3–24 chars, lowercase letters, numbers, underscore"
              autoComplete="username"
              placeholder="dj handle"
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@booth.fm"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </label>
        {loginMessage && mode === "login" && (
          <p className="muted" style={{ margin: "0 0 0.75rem" }}>
            {loginMessage}
          </p>
        )}
        {info && <p className="muted" style={{ margin: "0 0 0.75rem" }}>{info}</p>}
        {error && (
          <p className="error" style={{ margin: "0 0 0.75rem" }}>
            {error}
          </p>
        )}
        <button type="submit" className="auth-submit" disabled={busy}>
          <span>
            {busy
              ? "…"
              : mode === "register"
                ? "Create account →"
                : "Enter booth →"}
          </span>
        </button>
      </form>

      {supabaseConfigured && googleAuthEnabled && (
        <>
          <div className="auth-or" role="presentation">
            <span className="auth-or-line" />
            <span className="auth-or-label">or</span>
            <span className="auth-or-line" />
          </div>
          <button
            type="button"
            className="auth-google"
            disabled={busy}
            onClick={() => void onGoogle()}
          >
            <span className="auth-google-dot" aria-hidden />
            Continue with Google
          </button>
        </>
      )}

      <div className="auth-switch">
        {mode === "register" ? (
          <>
            Already have an account? <Link to="/login">Sign in →</Link>
          </>
        ) : (
          <>
            New here? <Link to="/register">Create account →</Link>
            <br />
            <Link to="/forgot-password" className="auth-switch-muted">
              Forgot password?
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
