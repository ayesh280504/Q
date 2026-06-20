import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import HeroDeckBackdrop from "../components/HeroDeckBackdrop";
import HeroScroll from "../components/HeroScroll";
import QFooter from "../components/QFooter";
import FeatureGrid from "../components/FeatureGrid";
import { BOOTH_FEATURES, CROWD_FEATURES } from "../lib/marketingContent";
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

        <div className="mkt-scroll-body">
          <section id="how" className="mkt-block mkt-block-how">
            <p className="mkt-label mkt-label-center">// How it works</p>
            <h2 className="mkt-section-title mkt-section-title-center">
              Three steps. Your laptop. Their phone.
            </h2>
            <div className="mkt-steps-grid">
              <article className="mkt-step mkt-panel">
                <span className="mkt-step-num">01</span>
                <h3>Local library</h3>
                <p>
                  Q reads Rekordbox, Serato, and your local files directly. No cloud lag, no uploads
                  — your crates stay on your laptop.
                </p>
              </article>
              <article className="mkt-step mkt-panel">
                <span className="mkt-step-num">02</span>
                <h3>QR request portal</h3>
                <p>
                  Print a sticker for the booth. The crowd scans on LTE — no venue Wi‑Fi, no app
                  install. Requests land in your queue.
                </p>
              </article>
              <article className="mkt-step mkt-panel" id="sync">
                <span className="mkt-step-num">03</span>
                <h3>Sync when ready</h3>
                <p>
                  DJ offline at the booth? Tap Sync now between sets to push your set history and
                  pull new requests over hotspot.
                </p>
              </article>
            </div>
          </section>

          <section className="mkt-block mkt-block-split">
            <p className="mkt-label mkt-label-center">// Two sides of Q</p>
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

        <section className="mkt-block">
          <p className="mkt-label mkt-label-center">// Booth depth</p>
          <h2 className="mkt-section-title mkt-section-title-center">
            Serato &amp; Rekordbox, not folder fiction.
          </h2>
          <p className="mkt-section-lead mkt-section-lead-center">
            Import crates, read live now-playing, overlay the queue beside your software — built for
            DJs who actually mix, not marketers selling wedding forms.
          </p>
          <FeatureGrid features={BOOTH_FEATURES.slice(0, 3)} columns={3} />
          <p className="mkt-block-cta mkt-block-cta-center">
            <Link to="/features" className="mkt-link mkt-link-cyan">Full feature list →</Link>
          </p>
        </section>

        <section className="mkt-block">
          <p className="mkt-label mkt-label-center">// Crowd speed</p>
          <h2 className="mkt-section-title mkt-section-title-center">Phone in hand. Three taps. Done.</h2>
          <p className="mkt-section-lead mkt-section-lead-center">
            Scan on LTE — no app install, no login during the set. Search Spotify + your crate,
            optional shoutout, live status when the DJ accepts.
          </p>
          <FeatureGrid features={CROWD_FEATURES.slice(0, 3)} columns={3} />
          <p className="mkt-block-cta mkt-block-cta-center">
            <Link to="/for-crowd" className="mkt-link mkt-link-pink">What guests see →</Link>
          </p>
        </section>

        <section id="pricing" className="mkt-block">
          <div className="mkt-panel mkt-panel-wide mkt-pricing-wrap">
            <p className="mkt-pricing-head mkt-pricing-head-center">Choose your access</p>
            <div className="mkt-pricing-grid">
            <article className="mkt-price-card">
              <span className="mkt-price-id">#001</span>
              <h3>Q Free</h3>
              <p className="mkt-price-amount">$0/mo</p>
              <ul>
                <li>Crowd request portal + share link</li>
                <li>Serato / Rekordbox import + sync</li>
                <li>Accept / decline + decline reasons</li>
                <li>BPM &amp; key on queue + now playing</li>
                <li>Overlay dock + Command Center</li>
                <li>Post-gig ratings + follow CTA</li>
                <li>Public DJ profile + mix feed</li>
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
          </div>
        </section>

        <section id="download" className="mkt-block mkt-download">
          <div className="mkt-panel mkt-download-panel">
            <p className="mkt-label mkt-label-center">// Plug in</p>
            <h2 className="mkt-section-title mkt-section-title-center">Ready to play?</h2>
            <p className="mkt-download-lead mkt-section-lead-center">
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
        </div>
      </main>

      <QFooter />
    </div>
  );
}
