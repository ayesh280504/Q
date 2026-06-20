import { useEffect, useState } from "react";
import { api } from "../api";
import type { PublicWallRequest } from "@q/shared";

interface PublicWallProps {
  sessionCode: string;
}

export default function PublicWall({ sessionCode }: PublicWallProps) {
  const [enabled, setEnabled] = useState(false);
  const [requests, setRequests] = useState<PublicWallRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api<{ enabled: boolean; requests: PublicWallRequest[] }>(
          `/sessions/${sessionCode}/wall`,
        );
        if (cancelled) return;
        setEnabled(data.enabled);
        setRequests(data.requests);
      } catch {
        /* wall optional */
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionCode]);

  if (!enabled || requests.length === 0) return null;

  return (
    <section className="public-wall" aria-label="Live request wall">
      <h2 className="public-wall-title">Live wall</h2>
      <p className="sub public-wall-hint">What the room is asking for right now.</p>
      <ul className="public-wall-list">
        {requests.map((r) => (
          <li key={r.id} className={`public-wall-item public-wall-item--${r.status}`}>
            <div className="public-wall-track">
              <strong>{r.title}</strong>
              <span>{r.artist}</span>
              {r.bpm ? <span className="public-wall-meta">{r.bpm} BPM</span> : null}
              {r.key ? <span className="public-wall-meta">{r.key}</span> : null}
            </div>
            {r.message && <p className="public-wall-note">&ldquo;{r.message}&rdquo;</p>}
            <span className="public-wall-status">
              {r.status === "accepted" ? "In queue" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
