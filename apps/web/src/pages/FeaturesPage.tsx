import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";
import FeatureGrid from "../components/FeatureGrid";
import {
  BOOTH_FEATURES,
  CROWD_FEATURES,
  COMMUNITY_FEATURES,
  COMPARE_NSR,
} from "../lib/marketingContent";

export default function FeaturesPage() {
  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--purple">
          <span className="booth-kicker-dot" aria-hidden />
          Everything Q ships
        </p>
        <h1 className="booth-section-title">Built for the booth. Not the brochure.</h1>
        <p className="booth-lead">
          Q is a DJ request system that reads your real library, lives beside Serato and Rekordbox,
          and turns the crowd into fans after last call — without cloning every wedding-SaaS feature
          on the market.
        </p>
        <div className="booth-cta-row">
          <Link to="/download" className="booth-btn-primary">Download booth app →</Link>
          <Link to="/for-crowd" className="booth-btn-outline">What guests see →</Link>
        </div>
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Booth · desktop
        </p>
        <h2 className="booth-section-title">Run the floor from one screen.</h2>
        <FeatureGrid features={BOOTH_FEATURES} columns={3} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Crowd · phone
        </p>
        <h2 className="booth-section-title">Guests scan. Search. Done.</h2>
        <FeatureGrid features={CROWD_FEATURES} columns={3} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Community · web
        </p>
        <h2 className="booth-section-title">Identity after the gig.</h2>
        <FeatureGrid features={COMMUNITY_FEATURES} columns={3} />
      </section>

      <section className="booth-section mkt-compare">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Why DJs pick Q
        </p>
        <h2 className="booth-section-title">Depth where it matters.</h2>
        <p className="booth-lead">
          Other platforms sell the whole wedding business stack. Q wins on booth truth, Serato/Rekordbox
          workflow, and crowd speed.
        </p>
        <ul className="mkt-compare-list">
          {COMPARE_NSR.map((row) => (
            <li key={row.q} className="mkt-compare-row mkt-panel">
              <span className="mkt-compare-q">{row.q}</span>
              <span className="mkt-compare-them">Others: {row.them}</span>
            </li>
          ))}
        </ul>
      </section>
    </BoothLayout>
  );
}
