/**
 * The 3-option chooser the DJ sees at gig start: local / spotify / both.
 * Lives inside the start-gig modal so it's right where they need it, but the
 * component is self-contained so we can also reuse it in the sidebar settings
 * when the DJ wants to change their answer later.
 */

import type { LibrarySource } from "../lib/libraryProfile";
import { LIBRARY_SOURCE_LABELS } from "../lib/libraryProfile";

const ORDER: LibrarySource[] = ["local", "spotify", "both"];

interface LibraryProfilePickerProps {
  value: LibrarySource | null;
  onChange: (value: LibrarySource) => void;
  /** Show the heading + lead copy. Hide when embedded in a wider settings panel. */
  showHeading?: boolean;
}

export default function LibraryProfilePicker({
  value,
  onChange,
  showHeading = true,
}: LibraryProfilePickerProps) {
  return (
    <div className="library-profile-picker">
      {showHeading && (
        <>
          <p className="welcome-tour-kicker">Library profile</p>
          <h3 className="library-profile-heading">Where do you spin from tonight?</h3>
          <p className="muted library-profile-lead">
            Tell Q how you DJ so it can scope the crowd&apos;s search and the auto-crate right.
            You can change this any time in Settings.
          </p>
        </>
      )}
      <div className="library-profile-options" role="radiogroup" aria-label="Library source">
        {ORDER.map((opt) => {
          const meta = LIBRARY_SOURCE_LABELS[opt];
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`library-profile-option ${selected ? "selected" : ""}`}
              onClick={() => onChange(opt)}
            >
              <span className="library-profile-option-title">{meta.title}</span>
              <span className="library-profile-option-summary muted">{meta.summary}</span>
              <span className="library-profile-radio" aria-hidden>
                {selected ? "●" : "○"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
