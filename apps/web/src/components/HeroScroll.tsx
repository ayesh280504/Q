import { useEffect } from "react";
import { Link } from "react-router-dom";

type Props = {
  progress: number;
};

export default function HeroScroll({ progress }: Props) {
  useEffect(() => {
    if (window.location.hash === "#crowd-demo") {
      history.replaceState(null, "", window.location.pathname);
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <section className="hero-scroll" id="top" aria-label="Introduction">
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">
          <span className="hero-eyebrow-full">For DJs · Local-first · Crowd on any network</span>
          <span className="hero-eyebrow-short">Local-first · Crowd on LTE</span>
        </p>
        <h1 className="hero-title font-syne">
          The future of
          <br />
          the booth.
        </h1>
        <p className="hero-lead">
          Your queue. Your rules. Your library — scroll to watch the deck come alive.
        </p>
        <div className="hero-actions">
          <Link to="/download" className="btn primary hero-cta">
            Download Q
          </Link>
          <a className="btn ghost hero-cta" href="#how">
            How it works
          </a>
        </div>
        <p className="hero-scroll-hint" style={{ opacity: Math.max(0, 1 - progress * 4) }}>
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
