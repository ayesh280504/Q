import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

/** Approximate popover height with all reasons + title + skip — used for flip math. */
const POPOVER_FALLBACK_HEIGHT = 320;
const POPOVER_VIEWPORT_MARGIN = 8;

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

interface PopoverPosition {
  top: number;
  left: number;
  maxHeight: number;
  openUpward: boolean;
}

/**
 * "X with a reason" popover. The anchor button is the existing decline button —
 * clicking it opens a tiny menu of canned reasons that show up on the
 * requester's phone. Clicking outside or pressing Escape closes the menu
 * without declining.
 *
 * Positioning notes: we measure the anchor's bounding rect in the viewport
 * and flip the popover up or down based on available space. Using
 * `position: fixed` lets the menu escape the parent's overflow / panel
 * boundaries, which matters because in mini-overlay mode the dock is short
 * and a downward popover would otherwise be clipped at the bottom of the
 * window — that was the "dropdown goes up and gets cut off" bug DJs hit.
 */
export default function DeclineMenu({
  label = "Decline",
  buttonContent = "✕",
  buttonClassName = "",
  disabled,
  onDecline,
}: DeclineMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Recompute popover position based on current button rect + viewport.
  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const spaceBelow = viewportH - rect.bottom - POPOVER_VIEWPORT_MARGIN;
    const spaceAbove = rect.top - POPOVER_VIEWPORT_MARGIN;
    // Pick the larger side. Bias toward downward when both are roughly equal
    // so quick-tap behavior feels predictable.
    const openUpward = spaceBelow < POPOVER_FALLBACK_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(POPOVER_FALLBACK_HEIGHT, openUpward ? spaceAbove : spaceBelow));

    setPos({
      top: openUpward ? rect.top - POPOVER_VIEWPORT_MARGIN : rect.bottom + POPOVER_VIEWPORT_MARGIN,
      // Anchor the popover's right edge to the button's right edge. Keep it
      // inside the viewport horizontally too (small overlay windows).
      left: Math.min(rect.right, viewportW - POPOVER_VIEWPORT_MARGIN),
      maxHeight,
      openUpward,
    });
  };

  // Initial position when we open.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  // Re-position on scroll / resize while open so the menu doesn't detach
  // visually from its anchor when the dock scrolls.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Click-away / Esc to close.
  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
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
    <div className="decline-menu">
      <button
        ref={buttonRef}
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
      {open && pos && (
        <div
          ref={popoverRef}
          className="decline-menu-popover"
          role="menu"
          style={{
            position: "fixed",
            top: pos.openUpward ? "auto" : pos.top,
            bottom: pos.openUpward ? window.innerHeight - pos.top : "auto",
            left: "auto",
            right: window.innerWidth - pos.left,
            maxHeight: pos.maxHeight,
          }}
        >
          <p className="decline-menu-title">Tell them why</p>
          <ul className="decline-menu-list">
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
