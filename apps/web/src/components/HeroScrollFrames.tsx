import { useEffect, useRef, useState } from "react";

const FRAME_BASE = "/hero/frames";
const MAX_PROBE = 500;

type Manifest = {
  count: number;
  pad: number;
  frames: string[];
};

type Props = {
  progress: number;
};

function frameUrl(index: number, pad: number) {
  return `${FRAME_BASE}/${String(index).padStart(pad, "0")}.png`;
}

async function loadManifest(): Promise<Manifest | null> {
  try {
    const res = await fetch(`${FRAME_BASE}/manifest.json`);
    if (!res.ok) return null;
    return (await res.json()) as Manifest;
  } catch {
    return null;
  }
}

async function discoverFrames(): Promise<Manifest> {
  const pad = 3;
  const frames: string[] = [];
  for (let i = 0; i < MAX_PROBE; i++) {
    const url = frameUrl(i, pad);
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) break;
    frames.push(url);
  }
  if (frames.length === 0) throw new Error("No frames found");
  return { count: frames.length, pad, frames };
}

function preload(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load ${src}`));
          img.src = src;
        }),
    ),
  );
}

/** Remove flat gray / black Veo export background; keep the deck. */
function keyOutBackground(imageData: ImageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;

    if (lum < 52 && sat < 28) {
      d[i + 3] = 0;
    } else if (lum < 95 && sat < 40) {
      d[i + 3] = Math.round(((lum - 52) / 43) * 255);
    }
  }
}

export default function HeroScrollFrames({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const progressRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reduceMotion, setReduceMotion] = useState(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manifest = (await loadManifest()) ?? (await discoverFrames());
        const loaded = await preload(manifest.frames);
        if (cancelled) return;
        imagesRef.current = loaded;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;

    const ctx = canvas.getContext("2d", { alpha: true });
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
      const images = imagesRef.current;
      if (images.length === 0) return;

      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      const p = reduceMotion ? 0 : progressRef.current;
      const idx = Math.min(
        images.length - 1,
        Math.max(0, Math.round(p * (images.length - 1))),
      );
      const img = images[idx];
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;

      const scale = Math.min((w * 1.52) / iw, (h * 1.52) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (w - dw) / 2 + w * 0.18;
      const dy = (h - dh) / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, dw, dh);

      const keyed = ctx.getImageData(0, 0, canvas.width, canvas.height);
      keyOutBackground(keyed);
      ctx.putImageData(keyed, 0, 0);
    };

    const tick = () => {
      paint();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [status, reduceMotion]);

  if (status === "loading") {
    return <div className="hero-frames-loading" aria-hidden />;
  }

  if (status === "error") {
    return (
      <p className="hero-frames-error">
        Frames missing — run <code>npm run hero:frames</code>
      </p>
    );
  }

  return <canvas ref={canvasRef} className="hero-scroll-canvas" aria-hidden />;
}
