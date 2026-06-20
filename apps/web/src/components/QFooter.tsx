import { Link } from "react-router-dom";
import QLogo from "./QLogo";

export default function QFooter() {
  return (
    <footer className="mkt-footer">
      <QLogo size={40} className="mkt-footer-logo" />
      <nav className="mkt-footer-links" aria-label="Footer">
        <Link to="/features">Features</Link>
        <Link to="/integrations">Integrations</Link>
        <Link to="/for-djs">For DJs</Link>
        <Link to="/for-crowd">For crowd</Link>
        <Link to="/download">Download</Link>
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <a href="mailto:ayesh2805@outlook.com">Contact</a>
      </nav>
      <p className="mkt-footer-tag">
        Designed for the dark. Built for the floor.
        <br />
        © {new Date().getFullYear()} Q
      </p>
    </footer>
  );
}
