import { useMemo, useState } from "react";
import type { CrateSelection } from "../lib/crateSelection";

export interface CrateOption {
  /** Stable id (file path or playlist path). */
  id: string;
  /** Display name. */
  name: string;
  /** Optional track count for the chip. */
  trackCount?: number;
}

interface CrateSelectionPanelProps {
  /** Software label used in the heading. */
  softwareLabel: "Serato" | "Rekordbox";
  /** Plural "crates" / "playlists" — UI label. */
  unitsLabel: "crates" | "playlists";
  options: CrateOption[];
  selection: CrateSelection;
  onChange: (next: CrateSelection) => void;
  /** Called when the DJ taps "Re-import with these". */
  onReimport?: () => void;
  busy?: boolean;
}

export default function CrateSelectionPanel({
  softwareLabel,
  unitsLabel,
  options,
  selection,
  onChange,
  onReimport,
  busy,
}: CrateSelectionPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const totalTracks = useMemo(
    () => options.reduce((s, o) => s + (o.trackCount ?? 0), 0),
    [options],
  );
  const activeTracks = useMemo(() => {
    if (selection.useAll) return totalTracks;
    return options
      .filter((o) => selection.selected.includes(o.id))
      .reduce((s, o) => s + (o.trackCount ?? 0), 0);
  }, [options, selection, totalTracks]);

  const selectedCount = selection.useAll ? options.length : selection.selected.length;

  function toggle(id: string) {
    if (selection.useAll) {
      // Switching from "all" to a custom set — start with everything checked
      // except the one being toggled off.
      const next = options.map((o) => o.id).filter((x) => x !== id);
      onChange({ useAll: false, selected: next });
      return;
    }
    const isOn = selection.selected.includes(id);
    const next = isOn
      ? selection.selected.filter((x) => x !== id)
      : [...selection.selected, id];
    onChange({ useAll: false, selected: next });
  }

  function setAll(on: boolean) {
    if (on) {
      onChange({ useAll: true, selected: [] });
    } else {
      onChange({ useAll: false, selected: [] });
    }
  }

  const summary = selection.useAll
    ? `All ${options.length} ${unitsLabel}`
    : `${selectedCount} of ${options.length} ${unitsLabel}`;

  return (
    <details className="crate-panel">
      <summary>
        Active {unitsLabel}
        <span className="crate-summary"> · {summary}</span>
      </summary>

      <p className="muted small crate-help">
        Pick which {softwareLabel} {unitsLabel} the crowd can request tonight.
        Tracks not in a selected {unitsLabel.slice(0, -1)} are skipped on import.
        Saved between gigs.
      </p>

      <div className="crate-input-row">
        <input
          className="privacy-input"
          placeholder={`Filter ${unitsLabel}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="btn-top" onClick={() => setAll(true)}>
          All
        </button>
        <button type="button" className="btn-top" onClick={() => setAll(false)}>
          None
        </button>
      </div>

      <p className="muted small crate-meta">
        {activeTracks.toLocaleString()} of {totalTracks.toLocaleString()} tracks selected
      </p>

      <ul className="crate-list">
        {filtered.length === 0 && (
          <li className="muted small">No {unitsLabel} match “{query}”.</li>
        )}
        {filtered.map((o) => {
          const checked = selection.useAll || selection.selected.includes(o.id);
          return (
            <li key={o.id} className="crate-row">
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.id)}
                />
                <span className="crate-name" title={o.name}>
                  {o.name}
                </span>
                {o.trackCount != null && (
                  <span className="crate-count">{o.trackCount}</span>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      {onReimport && (
        <button
          type="button"
          className="btn ghost crate-reimport"
          onClick={onReimport}
          disabled={busy}
        >
          Re-import with these {unitsLabel}
        </button>
      )}
    </details>
  );
}
