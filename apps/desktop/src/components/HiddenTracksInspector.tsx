import type { TrackRecord } from "@q/shared";

export interface HiddenTrackEntry {
  track: TrackRecord;
  /** Group label, e.g. "Keyword: VIP" / "Crate: Unreleased" / "Mashup pattern". */
  reason: string;
}

interface HiddenTracksInspectorProps {
  open: boolean;
  title: string;
  entries: HiddenTrackEntry[];
  /** When set, shows the "Allow once for this gig" button per row. */
  onAllowOnce?: (externalId: string) => void;
  /** Which tracks have been allow-listed for this gig (so we hide the button). */
  allowed?: Set<string>;
  onClose: () => void;
  /** Optional empty-state subtitle. */
  emptyMessage?: string;
}

export default function HiddenTracksInspector({
  open,
  title,
  entries,
  onAllowOnce,
  allowed,
  onClose,
  emptyMessage,
}: HiddenTracksInspectorProps) {
  if (!open) return null;

  const groups = new Map<string, HiddenTrackEntry[]>();
  for (const e of entries) {
    if (!groups.has(e.reason)) groups.set(e.reason, []);
    groups.get(e.reason)!.push(e);
  }
  const orderedReasons = Array.from(groups.keys()).sort();

  return (
    <div className="inspector-backdrop" onClick={onClose}>
      <div
        className="inspector-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="inspector-header">
          <div>
            <h2>{title}</h2>
            <p className="muted small">
              {entries.length === 0
                ? (emptyMessage ?? "Nothing hidden from this import.")
                : `${entries.length} track${entries.length === 1 ? "" : "s"} hidden from the crowd's search.`}
            </p>
          </div>
          <button type="button" className="btn-top" onClick={onClose}>
            Close
          </button>
        </header>

        {entries.length === 0 ? (
          <p className="muted inspector-empty">
            Re-import your library after adjusting filters and reopen this panel.
          </p>
        ) : (
          <div className="inspector-body">
            {orderedReasons.map((reason) => (
              <section key={reason} className="inspector-group">
                <h3 className="inspector-group-title">
                  {reason}
                  <span className="muted small"> · {groups.get(reason)!.length}</span>
                </h3>
                <ul className="inspector-list">
                  {groups.get(reason)!.map((entry, i) => {
                    const allowedHere = allowed?.has(entry.track.externalId);
                    return (
                      <li key={`${entry.track.externalId}-${i}`} className="inspector-row">
                        <div className="inspector-track">
                          <strong>{entry.track.title}</strong>
                          <span className="muted small">
                            {entry.track.artist}
                            {entry.track.bpm != null && ` · ${entry.track.bpm} BPM`}
                            {entry.track.key && ` · ${entry.track.key}`}
                          </span>
                        </div>
                        {onAllowOnce && (
                          <button
                            type="button"
                            className={`btn-top ${allowedHere ? "active" : ""}`}
                            onClick={() => onAllowOnce(entry.track.externalId)}
                            disabled={allowedHere}
                            title="Allow once — only for this gig"
                          >
                            {allowedHere ? "Allowed" : "Allow once"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
