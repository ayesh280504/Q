import { Link } from "react-router-dom";
import QLogo from "./QLogo";

export default function QFooter() {
  return (
    <footer className="mkt-footer">
      <QLogo size={40} className="mkt-footer-logo" />
      <p className="mkt-footer-tag">
        Designed for the dark. Built for the floor.
        <br />
        <Link to="/privacy">Privacy</Link> · © {new Date().getFullYear()} Q
      </p>
    </footer>
  );
}
