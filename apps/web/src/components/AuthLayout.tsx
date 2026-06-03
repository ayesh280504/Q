import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import SiteNav from "./SiteNav";

type AuthLayoutProps = {
  children: ReactNode;
  formKicker: string;
  formTitle: [string, string];
};

export default function AuthLayout({
  children,
  formKicker,
  formTitle,
}: AuthLayoutProps) {
  return (
    <div className="auth-page-root mkt-page">
      <div className="auth-ambient" aria-hidden>
        <div className="auth-ambient-blob auth-ambient-blob--pink" />
        <div className="auth-ambient-blob auth-ambient-blob--purple" />
        <div className="auth-ambient-blob auth-ambient-blob--cyan" />
      </div>

      <div className="mkt-page-header auth-page-header">
        <SiteNav variant="marketing" />
      </div>
      <div className="auth-back-row mkt-page-inner">
        <Link to="/download" className="auth-back-top">
          ← Back to booth
        </Link>
      </div>

      <div className="auth-split">
        <aside className="auth-split-brand">
          <div className="auth-split-brand-panel">
            <div className="auth-split-brand-grid" aria-hidden />
            <p className="auth-split-kicker">
              <span className="auth-split-kicker-dot" aria-hidden />
              // Booth protocol · 001
            </p>
            <h1 className="mkt-display-headline auth-poster-headline" aria-label="Step inside">
              <span className="mkt-display-line mkt-display-line-primary">Step</span>
              <span className="mkt-display-line mkt-display-line-gradient">Inside.</span>
            </h1>
            <p className="auth-split-lead">
              Your mix locker, your crates, your request queue — all on one dark glass surface.
              Local-first. Crowd-powered.
            </p>
            <div className="auth-split-foot">
              <span>Side A · Access</span>
              <span>132 BPM</span>
            </div>
          </div>
        </aside>
        <section className="auth-split-form">
          <p className="auth-form-kicker">{formKicker}</p>
          <h2 className="mkt-display-headline auth-form-headline" aria-label={formTitle.join(" ")}>
            <span className="mkt-display-line mkt-display-line-primary">{formTitle[0]}</span>
            <span className="mkt-display-line mkt-display-line-gradient">{formTitle[1]}</span>
          </h2>
          {children}
        </section>
      </div>
    </div>
  );
}
