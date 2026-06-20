import { useEffect, useState } from "react";
import { api } from "../api";

type Props = {
  sessionCode: string;
  displayName: string;
  djHandle?: string;
};

const LABELS = ["Rough", "OK", "Good", "Great", "🔥"] as const;
const MAX_REVIEW = 280;

type DjSummary = {
  tipUrl?: string;
};

/** Post-set rating + optional text review + tip link. */
export default function PostGigRating({ sessionCode, displayName, djHandle }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipUrl, setTipUrl] = useState<string | null>(null);

  const handle = djHandle?.trim().toLowerCase();

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    api<DjSummary>(`/djs/${handle}/summary`)
      .then((data) => {
        if (!cancelled && data.tipUrl?.trim()) setTipUrl(data.tipUrl.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle]);

  async function saveRating(value: number, comment?: string) {
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean; score: number }>(`/sessions/${sessionCode}/rating`, {
        method: "POST",
        body: JSON.stringify({
          score: value,
          ...(comment !== undefined ? { comment: comment.trim() || null } : {}),
        }),
      });
      setScore(value);
      if (comment !== undefined) setReviewSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save rating");
    } finally {
      setBusy(false);
    }
  }

  async function rate(value: number) {
    if (busy || score != null) return;
    await saveRating(value);
  }

  async function submitReview() {
    if (busy || score == null) return;
    const text = review.trim();
    if (!text) return;
    await saveRating(score, text);
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

      {score != null && (
        <div className="post-gig-review">
          <label className="post-gig-review-label" htmlFor="post-gig-review">
            Leave a quick review <span className="post-gig-optional">(optional)</span>
          </label>
          <textarea
            id="post-gig-review"
            className="post-gig-review-input"
            rows={3}
            maxLength={MAX_REVIEW}
            placeholder="What stood out tonight?"
            value={review}
            onChange={(e) => {
              setReview(e.target.value);
              setReviewSaved(false);
            }}
            disabled={busy}
          />
          <div className="post-gig-review-foot">
            <span className="post-gig-review-count">{review.length}/{MAX_REVIEW}</span>
            <button
              type="button"
              className="btn ghost post-gig-review-submit"
              disabled={busy || !review.trim() || reviewSaved}
              onClick={() => void submitReview()}
            >
              {reviewSaved ? "Review sent" : "Send review"}
            </button>
          </div>
        </div>
      )}

      {score != null && tipUrl && (
        <div className="post-gig-tip-block">
          <p className="post-gig-tip-lead">Enjoyed the set? Tip {displayName} directly.</p>
          <a
            className="btn primary post-gig-btn post-gig-tip"
            href={tipUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send a tip →
          </a>
        </div>
      )}

      {error && <p className="post-gig-rating-error">{error}</p>}
    </section>
  );
}
