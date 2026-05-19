import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CommunityNav from "../components/CommunityNav";
import { fetchDjProfile, recordMixPlay } from "../lib/accountApi";
import type { DjProfilePublic } from "@q/shared";
import "../community.css";

export default function DjProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<DjProfilePublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    fetchDjProfile(handle)
      .then((d) => setProfile(d.profile))
      .catch((e) => setError(e instanceof Error ? e.message : "DJ not found"));
  }, [handle]);

  return (
    <div className="community-page">
      <CommunityNav />
      <main className="community-main">
        {error && <p className="error">{error}</p>}
        {profile && (
          <>
            <header className="profile-header">
              <h1>
                {profile.displayName}
                {profile.verified && <span className="verified"> Verified</span>}
              </h1>
              <p className="handle">@{profile.handle}</p>
              {profile.bio && <p className="bio">{profile.bio}</p>}
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
