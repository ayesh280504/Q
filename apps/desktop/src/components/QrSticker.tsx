import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import QLogo from "./QLogo";
import { exportStickerPng, printSticker } from "../lib/qr-sticker";

interface QrStickerProps {
  crowdUrl: string;
  phoneCrowdUrl: string;
  sessionCode: string;
  displayName: string;
  showLanHint?: boolean;
  /** QR still points at localhost — phones cannot open it */
  localhostQrWarning?: boolean;
  compact?: boolean;
  /** Full Command Center hero + white sticker card */
  variant?: "default" | "command";
  disabled?: boolean;
}

export default function QrSticker({
  phoneCrowdUrl,
  sessionCode,
  displayName,
  showLanHint,
  localhostQrWarning,
  compact,
  variant = "default",
  disabled,
}: QrStickerProps) {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const centerLabel =
    displayName.length > 14 ? `${displayName.slice(0, 13)}…` : displayName;
  const qrSize = compact ? 160 : 220;

  async function savePng() {
    if (!stickerRef.current) return;
    await exportStickerPng(stickerRef.current, `q-sticker-${sessionCode}.png`);
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(phoneCrowdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const isCommand = variant === "command" && !compact;

  return (
    <section
      className={`sticker-section ${compact ? "sticker-section-compact" : ""} ${isCommand ? "sticker-section--command" : ""}`}
    >
      {isCommand && (
        <div className="sticker-command-hero">
          <p className="sticker-command-kicker">
            <span className="command-live-dot" aria-hidden />
            // QR Sticker
          </p>
          <h1 className="sticker-command-title">
            Scan the <span className="command-gradient-text">booth.</span>
          </h1>
          <p className="sticker-command-tagline">Same Wi‑Fi or LTE — no app install.</p>
        </div>
      )}
      {!compact && !isCommand && <h2 className="sticker-heading">QR sticker</h2>}
      {!compact && !isCommand && (
        <p className="muted sticker-hint">
          Scan with your phone camera (same Wi‑Fi as this laptop). No venue Wi‑Fi needed.
        </p>
      )}
      {localhostQrWarning && !compact && (
        <p className="sticker-lan-hint sticker-lan-warn">
          This QR uses <strong>localhost</strong> — your phone cannot open it. Set{" "}
          <code>VITE_Q_CROWD_LAN_URL</code> in <code>.env</code> to your laptop&apos;s Wi‑Fi IP
          (run <code>ipconfig</code>), then restart the desktop app.
        </p>
      )}
      {showLanHint && !localhostQrWarning && !compact && (
        <p className="sticker-lan-hint">
          QR uses your LAN address so phones can open the link on the same Wi‑Fi.
        </p>
      )}

      <div className={isCommand ? "sticker-command-glow-wrap" : "sticker-preview"}>
        {isCommand && <div className="sticker-command-glow" aria-hidden />}
        <div
          ref={stickerRef}
          className={`sticker-card ${compact ? "sticker-card-compact" : ""} ${isCommand ? "sticker-card--command" : ""}`}
          id="q-print-sticker"
        >
          {!compact && <QLogo size={44} className="sticker-brand-logo" />}
          {!compact && <p className="sticker-tagline">Scan to request — from your phone</p>}
          <div className="sticker-qr-wrap">
            <QRCodeSVG
              value={phoneCrowdUrl}
              size={qrSize}
              level="H"
              bgColor="#ffffff"
              fgColor="#0a0a0f"
              marginSize={2}
            />
            <div className="sticker-qr-center" aria-hidden>
              <span className="sticker-qr-center-text">{centerLabel}</span>
            </div>
          </div>
          <p className="sticker-scan">
            {compact ? "Scan · same Wi‑Fi" : "Point your phone camera here"}
          </p>
          {isCommand ? (
            <div className="sticker-command-footer">
              <span>{displayName}</span>
              <code>{sessionCode}</code>
            </div>
          ) : (
            <p className="sticker-code">Code: {sessionCode}</p>
          )}
        </div>

        {!compact && !isCommand && (
          <p className="sticker-url" title={phoneCrowdUrl}>
            {phoneCrowdUrl}
          </p>
        )}
      </div>

      {isCommand && (
        <p className="sticker-url sticker-url--command" title={phoneCrowdUrl}>
          {phoneCrowdUrl.replace(/^https?:\/\//, "")}
        </p>
      )}

      <div
        className={`sticker-actions ${compact ? "sticker-actions-compact" : ""} ${isCommand ? "sticker-actions--command" : ""}`}
      >
        <button type="button" className="btn primary" disabled={disabled} onClick={savePng}>
          Save PNG
        </button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => printSticker()}>
          Print
        </button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={copyUrl}>
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </section>
  );
}
