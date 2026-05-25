import type { CrowdRequest } from "@q/shared";
import QLogo from "./QLogo";
import TrackMeta from "./TrackMeta";

export interface OverlayDockQueueItem {
  requestId: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  playedEarlierTonight?: boolean;
}

interface OverlayDockProps {
  gigCode: string;
  gigDisplayName?: string;
  pending: CrowdRequest[];
  queue: OverlayDockQueueItem[];
  pendingPulse: boolean;
  online: boolean;
  busy: boolean;
  pinned: boolean;
  djSoftware: "rekordbox" | "serato";
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onPlayed: (item: OverlayDockQueueItem) => void;
  onSync: () => void;
  onTogglePin: () => void;
  onExpand: () => void;
}

export default function OverlayDock({
  gigCode,
  gigDisplayName,
  pending,
  queue,
  pendingPulse,
  online,
  busy,
  pinned,
  djSoftware,
  onAccept,
  onDecline,
  onPlayed,
  onSync,
  onTogglePin,
  onExpand,
}: OverlayDockProps) {
  return (
    <div className="overlay-shell" data-tauri-drag-region>
      <header className="overlay-header" data-tauri-drag-region>
        <QLogo size={20} className="overlay-brand" />
        <div className="overlay-meta" data-tauri-drag-region>
          <strong>{gigCode}</strong>
          {gigDisplayName && <span className="overlay-djname">{gigDisplayName}</span>}
        </div>
        <div className="overlay-actions">
          <button
            type="button"
            className="overlay-btn"
            onClick={onSync}
            disabled={busy || !online}
            title="Sync"
          >
            ↻
          </button>
          <button
            type="button"
            className={`overlay-btn ${pinned ? "overlay-btn-on" : ""}`}
            onClick={onTogglePin}
            title={pinned ? "Unpin" : "Pin"}
          >
            📌
          </button>
          <button
            type="button"
            className="overlay-btn"
            onClick={onExpand}
            title="Expand to full view"
          >
            ⤢
          </button>
        </div>
      </header>

      <section className="overlay-section">
        <div className="overlay-section-head">
          <h3>Requests</h3>
          {pending.length > 0 && (
            <span className={`overlay-count ${pendingPulse ? "pulse" : ""}`}>
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="overlay-empty">No pending requests.</p>
        ) : (
          <ul className="overlay-list">
            {pending.map((r) => (
              <li key={r.id} className="overlay-request">
                <div className="overlay-track">
                  <div className="overlay-track-head">
                    <strong title={r.title}>{r.title}</strong>
                    <TrackMeta bpm={r.bpm} musicalKey={r.key} compact />
                  </div>
                  <span className="overlay-track-meta" title={r.artist}>
                    {r.artist}
                  </span>
                  {r.playedEarlierTonight && (
                    <span className="overlay-badge">Played earlier</span>
                  )}
                </div>
                <div className="overlay-row-actions">
                  <button
                    type="button"
                    className="overlay-btn overlay-btn-good"
                    disabled={busy}
                    onClick={() => onAccept(r.id)}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="overlay-btn overlay-btn-bad"
                    disabled={busy}
                    onClick={() => onDecline(r.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overlay-section overlay-section-queue">
        <div className="overlay-section-head">
          <h3>Queue</h3>
          {queue.length > 0 && <span className="overlay-count">{queue.length}</span>}
        </div>
        {queue.length === 0 ? (
          <p className="overlay-empty">Empty — accept a request above.</p>
        ) : (
          <ul className="overlay-list">
            {queue.map((item) => (
              <li key={item.requestId} className="overlay-queue-item">
                <div className="overlay-track">
                  <div className="overlay-track-head">
                    <strong title={item.title}>{item.title}</strong>
                    <TrackMeta bpm={item.bpm} musicalKey={item.key} compact />
                  </div>
                  <span className="overlay-track-meta">{item.artist}</span>
                </div>
                <button
                  type="button"
                  className="overlay-btn"
                  onClick={() => onPlayed(item)}
                  title={
                    djSoftware === "rekordbox"
                      ? "Mark as now playing"
                      : "Remove (auto-detect missed)"
                  }
                >
                  {djSoftware === "rekordbox" ? "▶" : "✕"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className={`overlay-footer ${online ? "online" : "offline"}`}>
        {online ? "Online · auto-syncing" : "Offline · queued locally"}
      </footer>
    </div>
  );
}
