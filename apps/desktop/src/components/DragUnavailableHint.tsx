type Props = {
  reason?: "no-import" | "not-in-crate";
};

/** Muted drag affordance when the local file path is unavailable. */
export default function DragUnavailableHint({ reason = "not-in-crate" }: Props) {
  const title =
    reason === "no-import"
      ? "Import your Serato/Rekordbox library to enable drag-to-deck"
      : "Track not in tonight's import — re-import crate or accept anyway";

  return (
    <span className="drag-handle drag-handle-muted" title={title} aria-label={title}>
      ⠿
    </span>
  );
}
