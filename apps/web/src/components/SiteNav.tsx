import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QLogo from "./QLogo";
import { useAuth } from "../context/AuthContext";

interface SiteNavProps {
  /** Fixed transparent bar on marketing hero */
  overHero?: boolean;
}

export default function SiteNav({ overHero }: SiteNavProps) {
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

  return (
    <header className={`site-nav ${overHero ? "site-nav-over-hero" : ""}`}>
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
        <Link to="/download" onClick={closeMenu}>
          Download
        </Link>
        <Link to="/community" onClick={closeMenu}>
          Community
        </Link>
        {signedIn ? (
          <>
            <Link to="/studio" onClick={closeMenu}>
              My studio
            </Link>
            <Link to="/settings" onClick={closeMenu}>
              Settings
            </Link>
            <a href="qdj://open" className="site-nav-cta-app" onClick={closeMenu}>
              Open booth app
            </a>
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
            <Link to="/login" onClick={closeMenu}>
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
