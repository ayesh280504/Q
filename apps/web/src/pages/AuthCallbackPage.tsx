import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QLogo from "../components/QLogo";
import { fetchMe } from "../lib/accountApi";
import { supabase } from "../lib/supabase";

/** OAuth return — session is read from URL hash/code by the Supabase client. */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setError("Sign-in did not complete. Try again from the login page.");
        return;
      }
      try {
        await fetchMe();
        navigate("/studio", { replace: true });
      } catch {
        navigate("/welcome", { replace: true });
      }
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
