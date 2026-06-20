import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BoothGigModal from "../components/BoothGigModal";
import BoothLayout from "../components/BoothLayout";
import LaunchAppButton from "../components/LaunchAppButton";
import { getInstallerUrls } from "../lib/downloadUrls";
import { CHANGELOG_021 } from "../lib/marketingContent";

const BOOTH_VERSION = "0.2.1";

const FEATURES = [
  {
    n: "01",
    title: "Command Center",
    desc: "QR center, queue rail, Serato/Rekordbox now playing — one screen for the whole set.",
  },
  {
    n: "02",
    title: "Library truth",
    desc: "Serato crates + rekordbox.xml + Spotify/Both crowd search. Privacy filters for VIP edits.",
  },
  {
    n: "03",
    title: "Crowd portal",
    desc: "Guests scan on LTE. Search, optional shoutout, accept/decline toasts, share with friends.",
  },
  {
    n: "04",
    title: "Overlay dock",
    desc: "Pin-on-top mini queue beside your DJ software. Sound + notification on new requests.",
  },
  {
    n: "05",
    title: "End gig + follow",
    desc: "Kill requests for everyone. Crowd rates the set and follows your community profile.",
  },
  {
    n: "06",
    title: "Offline sync",
    desc: "Accept offline, sync on hotspot. Auto Q Requests crate for Serato/Rekordbox.",
  },
] as const;

export default function DownloadPage() {
  const [search, setSearch] = useSearchParams();
  const [gigModalOpen, setGigModalOpen] = useState(search.get("gig") === "1");
  const installers = getInstallerUrls();

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
    <BoothLayout>
      <BoothGigModal open={gigModalOpen} onClose={closeGigModal} />

      <section className="booth-hero">
        <div className="booth-hero-grid">
          <div className="booth-hero-copy">
            <p className="booth-kicker booth-kicker--pink">
              <span className="booth-kicker-dot" aria-hidden />
              Booth · command center
            </p>
            <h1 className="booth-hero-title" aria-label="Run the booth">
              <span className="booth-hero-title-line">Run</span>
              <span className="booth-hero-title-line booth-hero-title-line--gradient">
                the booth.
              </span>
            </h1>
            <p className="booth-hero-desc">
              Q lives on your DJ laptop. Crowd requests fly into the browser — guests scan your QR
              and ping the booth from their phones. No shouting, no app installs.
            </p>
          </div>

          <aside className="booth-hero-download">
            <p className="booth-version-kicker">
              // Version {BOOTH_VERSION} — beta
            </p>
            <div className="booth-download-card">
              <div className="booth-download-card-meta">
                <span>macOS</span>
                <span className="booth-download-card-size">// installer</span>
              </div>
              {installers.mac ? (
                <a
                  className="booth-btn-primary booth-download-card-btn"
                  href={installers.mac}
                  download
                  rel="noopener noreferrer"
                >
                  Download for Mac →
                </a>
              ) : (
                <span className="booth-btn-primary booth-download-card-btn" aria-disabled style={{ opacity: 0.5 }}>
                  Download for Mac — soon
                </span>
              )}
              {installers.windows ? (
                <a
                  className="booth-btn-outline booth-download-card-btn"
                  href={installers.windows}
                  download
                  rel="noopener noreferrer"
                >
                  Windows →
                </a>
              ) : (
                <span className="booth-btn-outline booth-download-card-btn" aria-disabled>
                  Windows · soon
                </span>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="booth-section">
        <div className="booth-set-grid">
          <article className="booth-set-panel">
            <span className="booth-set-label">Set — 01</span>
            <p className="booth-kicker booth-kicker--pink">
              <span className="booth-kicker-dot" aria-hidden />
              Live tonight
            </p>
            <h1 className="booth-headline" aria-label="Ready for tonight">
              <span className="booth-headline-line">Ready for</span>
              <span className="booth-headline-line booth-headline-line--gradient-pink">
                tonight?
              </span>
            </h1>
            <p className="booth-lead">
              Spin up a gig session, grab your QR, and accept crowd requests straight on the
              screen. No shouting over the music.
            </p>
            <button type="button" className="booth-btn-primary" onClick={openGigModal}>
              Start your gig →
            </button>
            <LaunchAppButton label="Open booth app" className="booth-btn-outline" />
          </article>

          <article className="booth-set-panel">
            <span className="booth-set-label">Set — 02</span>
            <p className="booth-kicker booth-kicker--cyan">
              <span className="booth-kicker-dot" aria-hidden />
              Returning DJ
            </p>
            <h2 className="booth-headline" aria-label="Already installed">
              <span className="booth-headline-line">Already</span>
              <span className="booth-headline-line booth-headline-line--gradient-cyan">
                installed?
              </span>
            </h2>
            <p className="booth-lead">
              Hop straight back into the booth. Your library, queues, and crates are right where
              you left them.
            </p>
            <div className="booth-launch-wrap">
              <LaunchAppButton
                label="Launch Q on this Mac →"
                intent="open"
                className="booth-btn-outline"
              />
            </div>
            <a href="#changelog" className="booth-link-muted">
              See what&apos;s new in {BOOTH_VERSION} →
            </a>
          </article>
        </div>
      </section>

      <section className="booth-section" id="how">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Under the hood
        </p>
        <h2 className="booth-section-title">What ships in the box.</h2>
        <div className="booth-features">
          {FEATURES.map((f) => (
            <div key={f.n} className="booth-feature">
              <span className="booth-feature-num" aria-hidden>
                {f.n}
              </span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="booth-section" id="changelog">
        <p className="booth-kicker booth-kicker--purple">
          <span className="booth-kicker-dot" aria-hidden />
          Changelog
        </p>
        <h2 className="booth-section-title">What&apos;s new in {BOOTH_VERSION}</h2>
        <ul className="mkt-changelog">
          {CHANGELOG_021.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="booth-lead">
          <Link to="/features" className="booth-link-muted">Explore all features →</Link>
          {" · "}
          <Link to="/for-djs" className="booth-link-muted">DJ workflow guide →</Link>
        </p>
      </section>

      <section className="booth-section">
        <div className="booth-sysreq">
          <div>
            <p className="booth-kicker booth-kicker--pink">
              <span className="booth-kicker-dot" aria-hidden />
              System requirements
            </p>
            <h2 className="booth-sysreq-title">Will Q run for you?</h2>
          </div>
          <table className="booth-sysreq-table">
            <tbody>
              <tr>
                <th scope="row">macOS</th>
                <td>12 Monterey or newer (Apple Silicon + Intel)</td>
              </tr>
              <tr>
                <th scope="row">Windows</th>
                <td>10 / 11 — installer in private beta</td>
              </tr>
              <tr>
                <th scope="row">RAM</th>
                <td>4 GB minimum, 8 GB recommended</td>
              </tr>
              <tr>
                <th scope="row">Library</th>
                <td>Rekordbox 6+, Serato 2+, or local MP3/FLAC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="booth-section" id="download-platforms">
        <p className="booth-kicker booth-kicker--pink">
          <span className="booth-kicker-dot" aria-hidden />
          Plug in
        </p>
        <h2 className="booth-section-title">Download Q</h2>
        <p className="booth-lead">
          macOS and Windows booth apps. Install from a release build, or run from source while
          installers are in beta.
        </p>
        <div className="booth-download-grid">
          {installers.mac ? (
            <a
              className="booth-btn-primary"
              href={installers.mac}
              download
              rel="noopener noreferrer"
            >
              macOS
            </a>
          ) : (
            <span className="booth-btn-outline" style={{ opacity: 0.5 }} aria-disabled>
              macOS — soon
            </span>
          )}
          {installers.windows ? (
            <a
              className="booth-btn-outline"
              href={installers.windows}
              download
              rel="noopener noreferrer"
            >
              Windows
            </a>
          ) : (
            <span className="booth-btn-outline" style={{ opacity: 0.5 }} aria-disabled>
              Windows — soon
            </span>
          )}
        </div>
        <p className="booth-download-note">
          No installer yet? Clone the repo and run{" "}
          <code>npm run tauri:build -w @q/desktop</code>. Output lives under{" "}
          <code>apps/desktop/src-tauri/target/release/bundle/</code>.
        </p>
        <p className="booth-download-note" style={{ marginTop: "0.75rem" }}>
          <Link to="/community" style={{ color: "var(--mkt-pink)" }}>
            Browse the community feed →
          </Link>
        </p>
      </section>
    </BoothLayout>
  );
}
