import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BoothGigModal from "../components/BoothGigModal";
import LaunchAppButton from "../components/LaunchAppButton";
import SiteNav from "../components/SiteNav";
import QLogo from "../components/QLogo";
import { Q_APP_START_GIG_URL } from "../lib/appLaunch";
import "../studio.css";
import "../community.css";

export default function DownloadPage() {
  const [search, setSearch] = useSearchParams();
  const [gigModalOpen, setGigModalOpen] = useState(search.get("gig") === "1");

  useEffect(() => {
    if (search.get("gig") === "1") setGigModalOpen(true);
  }, [search]);

  function openGigModal() {
    setGigModalOpen(true);
    if (search.get("gig") !== "1") {
      search.set("gig", "1");
      setSearch(search, { replace: true });
    }
  }

  function closeGigModal() {
    setGigModalOpen(false);
    if (search.get("gig") === "1") {
      search.delete("gig");
      setSearch(search, { replace: true });
    }
  }

  return (
    <div className="download-page">
      <SiteNav />
      <BoothGigModal open={gigModalOpen} onClose={closeGigModal} />
      <main className="download-main">
        <QLogo size={56} className="download-logo" />
        <h1>Download Q Command Center</h1>
        <p className="lead narrow">
          The booth app runs on your DJ laptop. Crowd requests live in the browser — guests scan
          your QR and request from their phones.
        </p>

        <section className="card download-gig-hero">
          <h2>Ready for tonight?</h2>
          <p className="muted">
            Start a gig session to get your QR code and accept crowd requests on screen — no
            shouting over the music.
          </p>
          <div className="download-gig-actions">
            <button type="button" className="btn primary" onClick={openGigModal}>
              Start your gig
            </button>
            <LaunchAppButton label="Open booth app" className="btn ghost" />
          </div>
        </section>

        <section className="card download-launch-card">
          <h2>Already installed?</h2>
          <p className="muted">
            Use <strong>Start your gig</strong> above for the full walkthrough, or jump straight
            into the booth app.
          </p>
          <a className="btn ghost" href={Q_APP_START_GIG_URL}>
            Open booth & start gig
          </a>
        </section>

        <div id="download-platforms" className="download-grid">
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
                  Install <a href="https://nodejs.org/">Node 20+</a> and{" "}
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
                  Install <a href="https://nodejs.org/">Node 20+</a> and{" "}
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
