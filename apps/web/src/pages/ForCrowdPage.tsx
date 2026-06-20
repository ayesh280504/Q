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
          For the crowd
        </p>
        <h1 className="booth-section-title">Scan. Search. Request.</h1>
        <p className="booth-lead">
          No app download. No account during the set. Point your camera at the DJ&apos;s QR, search
          for a track, and send a request — it appears on their screen at the booth. You&apos;ll see
          when they accept or pass, and you can rate the set when it ends.
        </p>
      </section>

      <section className="booth-section">
        <h2 className="booth-section-title">What you get on your phone</h2>
        <FeatureGrid features={CROWD_FEATURES} columns={2} />
      </section>

      <section className="booth-section">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Club vs wedding
        </p>
        <h2 className="booth-section-title">Fast by default.</h2>
        <div className="mkt-split mkt-split--page">
          <article className="mkt-panel mkt-split-col">
            <h3>Club / bar</h3>
            <p>
              Search bar, request button, optional note. No shoutout forms, no merch tabs, no login
              wall. The DJ keeps a private queue — the room doesn&apos;t vote on your set.
            </p>
          </article>
          <article className="mkt-panel mkt-split-col">
            <h3>Wedding / hype room</h3>
            <p>
              Turn on the <strong>live request wall</strong> so guests see what&apos;s being asked.
              Allow shoutouts and dedications. Share link so every table gets the same booth.
            </p>
          </article>
        </div>
      </section>

      <section className="booth-section">
        <p className="booth-lead">
          DJs:{" "}
          <Link to="/download" style={{ color: "var(--mkt-pink)" }}>
            Download Q and print your QR →
          </Link>
        </p>
      </section>
    </BoothLayout>
  );
}
