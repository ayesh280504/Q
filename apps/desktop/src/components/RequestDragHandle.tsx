import { useEffect, useRef } from "react";
import { bindFileDragPointer } from "../lib/fileDrag";

type Props = {
  localPath: string;
};

/** ⠿ handle on pending request rows — drag local file onto Serato/RB deck. */
export default function RequestDragHandle({ localPath }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !localPath.trim()) return;
    return bindFileDragPointer(el, localPath);
  }, [localPath]);

  return (
    <button
      ref={ref}
      type="button"
      className="drag-handle drag-handle-active"
      title="Drag onto Serato / Rekordbox deck"
    >
      ⠿
    </button>
  );
}
