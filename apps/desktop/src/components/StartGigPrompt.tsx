interface StartGigPromptProps {
  open: boolean;
  onClose: () => void;
  onStartGig: () => void;
  busy: boolean;
  liveCode?: string;
}

export default function StartGigPrompt({
  open,
  onClose,
  onStartGig,
  busy,
  liveCode,
}: StartGigPromptProps) {
  if (!open) return null;

  return (
    <div className="welcome-tour-backdrop" role="dialog" aria-modal="true">
      <div className="welcome-tour-card">
        {liveCode ? (
          <>
            <p className="welcome-tour-kicker">Already live</p>
            <h2>Gig session active</h2>
            <p className="muted">
              Code <strong>{liveCode}</strong> — print your QR sticker or share the crowd link.
              Requests appear on the right; tap Accept or Decline without leaving the deck.
            </p>
            <div className="welcome-tour-actions">
              <button type="button" className="btn primary" onClick={onClose}>
                Got it
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="welcome-tour-kicker">From Q web</p>
            <h2>Start tonight&apos;s gig</h2>
            <p className="muted">
              Creates your session and QR for crowd requests. You need internet once — after
              that, accept and decline work offline until you sync.
            </p>
            <div className="welcome-tour-actions">
              <button type="button" className="btn ghost" onClick={onClose}>
                Not yet
              </button>
              <button type="button" className="btn primary" disabled={busy} onClick={onStartGig}>
                {busy ? "Starting…" : "Start gig"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
