import { bpmColor, keyColor, toCamelot } from "../lib/trackColors";

interface TrackMetaProps {
  bpm?: number | null;
  musicalKey?: string | null;
  /** Smaller variant for tight spaces (overlay rows). */
  compact?: boolean;
}

/**
 * Glowing colored BPM + key pills, Serato/Mixed-In-Key style.
 * Key pills show Camelot notation when we can map it (e.g. "8A") and tint
 * the pill to the corresponding Camelot wheel color.
 */
export default function TrackMeta({ bpm, musicalKey, compact }: TrackMetaProps) {
  if (bpm == null && !musicalKey) return null;

  const sizeClass = compact ? "track-pill track-pill-sm" : "track-pill";

  return (
    <div className={`track-pills ${compact ? "track-pills-sm" : ""}`}>
      {bpm != null && Number.isFinite(bpm) && (
        <span
          className={`${sizeClass} pill-bpm`}
          style={
            {
              "--pill-color": bpmColor(bpm),
            } as React.CSSProperties
          }
          title={`${Math.round(bpm)} BPM`}
        >
          {Math.round(bpm)}
        </span>
      )}
      {musicalKey && (
        <span
          className={`${sizeClass} pill-key`}
          style={
            {
              "--pill-color": keyColor(musicalKey),
            } as React.CSSProperties
          }
          title={`Key: ${musicalKey}${toCamelot(musicalKey) ? ` (${toCamelot(musicalKey)})` : ""}`}
        >
          {toCamelot(musicalKey) ?? musicalKey}
        </span>
      )}
    </div>
  );
}
