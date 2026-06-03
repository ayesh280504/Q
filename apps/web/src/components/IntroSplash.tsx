import { useCallback, useEffect, useRef, useState } from "react";
import "../intro-splash.css";

const INTRO_STORAGE_KEY = "q-intro-v3";
const INTRO_SRC = "/intro/q-intro.mp4?v=nowm";

type Phase = "playing" | "fading" | "hidden";

function shouldSkipIntro(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (sessionStorage.getItem(INTRO_STORAGE_KEY) === "1") return true;
  } catch {
    /* private mode */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  onComplete: () => void;
};

export default function IntroSplash({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("playing");
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setPhase("fading");
    window.setTimeout(() => {
      setPhase("hidden");
      onComplete();
    }, 650);
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay blocked — let user skip or tap to play */
      });
    };

    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("loadeddata", tryPlay, { once: true });

    return () => video.removeEventListener("loadeddata", tryPlay);
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`intro-splash ${phase === "fading" ? "intro-splash--fading" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Q intro"
    >
      <video
        ref={videoRef}
        className="intro-splash-video"
        src={INTRO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
      />
      <button type="button" className="intro-splash-skip" onClick={finish}>
        Skip
      </button>
    </div>
  );
}

export function useIntroSplashEnabled(): boolean {
  const [enabled, setEnabled] = useState(() => !shouldSkipIntro());
  return enabled;
}
