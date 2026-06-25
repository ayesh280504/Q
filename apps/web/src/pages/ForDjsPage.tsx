import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";
import FeatureGrid from "../components/FeatureGrid";
import { BOOTH_FEATURES } from "../lib/marketingContent";

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
          Import your crate, print a QR, and control every request from one screen.
        </p>
        <Link to="/download" className="booth-btn-primary">
          Download Q →
        </Link>
      </section>

      <section className="booth-section">
        <FeatureGrid features={BOOTH_FEATURES} columns={2} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Tonight
        </p>
        <h2 className="booth-section-title">Four steps.</h2>
        <ol className="mkt-flow-list">
          <li className="mkt-panel">
            <strong>Start gig</strong>
            <span>Get your QR and session code.</span>
          </li>
          <li className="mkt-panel">
            <strong>Import &amp; sync</strong>
            <span>Guests can search your library.</span>
          </li>
          <li className="mkt-panel">
            <strong>Mix</strong>
            <span>Accept requests. Now playing syncs from Serato.</span>
          </li>
          <li className="mkt-panel">
            <strong>End gig</strong>
            <span>Crowd rates you. Build your profile.</span>
          </li>
        </ol>
      </section>
    </BoothLayout>
  );
}
