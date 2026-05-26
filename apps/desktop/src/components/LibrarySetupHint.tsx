/**
 * Library-setup help banner. Surfaces explicit step-by-step guidance when
 * the DJ's library can't be imported automatically. The two cases we
 * currently teach the DJ to fix:
 *
 *  - `rekordbox-xml-missing` — Rekordbox 6 ships with XML export OFF by
 *    default. Without it, `~/Pioneer/rekordbox/rekordbox.xml` doesn't exist
 *    and there's nothing for Q to read.
 *  - `serato-lite` — Serato Lite doesn't write to `_Serato_/History/Sessions/`
 *    the way Serato DJ Pro does, so live "now playing" can't work.
 */

import { openExternal } from "../lib/openExternal";

export type LibrarySetupKind = "rekordbox-xml-missing" | "serato-lite";

interface LibrarySetupHintProps {
  kind: LibrarySetupKind;
  onPickManually: () => void;
  onDismiss: () => void;
}

export default function LibrarySetupHint({
  kind,
  onPickManually,
  onDismiss,
}: LibrarySetupHintProps) {
  if (kind === "rekordbox-xml-missing") {
    return (
      <div className="setup-hint setup-hint-rekordbox">
        <div className="setup-hint-header">
          <strong>Rekordbox XML export isn't on yet</strong>
          <button type="button" className="setup-hint-close" onClick={onDismiss} aria-label="Dismiss">
            ✕
          </button>
        </div>
        <p className="setup-hint-lead">
          Pioneer ships Rekordbox with XML export <em>off</em>. Q reads a single file Rekordbox
          generates called <code>rekordbox.xml</code> — it's the <em>library index</em>, not your
          music folder. Flip XML export on once and you're set forever:
        </p>
        <ol className="setup-hint-steps">
          <li>Open <strong>Rekordbox</strong>.</li>
          <li>
            Open <strong>Preferences</strong> (<kbd>Ctrl</kbd>+<kbd>,</kbd> on Windows,
            <kbd>⌘</kbd>+<kbd>,</kbd> on Mac).
          </li>
          <li>
            Go to <strong>Advanced → Database</strong>.
          </li>
          <li>
            Check <strong>"Keep rekordbox xml database in sync"</strong> (some versions call it
            <em> "Export collection in rekordbox xml format"</em>).
          </li>
          <li>Save and <strong>restart Rekordbox</strong>.</li>
          <li>Come back here and click <strong>Auto-import Rekordbox</strong> again.</li>
        </ol>
        <p className="setup-hint-lead setup-hint-note">
          <strong>Heads up:</strong> if you use the <em>manual</em> picker, navigate to
          <code> %APPDATA%\Pioneer\rekordbox\rekordbox.xml</code> (Windows) or
          <code> ~/Library/Pioneer/rekordbox/rekordbox.xml</code> (Mac). Don't point at your
          music folder — that just contains audio files, not the index Q needs.
        </p>
        <div className="setup-hint-actions">
          <button type="button" className="btn ghost" onClick={onPickManually}>
            Choose rekordbox.xml manually…
          </button>
          <button
            type="button"
            className="btn ghost setup-hint-link"
            onClick={() => {
              void openExternal(
                "https://rekordbox.com/en/support/faq/faq60/",
              );
            }}
          >
            Pioneer's official guide ↗
          </button>
        </div>
      </div>
    );
  }

  // serato-lite
  return (
    <div className="setup-hint setup-hint-serato">
      <div className="setup-hint-header">
        <strong>Serato Lite detected</strong>
        <button type="button" className="setup-hint-close" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
      <p className="setup-hint-lead">
        Your library imported fine, but Serato Lite doesn't share live track data with apps like Q
        — only Serato DJ Pro writes the History file we read for "now playing".
      </p>
      <p className="setup-hint-lead">
        Everything else works exactly the same: requests, queue, decline reasons, the auto-built
        "Q Requests" crate. Just <strong>tap ▶ on a queue item when you mix it</strong> so the
        crowd's "already played" badges stay accurate.
      </p>
      <div className="setup-hint-actions">
        <button
          type="button"
          className="btn ghost setup-hint-link"
          onClick={() => {
            void openExternal("https://serato.com/dj/pro");
          }}
        >
          Compare Serato Pro vs Lite ↗
        </button>
      </div>
    </div>
  );
}
