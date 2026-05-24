import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthGateModal from "../components/AuthGateModal";
import CommunityNav from "../components/CommunityNav";
import DjSocialBar from "../components/DjSocialBar";
import { useAuth } from "../context/AuthContext";
import {
  fetchDjProfile,
  fetchFollowStatus,
  followDj,
  recordMixPlay,
  unfollowDj,
} from "../lib/accountApi";
import type { DjProfilePublic } from "@q/shared";
import "../community.css";

export default function DjProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { signedIn, profile: me } = useAuth();
  const [profile, setProfile] = useState<DjProfilePublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [gateAction, setGateAction] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    fetchDjProfile(handle)
      .then((d) => setProfile(d.profile))
      .catch((e) => setError(e instanceof Error ? e.message : "DJ not found"));
  }, [handle]);

  useEffect(() => {
    if (!handle || !signedIn || !profile) return;
    if (me?.handle === profile.handle) return;
    void fetchFollowStatus(handle)
      .then((d) => setFollowing(d.following))
      .catch(() => setFollowing(false));
  }, [handle, signedIn, profile, me?.handle]);

  const isSelf = me?.handle === profile?.handle;

  async function toggleFollow() {
    if (!handle || !profile) return;
    setFollowBusy(true);
    try {
      const res = following ? await unfollowDj(handle) : await followDj(handle);
      setFollowing(res.following);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  }

  return (
    <div className="community-page">
      <CommunityNav />
      <AuthGateModal
        open={Boolean(gateAction)}
        action={gateAction ?? ""}
        onClose={() => setGateAction(null)}
      />
      <main className="community-main">
        {error && <p className="error">{error}</p>}
        {profile && (
          <>
            <header className="profile-header styled">
              <h1>
                @{profile.handle}
                {profile.verified && <span className="verified"> Verified</span>}
              </h1>
              {profile.bio && <p className="bio">{profile.bio}</p>}
              <DjSocialBar links={profile.socialLinks} />
              {isSelf && (
                <p className="muted small" style={{ marginTop: "0.75rem" }}>
                  <Link to="/settings">Edit profile & socials</Link>
                </p>
              )}
              {!isSelf && (
                <button
                  type="button"
                  className={`btn ${following ? "ghost" : "primary"} follow-btn`}
                  disabled={followBusy}
                  onClick={() =>
                    signedIn
                      ? void toggleFollow()
                      : setGateAction("follow DJs and see their mixes in your feed")
                  }
                >
                  {followBusy ? "…" : following ? "Following" : "Follow"}
                </button>
              )}
            </header>

            <h2 className="section-label">Public mixes</h2>
            <ul className="mix-feed">
              {profile.mixes.map((m) => (
                <li key={m.id} className="mix-card">
                  <h3>{m.title}</h3>
                  {m.description && <p className="mix-desc">{m.description}</p>}
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      void recordMixPlay(m.id).catch(() => {});
                      window.open(m.externalUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Listen · {m.playCount} plays
                  </button>
                </li>
              ))}
            </ul>
            {profile.mixes.length === 0 && (
              <p className="muted">No public mixes yet.</p>
            )}
          </>
        )}
        <p className="back-link">
          <Link to="/community">← Back to feed</Link>
        </p>
      </main>
    </div>
  );
}
