import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { supabaseConfigured } from "../context/AuthContext";
import { savePendingSignup } from "../lib/authPending";
import { fetchMe, login, register, saveAccountToken, syncProfile } from "../lib/accountApi";
import { supabase } from "../lib/supabase";

const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE === "true";
import "../community.css";

export default function AuthPage() {
  const location = useLocation();
  const mode = location.pathname === "/register" ? "register" : "login";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loginMessage = (location.state as { message?: string } | null)?.message;

  async function afterSupabaseSession(opts?: { handle?: string; displayName?: string }) {
    try {
      await fetchMe();
      navigate("/studio");
    } catch {
      if (opts?.handle) {
        const res = await syncProfile({
          handle: opts.handle,
          displayName: opts.displayName || opts.handle,
        });
        saveAccountToken(res.accountToken);
        navigate("/studio?onboard=1");
      } else {
        navigate("/welcome");
      }
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
    try {
      if (supabaseConfigured && supabase) {
        if (mode === "register") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { handle, display_name: displayName || handle },
            },
          });
          if (signUpError) throw signUpError;
          if (!data.session) {
            savePendingSignup({
              handle: handle.trim(),
              displayName: displayName.trim() || handle.trim(),
            });
            navigate(
              `/verify-email?email=${encodeURIComponent(email.trim())}`,
              { replace: true },
            );
            return;
          }
          await afterSupabaseSession({
            handle: handle.trim(),
            displayName: displayName.trim() || handle.trim(),
          });
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
          ? await register({ email, password, handle, displayName: displayName || handle })
          : await login(email, password);
      saveAccountToken(res.accountToken);
      navigate("/studio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main auth-form-wrap">
        <h1>{mode === "register" ? "Create your DJ account" : "Sign in"}</h1>
        <p className="muted">
          {mode === "register"
            ? "Your handle becomes your public profile URL and permanent booth QR."
            : "Access your mix locker and studio."}
        </p>

        {!supabaseConfigured && (
          <p className="error small">
            Supabase is not loaded — accounts save only on this laptop (not in your Q-DJ
            dashboard). Restart <code>npm run dev:stack</code> after setting{" "}
            <code>VITE_SUPABASE_*</code> in the repo root <code>.env</code>.
          </p>
        )}

        {supabaseConfigured && googleAuthEnabled && (
          <>
            <button
              type="button"
              className="btn google-btn"
              disabled={busy}
              onClick={() => void onGoogle()}
            >
              Continue with Google
            </button>
            <p className="auth-divider muted">or use email</p>
          </>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "register" && (
            <>
              <label>
                Handle (e.g. dj_ayesh)
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required={!supabaseConfigured || mode === "register"}
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
            </>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </label>
          {loginMessage && mode === "login" && <p className="muted">{loginMessage}</p>}
          {info && <p className="muted">{info}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "…" : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="muted switch-auth">
          {mode === "register" ? (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/register">Create account</Link>
              <br />
              <Link to="/forgot-password">Forgot password?</Link>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
