import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QLogo from "../components/QLogo";
import { fetchMe, saveAccountToken, syncProfile } from "../lib/accountApi";
import { clearPendingSignup, loadPendingSignup } from "../lib/authPending";
import { supabase } from "../lib/supabase";

/** OAuth or email-confirmation link return. */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }

    async function finish() {
      const pending = loadPendingSignup();
      try {
        await fetchMe();
        clearPendingSignup();
        navigate("/studio", { replace: true });
      } catch {
        if (pending?.handle) {
          const res = await syncProfile({
            handle: pending.handle,
            displayName: pending.displayName || pending.handle,
          });
          saveAccountToken(res.accountToken);
          clearPendingSignup();
          navigate("/studio?onboard=1", { replace: true });
        } else {
          navigate("/welcome", { replace: true });
        }
      }
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setError("Sign-in did not complete. Try again from the login page.");
        return;
      }
      await finish();
    });
  }, [navigate]);

  return (
    <div className="community-page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <QLogo size={56} />
      {error ? (
        <p className="error" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      ) : (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Finishing sign-in…
        </p>
      )}
    </div>
  );
}
