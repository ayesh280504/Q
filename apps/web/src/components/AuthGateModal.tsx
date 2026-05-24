import { Link } from "react-router-dom";

interface AuthGateModalProps {
  open: boolean;
  action: string;
  onClose: () => void;
}

/** Shown when a logged-out user tries like, comment, save, or follow. */
export default function AuthGateModal({ open, action, onClose }: AuthGateModalProps) {
  if (!open) return null;

  return (
    <div className="auth-gate-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-gate-card" onClick={(e) => e.stopPropagation()}>
        <h2>Create an account</h2>
        <p className="muted">
          Sign up free to {action}. You can still browse popular mixes without an account.
        </p>
        <div className="auth-gate-actions">
          <Link to="/register" className="btn primary" onClick={onClose}>
            Sign up
          </Link>
          <Link to="/login" className="btn ghost" onClick={onClose}>
            Sign in
          </Link>
          <button type="button" className="btn ghost" onClick={onClose}>
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
