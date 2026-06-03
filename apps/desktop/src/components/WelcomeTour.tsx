import { useEffect, useState } from "react";

const STORAGE_KEY = "q-desktop-tour-v2";

const STEPS = [
  {
    title: "Welcome to Q Command Center",
    body: "This app runs your booth: QR requests, queue, and library sync. Your mixes and feed live on the website.",
  },
  {
    title: "Start a gig",
    body: "You need internet once to create tonight's session and QR. Sign in first if you want a permanent print-once booth QR.",
  },
  {
    title: "Import & sync",
    body: "Auto-import Rekordbox or Serato, then tap Sync now so the crowd can search your library.",
  },
  {
    title: "Silent requests",
    body: "Crowd requests land here as Accept / Decline — no yelling, no pulling off your headphones mid-transition. Glance at the screen and keep mixing.",
  },
  {
    title: "Queue & mix",
    body: "Accepted tracks go to your queue. Serato auto-detects now playing; on Rekordbox tap Playing when you mix a track.",
  },
  {
    title: "Offline booth",
    body: "Accept and decline work offline. When you have signal, Sync pushes everything to the server.",
  },
  {
    title: "Local-first",
    body: "Your library and mixes never upload to Q. Crowd search uses titles only. Use Booth only mode if you want zero background sync during the set.",
  },
];

export function hasCompletedDesktopTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasCompletedDesktopTour()) setOpen(true);
  }, []);

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function finish() {
    markDone();
    setOpen(false);
  }

  return (
    <div className="welcome-tour-backdrop" role="dialog" aria-modal="true">
      <div className="welcome-tour-card">
        <p className="welcome-tour-kicker">
          // Step {step + 1} · {STEPS.length}
        </p>
        <h2>{current.title}</h2>
        <p className="muted">{current.body}</p>
        <div className="welcome-tour-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (step === 0) finish();
              else setStep((s) => s - 1);
            }}
          >
            {step === 0 ? "Skip" : "Back"}
          </button>
          {isLast ? (
            <button type="button" className="btn primary" onClick={finish}>
              Start DJing →
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setStep((s) => s + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
