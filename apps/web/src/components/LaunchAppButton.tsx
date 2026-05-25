import { useState } from "react";
import { Q_APP_OPEN_URL, Q_APP_START_GIG_URL } from "../lib/appLaunch";

interface LaunchAppButtonProps {
  className?: string;
  label?: string;
  /** `start-gig` opens booth and shows the Start gig prompt */
  intent?: "open" | "start-gig";
}

/**
 * Opens the installed Q booth app via qdj:// (after installer registers the protocol).
 * Browsers may prompt “Open Q?” — that is expected.
 */
export default function LaunchAppButton({
  className = "btn primary",
  label = "Open Q booth app",
  intent = "open",
}: LaunchAppButtonProps) {
  const [hint, setHint] = useState(false);
  const launchUrl = intent === "start-gig" ? Q_APP_START_GIG_URL : Q_APP_OPEN_URL;

  function onLaunch() {
    setHint(false);
    window.location.href = launchUrl;
    window.setTimeout(() => setHint(true), 1200);
  }

  return (
    <div className="launch-app-wrap">
      <button type="button" className={className} onClick={onLaunch}>
        {label}
      </button>
      {hint && (
        <p className="muted small launch-app-hint">
          Nothing opened? Install Q from{" "}
          <a href="/download">Download</a> first, or open Q from your Start menu / Applications.
          The launch link works after the desktop app is installed.
        </p>
      )}
    </div>
  );
}
