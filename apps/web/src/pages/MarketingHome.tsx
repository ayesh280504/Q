import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import HeroDeckBackdrop from "../components/HeroDeckBackdrop";
import HeroScroll from "../components/HeroScroll";
import QFooter from "../components/QFooter";
import { useHeroScrollProgress } from "../hooks/useHeroScrollProgress";
import "../marketing-home.css";

export default function MarketingHome() {
  const progress = useHeroScrollProgress();

  return (
    <div className="q-app marketing-page">
      <HeroDeckBackdrop progress={progress} />

      <SiteNav overHero variant="marketing" />

      <main className="site-main">
        <HeroScroll progress={progress} />

        <div id="how" className="mkt-block mkt-block-steps">
          <article className="mkt-step mkt-panel">
            <span className="mkt-step-num">01</span>
            <h2>Local library</h2>
            <p>
              Q reads Rekordbox, Serato, and your local files directly. No cloud lag, no uploads —
              your crates stay on your laptop.
            </p>
          </article>
          <article className="mkt-step mkt-panel">
            <span className="mkt-step-num">02</span>
            <h2>QR request portal</h2>
            <p>
              Print a sticker for the booth. The crowd scans on LTE — no venue Wi‑Fi, no app
              install. Requests land in your queue.
            </p>
          </article>
          <article className="mkt-step mkt-panel" id="sync">
            <span className="mkt-step-num">03</span>
            <h2>Sync when ready</h2>
            <p>
              DJ offline at the booth? Tap Sync now between sets to push your set history and pull
              new requests over hotspot.
            </p>
          </article>
        </div>

        <section className="mkt-block mkt-block-split">
          <p className="mkt-label">// Two sides of Q</p>
          <div className="mkt-split">
            <div className="mkt-split-col mkt-panel">
              <h3>
                Booth mode <span className="mkt-split-dot mkt-split-dot-pink" aria-hidden />
              </h3>
              <p>
                QR requests, queue, Serato now-playing. Everything you need at the booth, nothing
                you don&apos;t.
              </p>
              <Link to="/download" className="mkt-link mkt-link-pink">
                Get the desktop app →
              </Link>
            </div>
            <div className="mkt-split-col mkt-panel">
              <h3>
                Community <span className="mkt-split-dot mkt-split-dot-cyan" aria-hidden />
              </h3>
              <p>
                Share mixes, build your profile, get discovered. Free — for the love of DJing.
              </p>
              <Link to="/community" className="mkt-link mkt-link-cyan">
                Browse the feed →
              </Link>
            </div>
          </div>
        </section>

        <section id="pricing" className="mkt-block mkt-panel mkt-panel-wide">
          <p className="mkt-pricing-head">Choose your access</p>
          <div className="mkt-pricing-grid">
            <article className="mkt-price-card">
              <span className="mkt-price-id">#001</span>
              <h3>Q Free</h3>
              <p className="mkt-price-amount">$0/mo</p>
              <ul>
                <li>Crowd request portal</li>
                <li>Accept / decline gatekeeper</li>
                <li>BPM &amp; key on queue</li>
                <li>Public DJ profile + mix links</li>
              </ul>
              <Link to="/download" className="mkt-price-cta">
                Get access
              </Link>
            </article>
            <article className="mkt-price-card mkt-price-card-pro">
              <span className="mkt-price-id">#002</span>
              <h3>Q Pro · AI co-pilot</h3>
              <p className="mkt-price-amount">Soon</p>
              <ul>
                <li>AI transition ideas</li>
                <li>Verified boost in feed</li>
                <li>Smarter blend paths</li>
              </ul>
              <span className="mkt-waitlist">Join waitlist</span>
            </article>
          </div>
        </section>

        <section id="download" className="mkt-block mkt-download">
          <div className="mkt-panel mkt-panel-left">
            <p className="mkt-label">// Plug in</p>
            <h2>Ready to play?</h2>
            <p className="mkt-download-lead">
              macOS and Windows booth apps — download the installer for your platform.
            </p>
            <div className="mkt-platform-btns">
              <Link to="/download" className="mkt-platform-btn mkt-platform-btn-light">
                macOS
              </Link>
              <Link to="/download" className="mkt-platform-btn mkt-platform-btn-dark">
                Windows
              </Link>
            </div>
          </div>
        </section>
      </main>

      <QFooter />
    </div>
  );
}
