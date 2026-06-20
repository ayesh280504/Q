import { useEffect, useState } from "react";
import type { DjSocialLinks } from "@q/shared";
import { api } from "../api";
import { webBase, crowdLoginUrl, crowdRegisterUrl } from "../lib/webUrl";
import DjSocialIcons from "./DjSocialIcons";

type Props = {
  displayName: string;
  handle?: string;
  /** Set ended when the guest was on a live request page; offline for permanent QR. */
  variant?: "ended" | "offline";
};

type DjSummary = {
  handle: string;
  displayName: string;
  socialLinks?: DjSocialLinks;
  gigRatings?: { averageScore: number; ratingCount: number };
};

/** Post-gig conversion — follow DJ + optional tip + account. Never shown during active requests. */
export default function PostGigCta({ displayName, handle, variant = "offline" }: Props) {
  const djHandle = handle?.trim().toLowerCase();
  const [summary, setSummary] = useState<DjSummary | null>(null);

  useEffect(() => {
    if (!djHandle) return;
    let cancelled = false;
    api<DjSummary>(`/djs/${djHandle}/summary`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, [djHandle]);

  const registerUrl = crowdRegisterUrl(djHandle);
  const loginUrl = crowdLoginUrl(djHandle);
  const downloadUrl = `${webBase()}/download`;

  const lead =
    variant === "ended"
      ? `Thanks for being in the booth with ${displayName}.`
      : `${displayName} isn't taking requests right now.`;

  return (
    <section className="post-gig-cta" aria-labelledby="post-gig-heading">
      <h2 id="post-gig-heading" className="post-gig-title">
        {variant === "ended" ? "Set's over" : "Come back later"}
      </h2>
      <p className="post-gig-lead">{lead}</p>
      {summary?.gigRatings && summary.gigRatings.ratingCount > 0 && (
        <p className="post-gig-rating-note">
          Crowd rating: <strong>{summary.gigRatings.averageScore.toFixed(1)}/5</strong> from{" "}
          {summary.gigRatings.ratingCount} set{summary.gigRatings.ratingCount !== 1 ? "s" : ""}
        </p>
      )}
      {djHandle ? (
        <p className="post-gig-follow-copy">
          Follow <strong>@{djHandle}</strong> to get notified when they&apos;re live again.
        </p>
      ) : (
        <p className="post-gig-follow-copy">
          Create a free account to follow DJs and see when they&apos;re taking requests.
        </p>
      )}

      <DjSocialIcons
        links={summary?.socialLinks}
        heading={variant === "ended" ? `Follow ${displayName} on` : "Find them on"}
      />

      <div className="post-gig-actions">
        <a className="btn primary post-gig-btn" href={registerUrl}>
          Create free account
        </a>
        <a className="btn ghost post-gig-btn" href={loginUrl}>
          Sign in
        </a>
      </div>

      <p className="post-gig-secondary">
        DJs use the{" "}
        <a href={downloadUrl} className="post-gig-link">
          Q booth app
        </a>{" "}
        on their laptop. Guests request from this page — no app needed.
      </p>
    </section>
  );
}
