import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "q-web-onboarding-v1";

const STEPS = [
  {
    title: "Welcome to Q Community",
    body: "This is your home on the web — separate from the booth app you use while DJing.",
  },
  {
    title: "Your studio",
    body: "Add mix links (SoundCloud, Mixcloud, etc.), edit your bio, and control what appears on your public profile.",
  },
  {
    title: "Mix feed",
    body: "Public mixes from DJs appear on the community feed. Verified artists get a badge (manual for now).",
  },
  {
    title: "Booth + permanent QR",
    body: "In the desktop app, sign in with the same account. Your handle powers a print-once QR that always points to tonight's gig.",
  },
];

interface WebOnboardingTourProps {
  /** Force show (e.g. ?onboard=1 after profile setup) */
  force?: boolean;
  onDone?: () => void;
}

export function hasCompletedWebOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWebOnboardingDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function WebOnboardingTour({ force, onDone }: WebOnboardingTourProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (force || !hasCompletedWebOnboarding()) setOpen(true);
  }, [force]);

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function finish() {
    markWebOnboardingDone();
    setOpen(false);
    onDone?.();
  }

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboarding-card">
        <p className="onboarding-kicker">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 id="onboard-title">{current.title}</h2>
        <p className="muted">{current.body}</p>
        <div className="onboarding-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (step === 0) finish();
              else setStep((s) => s - 1);
            }}
          >
            {step === 0 ? "Skip tour" : "Back"}
          </button>
          {isLast ? (
            <button type="button" className="btn primary" onClick={finish}>
              Get started
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          )}
        </div>
        {isLast && (
          <p className="muted small" style={{ marginTop: "1rem" }}>
            <Link to="/community">Browse the feed</Link> · <Link to="/#download">Download booth app</Link>
          </p>
        )}
      </div>
    </div>
  );
}
