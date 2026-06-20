import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";
import FeatureGrid from "../components/FeatureGrid";
import { BOOTH_FEATURES, CHANGELOG_021 } from "../lib/marketingContent";

export default function ForDjsPage() {
  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          For DJs
        </p>
        <h1 className="booth-section-title">Your laptop is the booth.</h1>
        <p className="booth-lead">
          Q reads Rekordbox, Serato, and Spotify search profiles. Crowd requests land in a queue you
          control — accept, decline with reasons, auto-clear when you mix the track. Overlay mode
          sits beside your software so you never alt-tab mid-blend.
        </p>
        <Link to="/download" className="booth-btn-primary">Get Q for Mac / Windows →</Link>
      </section>

      <section className="booth-section">
        <h2 className="booth-section-title">Booth toolkit</h2>
        <FeatureGrid features={BOOTH_FEATURES} columns={2} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Tonight&apos;s flow
        </p>
        <h2 className="booth-section-title">Four steps.</h2>
        <ol className="mkt-flow-list">
          <li className="mkt-panel">
            <strong>01 — Start gig</strong>
            <span>Pick library profile (Local / Spotify / Both). Get QR + session code.</span>
          </li>
          <li className="mkt-panel">
            <strong>02 — Import &amp; sync</strong>
            <span>Pull Serato crates or rekordbox.xml. Tap Sync so guests can search your library.</span>
          </li>
          <li className="mkt-panel">
            <strong>03 — Mix</strong>
            <span>Now playing from Serato history or Pro DJ Link. Accept requests into your queue.</span>
          </li>
          <li className="mkt-panel">
            <strong>04 — End gig</strong>
            <span>Kill requests for everyone. Crowd rates you and can follow your profile.</span>
          </li>
        </ol>
      </section>

      <section className="booth-section" id="changelog">
        <p className="booth-kicker booth-kicker--purple">
          <span className="booth-kicker-dot" aria-hidden />
          v0.2.1
        </p>
        <h2 className="booth-section-title">What&apos;s new.</h2>
        <ul className="mkt-changelog">
          {CHANGELOG_021.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="booth-lead">
          <Link to="/features" className="booth-link-muted">Full feature list →</Link>
        </p>
      </section>
    </BoothLayout>
  );
}
