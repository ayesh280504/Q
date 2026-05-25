import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DeclineReason } from "@q/shared";
import { DECLINE_REASON_LABELS } from "@q/shared";

/** Reasons in display order. Keep "Other" last so it doesn't crowd quick taps. */
const REASON_ORDER: DeclineReason[] = [
  "vibe",
  "genre",
  "tempo",
  "explicit",
  "duplicate",
  "already_played",
  "not_now",
  "unavailable",
  "other",
];

interface DeclineMenuProps {
  /** Anchor button label / aria-label. */
  label?: string;
  /** Visible content on the anchor button (defaults to "✕"). */
  buttonContent?: ReactNode;
  /** Render extra classes on the anchor button (e.g. overlay-btn overlay-btn-bad). */
  buttonClassName?: string;
  disabled?: boolean;
  /** Called with the picked reason key, or undefined for "decline without giving a reason". */
  onDecline: (reason?: DeclineReason) => void;
}

/**
 * "X with a reason" popover. The anchor button is the existing decline button —
 * clicking it opens a tiny menu of canned reasons that show up on the
 * requester's phone. Clicking outside or pressing Escape closes the menu
 * without declining.
 */
export default function DeclineMenu({
  label = "Decline",
  buttonContent = "✕",
  buttonClassName = "",
  disabled,
  onDecline,
}: DeclineMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function pick(reason?: DeclineReason) {
    setOpen(false);
    onDecline(reason);
  }

  return (
    <div className="decline-menu" ref={containerRef}>
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
      >
        {buttonContent}
      </button>
      {open && (
        <div className="decline-menu-popover" role="menu">
          <p className="decline-menu-title">Tell them why</p>
          <ul>
            {REASON_ORDER.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  className="decline-menu-item"
                  role="menuitem"
                  onClick={() => pick(r)}
                >
                  {DECLINE_REASON_LABELS[r]}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="decline-menu-skip"
            onClick={() => pick(undefined)}
          >
            Decline without a reason
          </button>
        </div>
      )}
    </div>
  );
}
