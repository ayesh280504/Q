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
        <p className="hero-kicker">
          <span className="hero-kicker-dot" aria-hidden />
          <span>// Booth access granted</span>
        </p>
        <h1 className="font-display hero-headline">
          <span className="hero-title-primary">The Future</span>
          <span className="hero-title-gradient-clip">
            <span className="hero-title-gradient">Of The Booth</span>
          </span>
        </h1>
        <div className="hero-actions">
          <Link to="/download" className="btn btn-primary-mkt hero-cta">
            Download Q
          </Link>
          <a className="btn btn-ghost-mkt hero-cta" href="#how">
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
