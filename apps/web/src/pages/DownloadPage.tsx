import { Link } from "react-router-dom";
import LaunchAppButton from "../components/LaunchAppButton";
import SiteNav from "../components/SiteNav";
import QLogo from "../components/QLogo";
import "../studio.css";

export default function DownloadPage() {
  return (
    <div className="download-page">
      <SiteNav />
      <main className="download-main">
        <QLogo size={56} className="download-logo" />
        <h1>Download Q Command Center</h1>
        <p className="lead narrow">
          The booth app runs on your DJ laptop (macOS or Windows). Crowd requests and your web
          profile work in the browser — no install needed for guests.
        </p>

        <section className="card download-launch-card" style={{ marginBottom: "1.5rem" }}>
          <h2>Already installed?</h2>
          <p className="muted">
            Open Q from your desktop like any other app, or use this button while signed in on
            the website — your browser may ask to confirm opening Q.
          </p>
          <LaunchAppButton label="Launch Q booth app" />
        </section>

        <div className="download-grid">
          <article className="card download-card">
            <h2>Windows</h2>
            <p className="muted">
              For Serato / Rekordbox on PC. Build the desktop app from source (installer coming
              soon).
            </p>
            <p className="download-badge">Requires Windows 10+</p>
            <details className="download-details">
              <summary>Build on Windows</summary>
              <ol className="download-steps">
                <li>
                  Install <a href="https://nodejs.org/">Node 18+</a> and{" "}
                  <a href="https://rustup.rs/">Rust</a>
                </li>
                <li>Clone your Q repo and run <code>npm install</code></li>
                <li>
                  <code>npm run tauri:build -w @q/desktop</code>
                </li>
                <li>
                  Installer output under{" "}
                  <code>apps/desktop/src-tauri/target/release/bundle/</code>
                </li>
              </ol>
            </details>
            <span className="btn ghost download-btn-disabled" aria-disabled>
              Windows installer — coming soon
            </span>
          </article>

          <article className="card download-card">
            <h2>macOS</h2>
            <p className="muted">
              For Mac DJs using Serato or Rekordbox. Same build process until we host a signed
              .dmg.
            </p>
            <p className="download-badge">Requires macOS 11+</p>
            <details className="download-details">
              <summary>Build on Mac</summary>
              <ol className="download-steps">
                <li>
                  Install <a href="https://nodejs.org/">Node 18+</a> and{" "}
                  <a href="https://rustup.rs/">Rust</a>
                </li>
                <li>Clone your Q repo and run <code>npm install</code></li>
                <li>
                  <code>npm run tauri:build -w @q/desktop</code>
                </li>
                <li>
                  Look for <code>.app</code> or <code>.dmg</code> in{" "}
                  <code>apps/desktop/src-tauri/target/release/bundle/macos/</code>
                </li>
              </ol>
            </details>
            <span className="btn ghost download-btn-disabled" aria-disabled>
              Mac installer — coming soon
            </span>
          </article>
        </div>

        <section className="card download-dev-card">
          <h2>Developers — run locally</h2>
          <p className="muted">
            While we finish hosted downloads, run the full stack on your machine:
          </p>
          <pre className="code">npm run dev:stack</pre>
          <p className="muted small">
            Terminal 2: <code>npm run tauri:dev -w @q/desktop</code>
          </p>
          <p className="muted small">
            <Link to="/register">Create a DJ account</Link> on the web, then sign in inside the
            desktop app before your first gig.
          </p>
        </section>
      </main>
      <footer className="footer">
        <p>
          <Link to="/">← Back to home</Link>
        </p>
      </footer>
    </div>
  );
}
