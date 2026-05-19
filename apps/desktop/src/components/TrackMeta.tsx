/** BPM + musical key chips for now playing / queue rows. */
export default function TrackMeta({
  bpm,
  musicalKey,
}: {
  bpm?: number;
  musicalKey?: string;
}) {
  if (!bpm && !musicalKey) return null;

  return (
    <div className="track-meta">
      {bpm != null && <span className="meta-chip meta-bpm">{Math.round(bpm)} BPM</span>}
      {musicalKey && <span className="meta-chip meta-key">{musicalKey}</span>}
    </div>
  );
}
