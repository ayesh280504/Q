import { useState, type KeyboardEvent } from "react";
import type { PrivacyFilters } from "../lib/privacyFilter";

interface PrivacyFiltersPanelProps {
  filters: PrivacyFilters;
  onChange: (next: PrivacyFilters) => void;
  privateCount?: number;
}

export default function PrivacyFiltersPanel({
  filters,
  onChange,
  privateCount,
}: PrivacyFiltersPanelProps) {
  const [keywordDraft, setKeywordDraft] = useState("");
  const [crateDraft, setCrateDraft] = useState("");

  function addKeyword() {
    const k = keywordDraft.trim();
    if (!k) return;
    if (filters.keywords.some((x) => x.toLowerCase() === k.toLowerCase())) {
      setKeywordDraft("");
      return;
    }
    onChange({ ...filters, keywords: [...filters.keywords, k] });
    setKeywordDraft("");
  }

  function removeKeyword(k: string) {
    onChange({ ...filters, keywords: filters.keywords.filter((x) => x !== k) });
  }

  function addCrate() {
    const c = crateDraft.trim();
    if (!c) return;
    if (filters.crates.some((x) => x.toLowerCase() === c.toLowerCase())) {
      setCrateDraft("");
      return;
    }
    onChange({ ...filters, crates: [...filters.crates, c] });
    setCrateDraft("");
  }

  function removeCrate(c: string) {
    onChange({ ...filters, crates: filters.crates.filter((x) => x !== c) });
  }

  function onEnter(e: KeyboardEvent<HTMLInputElement>, action: () => void) {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  }

  return (
    <details className="privacy-panel">
      <summary>
        Private tracks
        {typeof privateCount === "number" && privateCount > 0 && (
          <span className="privacy-count"> · {privateCount} hidden</span>
        )}
      </summary>

      <p className="muted small privacy-help">
        Hidden tracks stay on your laptop and are never uploaded for crowd search. Track
        names the crowd <em>does</em> see are auto-cleaned (e.g. <code>Starships (Dirty Intro)</code>
        → <code>Starships</code>) so version tags don't leak into the audience UI.
      </p>

      <label className="privacy-label">
        Hide by keyword
        <div className="privacy-input-row">
          <input
            className="privacy-input"
            placeholder="VIP, edit, ID, unreleased…"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={(e) => onEnter(e, addKeyword)}
          />
          <button type="button" className="btn-top" onClick={addKeyword}>
            Add
          </button>
        </div>
      </label>

      <ul className="privacy-chips">
        {filters.keywords.map((k) => (
          <li key={k} className="privacy-chip">
            <span>{k}</span>
            <button
              type="button"
              className="privacy-chip-x"
              onClick={() => removeKeyword(k)}
              aria-label={`Remove ${k}`}
            >
              ✕
            </button>
          </li>
        ))}
        {filters.keywords.length === 0 && (
          <li className="muted small">No keywords yet.</li>
        )}
      </ul>

      <label className="privacy-label">
        Hide entire Serato crate (matches filename)
        <div className="privacy-input-row">
          <input
            className="privacy-input"
            placeholder="e.g. VIPs, Edits, Unreleased"
            value={crateDraft}
            onChange={(e) => setCrateDraft(e.target.value)}
            onKeyDown={(e) => onEnter(e, addCrate)}
          />
          <button type="button" className="btn-top" onClick={addCrate}>
            Add
          </button>
        </div>
      </label>

      <ul className="privacy-chips">
        {filters.crates.map((c) => (
          <li key={c} className="privacy-chip">
            <span>{c}</span>
            <button
              type="button"
              className="privacy-chip-x"
              onClick={() => removeCrate(c)}
              aria-label={`Remove ${c}`}
            >
              ✕
            </button>
          </li>
        ))}
        {filters.crates.length === 0 && (
          <li className="muted small">No crate filters.</li>
        )}
      </ul>

      <label className="privacy-checkbox">
        <input
          type="checkbox"
          checked={filters.hideMashups}
          onChange={(e) => onChange({ ...filters, hideMashups: e.target.checked })}
        />
        Auto-hide mashups (e.g. “Starships x Domino”)
      </label>

      <label className="privacy-checkbox">
        <input
          type="checkbox"
          checked={filters.hideUnknown}
          onChange={(e) => onChange({ ...filters, hideUnknown: e.target.checked })}
        />
        Also hide tracks titled “ID” or “Unknown”
      </label>

      <p className="muted small privacy-help">
        Changes apply the next time you <strong>Auto-import</strong> or pick a file. Re-import
        to refresh the crowd search index.
      </p>
    </details>
  );
}
