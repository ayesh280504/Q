import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";
import FeatureGrid from "../components/FeatureGrid";
import { CROWD_FEATURES } from "../lib/marketingContent";

export default function ForCrowdPage() {
  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          For guests
        </p>
        <h1 className="booth-section-title">Scan. Search. Request.</h1>
        <p className="booth-lead">
          No app download. No login during the set. Scan the DJ&apos;s QR and send a request.
        </p>
      </section>

      <section className="booth-section">
        <FeatureGrid features={CROWD_FEATURES} columns={2} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Modes
        </p>
        <h2 className="booth-section-title">Club or wedding.</h2>
        <p className="booth-lead">
          <strong>Club:</strong> private queue, fast search, no fluff.{" "}
          <strong>Wedding:</strong> optional live request wall and shoutouts when the DJ wants hype.
        </p>
      </section>

      <section className="booth-section">
        <p className="booth-lead">
          DJs:{" "}
          <Link to="/download" style={{ color: "var(--mkt-pink)" }}>
            Download Q →
          </Link>
        </p>
      </section>
    </BoothLayout>
  );
}
