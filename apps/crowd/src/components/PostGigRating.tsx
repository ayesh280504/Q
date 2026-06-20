import { useState } from "react";
import { api } from "../api";

type Props = {
  sessionCode: string;
  displayName: string;
};

const LABELS = ["Rough", "OK", "Good", "Great", "🔥"] as const;

/** One-tap post-set rating (stored per guest per gig). */
export default function PostGigRating({ sessionCode, displayName }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rate(value: number) {
    if (busy || score != null) return;
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean; score: number }>(`/sessions/${sessionCode}/rating`, {
        method: "POST",
        body: JSON.stringify({ score: value }),
      });
      setScore(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save rating");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="post-gig-rating" aria-labelledby="post-gig-rating-heading">
      <h2 id="post-gig-rating-heading" className="post-gig-rating-title">
        How was the music?
      </h2>
      <p className="post-gig-rating-lead">
        Quick rating for <strong>{displayName}</strong> — optional, one tap.
      </p>

      {score != null ? (
        <p className="post-gig-rating-thanks" role="status">
          Thanks — you rated this set {score}/5.
        </p>
      ) : (
        <div className="post-gig-rating-row" role="group" aria-label="Rate the set 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="post-gig-rating-btn"
              disabled={busy}
              onClick={() => void rate(n)}
              title={LABELS[n - 1]}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      {error && <p className="post-gig-rating-error">{error}</p>}
    </section>
  );
}
