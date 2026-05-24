import { FormEvent, useEffect, useState } from "react";
import { fetchMixComments, postMixComment } from "../lib/accountApi";

interface MixCommentsModalProps {
  mixId: string;
  mixTitle: string;
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
}

export default function MixCommentsModal({
  mixId,
  mixTitle,
  open,
  onClose,
  onPosted,
}: MixCommentsModalProps) {
  const [comments, setComments] = useState<
    Array<{ id: string; body: string; createdAt: string; author: { handle: string; displayName: string } }>
  >([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    void fetchMixComments(mixId)
      .then((d) => setComments(d.comments))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load comments"));
  }, [open, mixId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postMixComment(mixId, body.trim());
      setBody("");
      const d = await fetchMixComments(mixId);
      setComments(d.comments);
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="auth-gate-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Comments</h2>
        <p className="muted small">{mixTitle}</p>
        <ul className="comments-list">
          {comments.map((c) => (
            <li key={c.id}>
              <strong>@{c.author.handle}</strong>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        {comments.length === 0 && !error && <p className="muted">No comments yet.</p>}
        <form onSubmit={onSubmit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            required
          />
          {error && <p className="error">{error}</p>}
          <div className="comments-modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
