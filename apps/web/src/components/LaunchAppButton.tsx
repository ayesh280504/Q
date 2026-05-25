import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { buildBoothLaunchUrl, type LaunchIntent } from "../lib/launchBooth";

interface LaunchAppButtonProps {
  className?: string;
  label?: string;
  /** `start-gig` opens booth and shows the Start gig prompt */
  intent?: LaunchIntent;
}

/**
 * Opens the installed Q booth app via qdj:// (after installer registers the
 * protocol). If the user is signed in on the web, an auth handoff token is
 * appended so the booth app stays signed in.
 */
export default function LaunchAppButton({
  className = "btn primary",
  label = "Open Q booth app",
  intent = "open",
}: LaunchAppButtonProps) {
  const { profile } = useAuth();
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onLaunch() {
    if (busy) return;
    setHint(false);
    setBusy(true);
    try {
      const url = await buildBoothLaunchUrl(intent, { handle: profile?.handle });
      window.location.href = url;
    } finally {
      setBusy(false);
      window.setTimeout(() => setHint(true), 1200);
    }
  }

  return (
    <div className="launch-app-wrap">
      <button type="button" className={className} onClick={onLaunch} disabled={busy}>
        {busy ? "Opening…" : label}
      </button>
      {hint && (
        <p className="muted small launch-app-hint">
          Nothing opened? Install Q from <a href="/download">Download</a> first, or open Q from
          your Start menu / Applications. The launch link works after the desktop app is
          installed.
        </p>
      )}
    </div>
  );
}
