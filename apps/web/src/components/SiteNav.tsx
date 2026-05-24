import { Link } from "react-router-dom";
import QLogo from "./QLogo";
import { useAuth } from "../context/AuthContext";

interface SiteNavProps {
  /** Fixed transparent bar on marketing hero */
  overHero?: boolean;
}

export default function SiteNav({ overHero }: SiteNavProps) {
  const { signedIn, signOut } = useAuth();

  return (
    <header className={`site-nav ${overHero ? "site-nav-over-hero" : ""}`}>
      <Link to="/" className="logo">
        <QLogo size={40} className="site-nav-logo" />
      </Link>
      <nav className="site-nav-links">
        <Link to="/download">Download</Link>
        <Link to="/community">Community</Link>
        {signedIn ? (
          <>
            <Link to="/studio">My studio</Link>
            <Link to="/settings">Settings</Link>
            <a href="qdj://open" className="site-nav-cta-app">
              Open booth app
            </a>
            <button type="button" className="site-nav-btn" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register" className="site-nav-cta">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
