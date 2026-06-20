import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { crowdBoothUrl } from "../lib/boothUrl";

type Props = {
  sessionCode: string;
  displayName: string;
};

/** Connected guest shares the same booth QR / link with friends nearby. */
export default function ShareBooth({ sessionCode, displayName }: Props) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const url = crowdBoothUrl(sessionCode);
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  async function copyLink() {
    setShareError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Could not copy — select the link and copy manually.");
    }
  }

  async function shareLink() {
    setShareError(null);
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: `${displayName} — Q booth`,
        text: `Request a track at ${displayName}'s set`,
        url,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyLink();
    }
  }

  return (
    <section className="share-booth" aria-labelledby="share-booth-heading">
      <div className="share-booth-row">
        <div className="share-booth-copy">
          <h2 id="share-booth-heading" className="share-booth-title">
            Spread the gig
          </h2>
          <p className="share-booth-lead">
            Friend too far from the DJ laptop? Show them this booth.
          </p>
        </div>
        <button
          type="button"
          className={`share-booth-qr-toggle${showQr ? " share-booth-qr-toggle--open" : ""}`}
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          aria-label={showQr ? "Hide QR code" : "Show QR code for a friend to scan"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="14" y="14" width="3" height="3" fill="currentColor" />
            <rect x="18" y="14" width="3" height="3" fill="currentColor" />
            <rect x="14" y="18" width="3" height="3" fill="currentColor" />
            <rect x="18" y="18" width="3" height="3" fill="currentColor" />
          </svg>
        </button>
      </div>

      {showQr && (
        <div className="share-booth-qr-panel">
          <p className="share-booth-qr-hint">Have them scan with their phone camera — no app required.</p>
          <div className="share-booth-qr-card">
            <QRCodeSVG value={url} size={200} level="H" bgColor="#ffffff" fgColor="#0a0a0f" marginSize={2} />
            <p className="share-booth-qr-code">{sessionCode}</p>
          </div>
          <div className="share-booth-actions">
            {canNativeShare && (
              <button type="button" className="btn primary share-booth-btn" onClick={() => void shareLink()}>
                Share link
              </button>
            )}
            <button type="button" className="btn ghost share-booth-btn" onClick={() => void copyLink()}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      {shareError && <p className="share-booth-error">{shareError}</p>}
    </section>
  );
}
