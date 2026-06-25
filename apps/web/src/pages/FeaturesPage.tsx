import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";
import FeatureGrid from "../components/FeatureGrid";
import ScrollReveal from "../components/ScrollReveal";
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
          Features
        </p>
        <h1 className="booth-section-title">Everything Q does.</h1>
        <p className="booth-lead">
          Real DJ software integration, crowd requests on LTE, and profiles after the gig.
        </p>
        <div className="booth-cta-row">
          <Link to="/download" className="booth-btn-primary">
            Download →
          </Link>
          <Link to="/for-crowd" className="booth-btn-outline">
            For guests →
          </Link>
        </div>
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Booth
        </p>
        <h2 className="booth-section-title">Desktop app</h2>
        <FeatureGrid features={BOOTH_FEATURES} columns={3} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Crowd
        </p>
        <h2 className="booth-section-title">Guest phone</h2>
        <FeatureGrid features={CROWD_FEATURES} columns={3} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Community
        </p>
        <h2 className="booth-section-title">After the set</h2>
        <FeatureGrid features={COMMUNITY_FEATURES} columns={3} />
      </section>

      <section className="booth-section mkt-compare">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Why Q
        </p>
        <h2 className="booth-section-title">Built for DJs who mix.</h2>
        <ul className="mkt-compare-list">
          {COMPARE_NSR.map((row, index) => (
            <ScrollReveal key={row.q} delay={index * 60}>
              <li className="mkt-compare-row mkt-panel">
                <span className="mkt-compare-q">{row.q}</span>
                <span className="mkt-compare-them">Others: {row.them}</span>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </section>
    </BoothLayout>
  );
}
