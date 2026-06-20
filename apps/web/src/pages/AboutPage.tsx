import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";

export default function AboutPage() {
  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--purple">
          <span className="booth-kicker-dot" aria-hidden />
          About Q
        </p>
        <h1 className="booth-section-title">The future of the booth.</h1>
        <p className="booth-lead">
          Q is a local-first DJ request platform: desktop booth app, crowd request portal, and
          community web — built for Serato and Rekordbox DJs who want crowd energy without losing
          control of the room.
        </p>
      </section>

      <section className="booth-section legal-section">
        <h2>What we believe</h2>
        <ul className="mkt-about-list">
          <li>
            <strong>Booth truth beats folder scans.</strong> Your crate in Serato — including
            Tidal streams — is what matters, not what happens to be on disk.
          </li>
          <li>
            <strong>Guests shouldn&apos;t need an app.</strong> LTE + QR is enough. Login comes
            after the set, when they want to follow you.
          </li>
          <li>
            <strong>DJs are artists, not email lists.</strong> Community profiles, mixes, and gig
            ratings — not just CRM pixels.
          </li>
          <li>
            <strong>Clubs need focus.</strong> Private DJ queue by default. Public walls and shoutouts
            when you want the hype.
          </li>
        </ul>
      </section>

      <section className="booth-section legal-section">
        <h2>Operator</h2>
        <p className="booth-lead">
          Q is operated by <strong>Ayesh Chandrasekera</strong>. Questions:{" "}
          <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a>.
        </p>
        <p className="booth-lead">
          <Link to="/features">Explore features →</Link> ·{" "}
          <Link to="/privacy">Privacy policy →</Link>
        </p>
      </section>
    </BoothLayout>
  );
}
