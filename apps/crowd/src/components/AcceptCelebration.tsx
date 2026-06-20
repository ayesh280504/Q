import { useEffect, useMemo, useState } from "react";
import QLogo from "./QLogo";

const CELEBRATION_MESSAGES = [
  "Get jiggin'!",
  "Get groovin'!",
  "You're up!",
  "Let's go!",
  "Time to move!",
  "Feel the beat!",
  "This one's for you!",
  "Turn it up!",
] as const;

const VISIBLE_MS = 3800;
const FADE_MS = 700;

type Props = {
  trackTitle: string;
  onDone: () => void;
};

/** Full-screen moment when the DJ accepts a crowd request. */
export default function AcceptCelebration({ trackTitle, onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const message = useMemo(
    () => CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]!,
    [trackTitle],
  );

  useEffect(() => {
    document.body.classList.add("accept-celebration-open");
    const show = window.setTimeout(() => setPhase("visible"), 50);
    const hide = window.setTimeout(() => setPhase("exit"), VISIBLE_MS);
    const done = window.setTimeout(() => onDone(), VISIBLE_MS + FADE_MS);
    return () => {
      document.body.classList.remove("accept-celebration-open");
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className={`accept-celebration accept-celebration--${phase}`}
      role="status"
      aria-live="polite"
      aria-label={`Your track is on: ${trackTitle}`}
    >
      <div className="accept-celebration-inner">
        <QLogo size={80} className="accept-celebration-logo" />
        <h2 className="accept-celebration-title">Your track is on!</h2>
        <p className="accept-celebration-tagline">{message}</p>
        <p className="accept-celebration-track">&ldquo;{trackTitle}&rdquo;</p>
      </div>
    </div>
  );
}
