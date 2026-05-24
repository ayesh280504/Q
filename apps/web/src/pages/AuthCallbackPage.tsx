import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QLogo from "../components/QLogo";
import { ensureQProfile } from "../lib/ensureQProfile";
import { supabase } from "../lib/supabase";

/** OAuth or email confirmation link return. */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }

    let done = false;

    async function finish(session: import("@supabase/supabase-js").Session) {
      if (done) return;

      const result = await ensureQProfile(session);
      if (result.ok) {
        done = true;
        navigate(result.showTour ? "/studio?onboard=1" : "/studio", { replace: true });
        return;
      }
      if (result.reason === "no-handle") {
        done = true;
        navigate("/welcome", { replace: true });
        return;
      }
      done = true;
      setError(result.message ?? "Could not save your username. Try again from the login page.");
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")
      ) {
        void finish(session);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void finish(session);
      else {
        window.setTimeout(() => {
          void supabase.auth.getSession().then(({ data: { session: retry } }) => {
            if (retry) void finish(retry);
            else if (!done) {
              setError(
                "Sign-in did not complete. Open the confirmation link again or sign in from the login page.",
              );
            }
          });
        }, 800);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="community-page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <QLogo size={56} />
      {error ? (
        <>
          <p className="error" style={{ marginTop: "1rem" }}>
            {error}
          </p>
          <p className="muted switch-auth" style={{ marginTop: "1rem" }}>
            <Link to="/login">Back to sign in</Link>
            {" · "}
            <Link to="/welcome">Set username</Link>
          </p>
        </>
      ) : (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Finishing sign-in…
        </p>
      )}
    </div>
  );
}
