import { useState } from "react";
import { Link } from "react-router-dom";
import { Q_APP_START_GIG_URL } from "../lib/appLaunch";

const STEPS = [
  {
    title: "Open Q on your laptop",
    body: "Q Command Center runs beside Rekordbox or Serato — pin it on top so requests stay in view while you mix.",
  },
  {
    title: "Start gig",
    body: "One tap creates tonight's session and your QR sticker. Guests request from their phones — no yelling at the booth.",
  },
  {
    title: "Print QR & go live",
    body: "Save or print the sticker, import your library, Sync once, then Accept or Decline requests on screen. Keep your headphones on.",
  },
];

interface BoothGigModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BoothGigModal({ open, onClose }: BoothGigModalProps) {
  const [step, setStep] = useState(0);
  const [launchHint, setLaunchHint] = useState(false);

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function launchBooth() {
    setLaunchHint(false);
    window.location.href = Q_APP_START_GIG_URL;
    window.setTimeout(() => setLaunchHint(true), 1200);
  }

  function finish() {
    launchBooth();
    onClose();
  }

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-card booth-gig-modal">
        <p className="onboarding-kicker">
          Start your gig · Step {step + 1} of {STEPS.length}
        </p>
        <h2>{current.title}</h2>
        <p className="muted">{current.body}</p>
        <div className="onboarding-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (step === 0) onClose();
              else setStep((s) => s - 1);
            }}
          >
            {step === 0 ? "Not now" : "Back"}
          </button>
          {isLast ? (
            <button type="button" className="btn primary" onClick={finish}>
              Open booth & start gig
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          )}
        </div>
        {isLast && (
          <p className="muted small booth-gig-modal-foot">
            Not installed yet?{" "}
            <a href="#download-platforms" onClick={onClose}>
              Get the app below
            </a>
            {" · "}
            <Link to="/register">Create a DJ account</Link>
          </p>
        )}
        {launchHint && (
          <p className="muted small booth-gig-modal-foot">
            Nothing opened? Install Q first, then click{" "}
            <strong>Open booth & start gig</strong> again.
          </p>
        )}
      </div>
    </div>
  );
}
