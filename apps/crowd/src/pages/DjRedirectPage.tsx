import { useEffect, useState } from "react";
import QLogo from "../components/QLogo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

/** Permanent link: /dj/:handle → latest gig crowd page */
export default function DjRedirectPage() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    api<{ code: string }>(`/djs/${encodeURIComponent(handle)}/active-gig`)
      .then((d) => navigate(`/r/${d.code}`, { replace: true }))
      .catch(() =>
        setError("This DJ isn't live right now. Ask them to start a gig in the Q app."),
      );
  }, [handle, navigate]);

  return (
    <div className="app">
      <QLogo size={48} className="brand-mark" />
      {error ? <p className="sub">{error}</p> : <p className="sub">Finding tonight&apos;s gig…</p>}
    </div>
  );
}
