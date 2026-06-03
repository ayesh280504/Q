import LibraryProfilePicker from "./LibraryProfilePicker";
import type { LibrarySource } from "../lib/libraryProfile";

interface StartGigPromptProps {
  open: boolean;
  onClose: () => void;
  onStartGig: () => void;
  busy: boolean;
  liveCode?: string;
  /** Current library source choice — null means the DJ hasn't picked yet. */
  librarySource: LibrarySource | null;
  /** Persist + apply the DJ's library source pick. */
  onLibrarySourceChange: (source: LibrarySource) => void;
}

export default function StartGigPrompt({
  open,
  onClose,
  onStartGig,
  busy,
  liveCode,
  librarySource,
  onLibrarySourceChange,
}: StartGigPromptProps) {
  if (!open) return null;

  // Require an explicit library-source pick on the very first gig. Returning
  // DJs already have a saved profile (the picker still shows so they can
  // confirm or change it, but Start is enabled by default).
  const canStart = !busy && (librarySource != null);

  return (
    <div className="welcome-tour-backdrop" role="dialog" aria-modal="true">
      <div className="welcome-tour-card">
        {liveCode ? (
          <>
            <p className="welcome-tour-kicker">// Already live</p>
            <h2>Gig session active</h2>
            <p className="muted">
              Code <strong>{liveCode}</strong> — print your QR sticker or share the crowd link.
              Requests appear on the right; tap Accept or Decline without leaving the deck.
            </p>
            <div className="welcome-tour-actions">
              <button type="button" className="btn primary" onClick={onClose}>
                Got it →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="welcome-tour-kicker">// Start gig</p>
            <h2>Start tonight&apos;s gig</h2>
            <p className="muted">
              Creates your session and QR for crowd requests. You need internet once — after
              that, accept and decline work offline until you sync.
            </p>
            <LibraryProfilePicker value={librarySource} onChange={onLibrarySourceChange} />
            <div className="welcome-tour-actions">
              <button type="button" className="btn ghost" onClick={onClose}>
                Not yet
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!canStart}
                onClick={onStartGig}
                title={librarySource == null ? "Pick a library profile to continue" : undefined}
              >
                {busy ? "Starting…" : "Start gig →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
