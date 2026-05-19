import { Link } from "react-router-dom";
import QLogo from "./QLogo";
import { useAuth } from "../context/AuthContext";

export default function CommunityNav() {
  const { signedIn, profile, signOut } = useAuth();

  return (
    <header className="community-nav">
      <Link to="/" className="logo">
        <QLogo size={30} />
      </Link>
      <nav>
        <Link to="/community">Mix feed</Link>
        {signedIn ? (
          <>
            <Link to="/studio">My studio</Link>
            {profile && (
              <Link to={`/dj/${profile.handle}`} className="nav-handle">
                @{profile.handle}
              </Link>
            )}
            <button type="button" className="btn-link-nav" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login">Sign in</Link>
        )}
        <Link to="/#download">Download app</Link>
      </nav>
    </header>
  );
}
