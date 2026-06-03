import { useEffect, useState } from "react";
import CrowdHero from "../components/CrowdHero";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

type BoothStatus = {
  live: boolean;
  handle: string;
  displayName: string;
  code: string | null;
};

/** Permanent link: /dj/:handle → tonight's gig when live */
export default function DjRedirectPage() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "offline" | "error">("loading");
  const [booth, setBooth] = useState<BoothStatus | null>(null);

  useEffect(() => {
    if (!handle) return;
    api<BoothStatus>(`/djs/${encodeURIComponent(handle)}/active-gig`)
      .then((d) => {
        if (d.live && d.code) {
          navigate(`/r/${d.code}`, { replace: true });
          return;
        }
        setBooth(d);
        setStatus("offline");
      })
      .catch(() => setStatus("error"));
  }, [handle, navigate]);

  if (status === "loading") {
    return (
      <div className="app">
        <CrowdHero kicker="// Booth link" title="Finding tonight's gig…">
          <p className="sub">One moment.</p>
        </CrowdHero>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app">
        <CrowdHero kicker="// Booth link" title="Booth not found">
          <p className="sub">
            We couldn&apos;t find <strong>@{handle}</strong>. Double-check the QR or link.
          </p>
        </CrowdHero>
      </div>
    );
  }

  return (
    <div className="app offline-booth">
      <CrowdHero
        kicker={`// @${booth?.handle ?? handle}`}
        title={<>{booth?.displayName ?? handle}</>}
      >
        <p className="sub offline-lead">Not taking requests right now.</p>
        <p className="sub">
          When they start their gig in Q, this same QR unlocks the request page — no need to
          reprint anything.
        </p>
      </CrowdHero>
    </div>
  );
}
