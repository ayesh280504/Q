import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import QLogo from "../components/QLogo";

const LAST_UPDATED = "May 24, 2026";

export default function PrivacyPage() {
  return (
    <AppShell>
        <QLogo size={48} className="legal-logo" />
        <p className="q-kicker">// Legal</p>
        <h1 className="q-title">Privacy Policy</h1>
        <p className="muted">Last updated: {LAST_UPDATED}</p>

        <section className="legal-section">
          <h2>What Q is</h2>
          <p>
            Q (the &ldquo;Service&rdquo;) is a DJ request-management tool. It includes a marketing
            and community website (<code>q-web-liart.vercel.app</code>), a crowd request portal
            (<code>q-crowd.vercel.app</code>), an API backend (<code>q-api.onrender.com</code>),
            and a desktop &ldquo;booth&rdquo; application installed on the DJ&apos;s laptop. This
            policy explains what information Q collects, why, and how it is used.
          </p>
          <p>
            Q is operated by <strong>Ayesh Chandrasekera</strong> (the &ldquo;Operator&rdquo;).
            Contact: <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Information we collect</h2>
          <h3>From DJ accounts (web + booth app)</h3>
          <ul>
            <li>Email address (used for sign-in and account recovery).</li>
            <li>Username / handle (shown publicly on the DJ profile).</li>
            <li>Display name (optional, shown publicly).</li>
            <li>Bio (optional, shown publicly).</li>
            <li>
              Social-media handles or URLs you choose to add (Instagram, X, SoundCloud, TikTok,
              website). Shown publicly.
            </li>
            <li>
              Mix metadata you submit: title, description, external link (e.g. SoundCloud URL).
              Public mixes appear on the community feed and your DJ profile.
            </li>
            <li>Authentication tokens issued by our auth provider (Supabase).</li>
          </ul>

          <h3>From the booth desktop app</h3>
          <ul>
            <li>
              <strong>Library metadata</strong> read from Rekordbox or Serato on your computer:
              track titles, artists, BPM, key, album. Q reads this <em>locally</em> and uploads
              the metadata to your active session so guests can search it.
            </li>
            <li>
              <strong>Now-playing data</strong> (Serato): the currently playing track is read
              locally so the queue can auto-clear when you mix a track. This is never shared
              publicly.
            </li>
            <li>Session details: session code, display name, request limits.</li>
            <li>
              Q <strong>does not upload or stream audio files</strong>. Only text metadata about
              tracks is sent to the API.
            </li>
          </ul>

          <h3>From guests using the crowd request page</h3>
          <ul>
            <li>
              A <strong>random anonymous identifier</strong> (UUID) stored in the guest&apos;s
              browser. Used only to enforce per-person request limits for the active session.
              Guests do <strong>not</strong> create an account.
            </li>
            <li>
              The track requested (title, artist, optional message), plus the session code being
              requested.
            </li>
          </ul>

          <h3>Automatically collected</h3>
          <ul>
            <li>
              Standard server logs from our hosting providers (IP address, user-agent,
              timestamp). Used for security, debugging, and abuse prevention.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Information we do <em>not</em> collect</h2>
          <ul>
            <li>Payment information &mdash; Q is currently free; we do not process payments.</li>
            <li>Government IDs or other sensitive identity documents.</li>
            <li>Precise device location (GPS).</li>
            <li>Audio recordings or uploaded music files.</li>
            <li>Browsing history outside of Q.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Why we collect this information</h2>
          <ul>
            <li>
              <strong>Account & sign-in:</strong> create your DJ account, recover access,
              maintain a session.
            </li>
            <li>
              <strong>Public profile:</strong> show your handle, bio, mixes, and social links on
              your <code>/dj/&lt;handle&gt;</code> page and the community feed.
            </li>
            <li>
              <strong>Gig functionality:</strong> generate QR codes, route requests from guest
              phones to the correct DJ booth app, enforce request limits.
            </li>
            <li>
              <strong>Library search:</strong> let guests search the DJ&apos;s synced library
              from their phone.
            </li>
            <li>
              <strong>Security & abuse prevention:</strong> rate limiting, blocking spam,
              keeping the service available.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>How information is stored and shared</h2>
          <p>Your data is stored on the following third-party infrastructure providers:</p>
          <ul>
            <li>
              <strong>Render</strong> &mdash; hosts the Q API and database.{" "}
              <a href="https://www.render.com/privacy" target="_blank" rel="noreferrer">
                Render Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel</strong> &mdash; hosts the website and crowd app.{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
                Vercel Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Supabase</strong> &mdash; handles authentication (email and optional
              Google sign-in).{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">
                Supabase Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>GitHub</strong> &mdash; hosts the downloadable installer file via GitHub
              Releases.{" "}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noreferrer"
              >
                GitHub Privacy Statement
              </a>
              .
            </li>
          </ul>
          <p>
            Q <strong>does not sell</strong> your personal information. Q does not share your
            data with advertisers. Information may be disclosed if required by law (e.g. valid
            legal process) or to protect the rights, property, or safety of Q, our users, or
            the public.
          </p>
        </section>

        <section className="legal-section">
          <h2>Public vs private data</h2>
          <p>
            The following are <strong>publicly visible</strong> to anyone on the internet when
            you create them:
          </p>
          <ul>
            <li>Your handle, display name, bio, and social links.</li>
            <li>Mixes you mark as public.</li>
            <li>Verified badge (if granted).</li>
          </ul>
          <p>The following are <strong>not</strong> public:</p>
          <ul>
            <li>Your email address.</li>
            <li>Mixes marked as private.</li>
            <li>Library metadata uploaded from your booth app.</li>
            <li>Active gig request history.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Cookies & local storage</h2>
          <p>Q uses cookies and browser local storage only for essential functionality:</p>
          <ul>
            <li>Supabase authentication session.</li>
            <li>Anonymous guest UUID on the crowd app.</li>
            <li>Booth app local cache (gig state, library snapshot, offline outbox).</li>
            <li>Onboarding tour completion flag.</li>
          </ul>
          <p>Q does not use third-party advertising or tracking cookies.</p>
        </section>

        <section className="legal-section">
          <h2>Data retention</h2>
          <ul>
            <li>
              Account data is retained while your account is active. Deleting your account
              removes your profile, mixes, and library metadata from the API database (server
              logs may persist for up to 30 days for security).
            </li>
            <li>
              Crowd request data is retained per session. Old sessions and their requests are
              periodically purged.
            </li>
            <li>
              Server logs are retained by our hosting providers under their own retention
              policies (typically 7&ndash;30 days).
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Your rights</h2>
          <p>You may request the following at any time:</p>
          <ul>
            <li>A copy of the personal information Q holds about you.</li>
            <li>Correction of inaccurate information.</li>
            <li>
              Deletion of your account and associated data (where retention is not legally
              required).
            </li>
          </ul>
          <p>
            To make a request, email{" "}
            <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a> from the email
            address associated with your account.
          </p>
        </section>

        <section className="legal-section">
          <h2>Children</h2>
          <p>
            Q is intended for users <strong>16 and older</strong>. Q does not knowingly collect
            personal information from children under 13. If you believe a child under 13 has
            provided personal information to Q, please contact us so we can delete it.
          </p>
        </section>

        <section className="legal-section">
          <h2>Security</h2>
          <p>
            Q transmits data over HTTPS. Passwords are hashed by Supabase Auth and not stored
            in plain text. No method of transmission or storage is 100% secure; Q cannot
            guarantee absolute security but takes reasonable measures to protect user data.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as Q evolves. Changes will be reflected by updating the
            &ldquo;Last updated&rdquo; date at the top of this page. Significant changes will be
            announced on the website.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            Questions, requests, or concerns:{" "}
            <a href="mailto:ayesh2805@outlook.com">ayesh2805@outlook.com</a>.
          </p>
        </section>

        <p className="muted small legal-foot">
          <Link to="/">← Back to home</Link>
        </p>
    </AppShell>
  );
}
