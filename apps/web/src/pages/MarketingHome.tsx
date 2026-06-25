import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import HeroDeckBackdrop from "../components/HeroDeckBackdrop";
import HeroScroll from "../components/HeroScroll";
import QFooter from "../components/QFooter";
import FeatureGrid from "../components/FeatureGrid";
import ScrollReveal from "../components/ScrollReveal";
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
          <ScrollReveal>
            <section id="how" className="mkt-block mkt-block-how">
              <p className="mkt-label mkt-label-center">// How it works</p>
              <h2 className="mkt-section-title mkt-section-title-center">
                Three steps. Your laptop. Their phone.
              </h2>
              <div className="mkt-steps-grid">
                <article className="mkt-step mkt-panel">
                  <span className="mkt-step-num">01</span>
                  <h3>Import your library</h3>
                  <p>Serato or Rekordbox — music stays on your laptop.</p>
                </article>
                <article className="mkt-step mkt-panel">
                  <span className="mkt-step-num">02</span>
                  <h3>Guests scan QR</h3>
                  <p>They request on LTE. No app, no venue Wi‑Fi.</p>
                </article>
                <article className="mkt-step mkt-panel" id="sync">
                  <span className="mkt-step-num">03</span>
                  <h3>You run the queue</h3>
                  <p>Accept, decline, mix. Sync anytime.</p>
                </article>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section className="mkt-block mkt-block-split">
              <p className="mkt-label mkt-label-center">// Two sides</p>
              <div className="mkt-split">
                <div className="mkt-split-col mkt-panel">
                  <h3>
                    Booth <span className="mkt-split-dot mkt-split-dot-pink" aria-hidden />
                  </h3>
                  <p>Desktop app for the DJ. Queue, QR, Serato sync.</p>
                  <Link to="/download" className="mkt-link mkt-link-pink">
                    Download →
                  </Link>
                </div>
                <div className="mkt-split-col mkt-panel">
                  <h3>
                    Community <span className="mkt-split-dot mkt-split-dot-cyan" aria-hidden />
                  </h3>
                  <p>Profiles, mixes, and gig ratings.</p>
                  <Link to="/community" className="mkt-link mkt-link-cyan">
                    Browse feed →
                  </Link>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section className="mkt-block">
              <p className="mkt-label mkt-label-center">// For DJs</p>
              <h2 className="mkt-section-title mkt-section-title-center">
                Built for Serato &amp; Rekordbox.
              </h2>
              <FeatureGrid features={BOOTH_FEATURES.slice(0, 3)} columns={3} />
              <p className="mkt-block-cta mkt-block-cta-center">
                <Link to="/for-djs" className="mkt-link mkt-link-cyan">
                  More for DJs →
                </Link>
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section className="mkt-block">
              <p className="mkt-label mkt-label-center">// For guests</p>
              <h2 className="mkt-section-title mkt-section-title-center">Scan. Search. Request.</h2>
              <FeatureGrid features={CROWD_FEATURES.slice(0, 3)} columns={3} />
              <p className="mkt-block-cta mkt-block-cta-center">
                <Link to="/for-crowd" className="mkt-link mkt-link-pink">
                  Guest experience →
                </Link>
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section id="pricing" className="mkt-block">
              <div className="mkt-panel mkt-panel-wide mkt-pricing-wrap">
                <p className="mkt-pricing-head mkt-pricing-head-center">Pricing</p>
                <div className="mkt-pricing-grid">
                  <article className="mkt-price-card">
                    <span className="mkt-price-id">#001</span>
                    <h3>Q Free</h3>
                    <p className="mkt-price-amount">$0</p>
                    <ul>
                      <li>Full booth + crowd portal</li>
                      <li>Serato / Rekordbox import</li>
                      <li>Profiles, ratings, mix feed</li>
                    </ul>
                    <Link to="/download" className="mkt-price-cta">
                      Get started
                    </Link>
                  </article>
                  <article className="mkt-price-card mkt-price-card-pro">
                    <span className="mkt-price-id">#002</span>
                    <h3>Q Pro</h3>
                    <p className="mkt-price-amount">Soon</p>
                    <ul>
                      <li>AI mix co-pilot</li>
                      <li>Verified boost</li>
                    </ul>
                    <span className="mkt-waitlist">Waitlist</span>
                  </article>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section id="download" className="mkt-block mkt-download">
              <div className="mkt-panel mkt-download-panel">
                <p className="mkt-label mkt-label-center">// Download</p>
                <h2 className="mkt-section-title mkt-section-title-center">Ready to play?</h2>
                <p className="mkt-download-lead mkt-section-lead-center">
                  macOS and Windows booth apps.
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
          </ScrollReveal>
        </div>
      </main>

      <QFooter />
    </div>
  );
}
