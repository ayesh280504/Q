import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/hero/cdj-scroll.mp4";
const SMOOTHING = 0.1;
const SEEK_EPSILON = 0.035;

type Props = {
  progress: number;
};

/** Turn near-black pixels transparent so only the controller shows. */
function keyOutDarkBackground(imageData: ImageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 28) {
      d[i + 3] = 0;
    } else if (lum < 72) {
      d[i + 3] = Math.round(((lum - 28) / 44) * 255);
    }
  }
}

export default function HeroScrollVideo({ progress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetProgress = useRef(0);
  const smoothProgress = useRef(0);
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    targetProgress.current = progress;
  }, [progress]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      if (video.readyState < 2) return;
      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const scale = Math.min((w * 1.32) / vw, (h * 1.32) / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (w - dw) / 2 + w * 0.06;
      const dy = (h - dh) / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, dx, dy, dw, dh);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      keyOutDarkBackground(frame);
      ctx.putImageData(frame, 0, 0);
    };

    const tick = () => {
      if (reduceMotion) {
        smoothProgress.current = 0;
        if (Math.abs(video.currentTime) > 0.02) video.currentTime = 0;
      } else {
        smoothProgress.current +=
          (targetProgress.current - smoothProgress.current) * SMOOTHING;

        const duration = video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          const targetTime = smoothProgress.current * duration;
          if (Math.abs(video.currentTime - targetTime) > SEEK_EPSILON) {
            video.currentTime = targetTime;
          }
        }
      }

      if (video.readyState >= 2) paint();

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    video.addEventListener("seeked", paint);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      video.removeEventListener("seeked", paint);
    };
  }, [ready, reduceMotion]);

  return (
  <>
      <video
        ref={videoRef}
        className="hero-scroll-video-source"
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden
        onLoadedMetadata={() => setReady(true)}
      />
      <canvas ref={canvasRef} className="hero-scroll-canvas" aria-hidden />
    </>
  );
}
