import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import QLogo from "../components/QLogo";

const LAST_UPDATED = "May 30, 2026";

export default function TermsPage() {
  return (
    <AppShell>
      <QLogo size={48} className="legal-logo" />
      <p className="q-kicker">// Legal</p>
      <h1 className="q-title">Terms of Service</h1>
      <p className="muted">Last updated: {LAST_UPDATED}</p>

      <section className="legal-section">
        <h2>Agreement</h2>
        <p>
          By using Q (website, crowd portal, API, or desktop booth app), you agree to these Terms.
          If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="legal-section">
        <h2>The Service</h2>
        <p>
          Q provides tools for DJs to manage crowd song requests, sync library metadata, and build
          a public profile. The Service is provided &ldquo;as is&rdquo; during beta. Features may
          change.
        </p>
      </section>

      <section className="legal-section">
        <h2>Your content</h2>
        <p>
          You retain rights to mixes and profile content you upload. You grant Q a license to
          display public profile and mix metadata on the Service. Do not upload content you do not
          have rights to share.
        </p>
        <p>
          Crowd requests (track titles, optional notes) are submitted to the DJ&apos;s session. DJs
          control accept/decline. Request content may be shown on optional public request walls
          when the DJ enables that feature.
        </p>
      </section>

      <section className="legal-section">
        <h2>Acceptable use</h2>
        <ul>
          <li>No harassment, illegal content, or spam requests.</li>
          <li>No attempts to disrupt sessions or access other DJs&apos; private data.</li>
          <li>DJs must comply with venue policies and copyright law when playing requested tracks.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Accounts</h2>
        <p>
          DJ accounts require accurate email and handle. You are responsible for activity under your
          account. Crowd guests do not need accounts during a live gig.
        </p>
      </section>

      <section className="legal-section">
        <h2>Disclaimer</h2>
        <p>
          Q is not responsible for music licensing, venue contracts, or playback decisions. The DJ
          always has final say on what gets played.
        </p>
      </section>

      <section className="legal-section">
        <h2>Contact</h2>
        <p>
          Ayesh Chandrasekera — <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a>.
          See also our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </AppShell>
  );
}
