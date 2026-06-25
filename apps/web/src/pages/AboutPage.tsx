import { Link } from "react-router-dom";
import BoothLayout from "../components/BoothLayout";

export default function AboutPage() {
  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--purple">
          <span className="booth-kicker-dot" aria-hidden />
          About
        </p>
        <h1 className="booth-section-title">Queue, not chaos.</h1>
        <p className="booth-lead">
          Q connects DJs and crowds — local library on the laptop, requests on the phone.
        </p>
      </section>

      <section className="booth-section legal-section">
        <h2>What we believe</h2>
        <ul className="mkt-about-list">
          <li>Your crate is sacred. Music stays on your laptop.</li>
          <li>Guests shouldn&apos;t need an app to request a song.</li>
          <li>DJs build reputation through gigs — not email lists.</li>
        </ul>
      </section>

      <section className="booth-section legal-section">
        <h2>Contact</h2>
        <p className="booth-lead">
          Ayesh Chandrasekera ·{" "}
          <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a>
        </p>
        <p className="booth-lead">
          <Link to="/features">Features →</Link> · <Link to="/privacy">Privacy →</Link>
        </p>
      </section>
    </BoothLayout>
  );
}
