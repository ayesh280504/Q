import { Link } from "react-router-dom";
import QLogo from "../components/QLogo";
import HeroDeckBackdrop from "../components/HeroDeckBackdrop";
import HeroScroll from "../components/HeroScroll";
import { useHeroScrollProgress } from "../hooks/useHeroScrollProgress";

export default function MarketingHome() {
  const progress = useHeroScrollProgress();

  return (
    <>
      <HeroDeckBackdrop progress={progress} />

      <header className="nav nav-over-hero">
        <Link to="/" className="logo">
          <QLogo size={32} />
        </Link>
        <nav>
          <Link to="/community">Community</Link>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#download">Download</a>
        </nav>
      </header>

      <main className="site-main">
        <HeroScroll progress={progress} />

        <section id="how" className="section section-after-hero">
          <h2>How it works</h2>
          <div className="grid three">
            <article className="card">
              <h3>1 · Local library</h3>
              <p>
                Import Rekordbox or Serato from USB and local files. Music stays on your laptop —
                never uploaded.
              </p>
            </article>
            <article className="card">
              <h3>2 · QR sticker</h3>
              <p>
                Print a sticker for your laptop. Crowd scans on LTE — no venue Wi‑Fi required.
              </p>
            </article>
            <article className="card">
              <h3>3 · Sync when ready</h3>
              <p>
                DJ offline at the booth? Tap <strong>Sync now</strong> over hotspot between sets.
              </p>
            </article>
          </div>
        </section>

        <section className="section community-teaser">
          <h2>Two sides of Q</h2>
          <div className="grid two">
            <article className="card">
              <h3>Booth mode</h3>
              <p>QR requests, queue, Serato now-playing — everything you&apos;ve been building.</p>
              <a href="#download" className="btn-link">
                Get the desktop app →
              </a>
            </article>
            <article className="card">
              <h3>Community</h3>
              <p>Share mixes, build your profile, get discovered. Free — for the love of DJing.</p>
              <Link to="/community" className="btn-link">
                Browse the feed →
              </Link>
            </article>
          </div>
        </section>

        <section id="pricing" className="section">
          <h2>Pricing</h2>
          <div className="grid two pricing">
            <article className="card">
              <h3>Q Free</h3>
              <p className="price">$0</p>
              <ul>
                <li>Crowd request portal</li>
                <li>Accept / decline gatekeeper</li>
                <li>BPM &amp; key on queue</li>
                <li>Public DJ profile + mix links</li>
              </ul>
            </article>
            <article className="card pro coming-soon-card">
              <span className="soon-badge">Coming soon</span>
              <h3>Q Pro</h3>
              <p className="price muted-price">AI co-pilot</p>
              <ul>
                <li>AI transition ideas</li>
                <li>Verified boost in feed</li>
                <li>Smarter blend paths</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="download" className="section">
          <h2>Download</h2>
          <p className="lead narrow">
            Q runs as a desktop app on your DJ laptop. Build from source with Rust + Node.
          </p>
          <pre className="code">npm run tauri:dev -w @q/desktop</pre>
        </section>
      </main>

      <footer className="footer">
        <p>Q — queue, not chaos.</p>
      </footer>
    </>
  );
}
