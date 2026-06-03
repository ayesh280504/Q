import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QLogo from "./QLogo";
import { useAuth } from "../context/AuthContext";

interface SiteNavProps {
  /** Fixed transparent bar on marketing hero */
  overHero?: boolean;
  /** Minimal uppercase nav on marketing homepage */
  variant?: "default" | "marketing";
}

export default function SiteNav({ overHero, variant = "default" }: SiteNavProps) {
  const { signedIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("site-nav-menu-open", menuOpen);
    return () => document.body.classList.remove("site-nav-menu-open");
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const isMarketing = variant === "marketing";

  return (
    <header
      className={`site-nav ${overHero ? "site-nav-over-hero" : ""} ${isMarketing ? "site-nav-marketing" : ""}`}
    >
      <Link to="/" className="logo" onClick={closeMenu}>
        <QLogo size={40} className="site-nav-logo" />
      </Link>

      <button
        type="button"
        className={`site-nav-toggle ${menuOpen ? "site-nav-toggle-open" : ""}`}
        aria-expanded={menuOpen}
        aria-controls="site-nav-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="site-nav-toggle-bar" />
        <span className="site-nav-toggle-bar" />
        <span className="site-nav-toggle-bar" />
      </button>

      {menuOpen ? (
        <button
          type="button"
          className="site-nav-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}

      <nav
        id="site-nav-menu"
        className={`site-nav-links ${menuOpen ? "site-nav-links-open" : ""}`}
      >
        <Link
          to="/download"
          onClick={closeMenu}
          className={[
            isMarketing ? "site-nav-text" : "",
            isMarketing &&
            (location.pathname === "/download" || location.pathname === "/booth")
              ? "site-nav-link-active"
              : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined}
        >
          {isMarketing ? "Booth" : "Download"}
        </Link>
        <Link
          to="/community"
          onClick={closeMenu}
          className={[
            isMarketing ? "site-nav-text" : "",
            isMarketing && location.pathname.startsWith("/community")
              ? "site-nav-link-active"
              : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined}
        >
          Community
        </Link>
        {signedIn ? (
          <>
            {!isMarketing && (
              <Link to="/studio" onClick={closeMenu}>
                My studio
              </Link>
            )}
            {isMarketing ? (
              <Link to="/studio" onClick={closeMenu} className="site-nav-text">
                Studio
              </Link>
            ) : (
              <Link to="/settings" onClick={closeMenu}>
                Settings
              </Link>
            )}
            {!isMarketing && (
              <a href="qdj://open" className="site-nav-cta-app" onClick={closeMenu}>
                Open booth app
              </a>
            )}
            <button
              type="button"
              className="site-nav-btn site-nav-btn-block"
              onClick={() => {
                closeMenu();
                void signOut();
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu} className={isMarketing ? "site-nav-signin" : undefined}>
              Sign in
            </Link>
            <Link to="/register" className="site-nav-cta" onClick={closeMenu}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
