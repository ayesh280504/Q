/**
 * Native OS file drag — drop tracks onto Serato / Rekordbox decks.
 * No Serato API required; uses the same mechanism as Banger Button.
 */

const DRAG_THRESHOLD_PX = 5;

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function startFileDrag(localPath: string): Promise<void> {
  const path = localPath.trim();
  if (!path) throw new Error("No local file path for this track.");
  if (!isTauri()) {
    throw new Error("Drag-to-deck works in the installed Q booth app.");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("start_file_drag", { path });
}

export function canDragToDeck(localPath?: string | null): boolean {
  return Boolean(localPath?.trim()) && isTauri();
}

/** Start native drag after a small pointer move (Windows-friendly). */
export function bindFileDragPointer(
  el: HTMLElement,
  localPath: string,
  onError?: (message: string) => void,
): () => void {
  let startX = 0;
  let startY = 0;
  let dragging = false;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || !localPath.trim()) return;
    e.preventDefault();
    dragging = false;
    startX = e.clientX;
    startY = e.clientY;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragging || !el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragging = true;
    el.releasePointerCapture(e.pointerId);
    void startFileDrag(localPath).catch((err) => {
      onError?.(err instanceof Error ? err.message : "Drag failed");
    });
  };

  const onPointerUp = (e: PointerEvent) => {
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
  };
}
