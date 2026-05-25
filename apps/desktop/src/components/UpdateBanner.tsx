import { useState } from "react";
import type { AvailableUpdate } from "../lib/updater";

interface UpdateBannerProps {
  update: AvailableUpdate;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
  onSkip: () => void;
}

export default function UpdateBanner({
  update,
  onInstall,
  onDismiss,
  onSkip,
}: UpdateBannerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInstall() {
    setBusy(true);
    setError(null);
    try {
      await onInstall();
      // The app will relaunch — no further UI needed.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      setBusy(false);
    }
  }

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <div className="update-banner-body">
        <strong className="update-banner-title">
          Q {update.version} is available
        </strong>
        {update.notes && (
          <p className="update-banner-notes">{shortNotes(update.notes)}</p>
        )}
        {error && <p className="update-banner-error">{error}</p>}
      </div>
      <div className="update-banner-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleInstall()}
          disabled={busy}
        >
          {busy ? "Installing…" : "Install & restart"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={onDismiss}
          disabled={busy}
        >
          Later
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={onSkip}
          disabled={busy}
          title={`Skip ${update.version}`}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function shortNotes(raw: string): string {
  const trimmed = raw.replace(/\r\n/g, "\n").trim();
  if (trimmed.length <= 220) return trimmed;
  return trimmed.slice(0, 200).trimEnd() + "…";
}
