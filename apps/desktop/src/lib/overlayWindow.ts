/**
 * Helpers to put the booth window into "overlay" mode — a small always-on-top
 * box snapped to the bottom-right of the primary monitor — and to restore the
 * previous size/position when leaving overlay mode.
 *
 * All calls are no-ops outside Tauri so dev mode in the browser still works.
 */

export interface OverlayRestore {
  width: number;
  height: number;
  x: number;
  y: number;
  alwaysOnTop: boolean;
  decorations: boolean;
}

const OVERLAY_WIDTH = 360;
const OVERLAY_HEIGHT = 420;
const SCREEN_MARGIN = 16;
const RESTORE_KEY = "q-overlay-restore-v1";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function saveRestore(r: OverlayRestore) {
  try {
    localStorage.setItem(RESTORE_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
}

function loadRestore(): OverlayRestore | null {
  try {
    const raw = localStorage.getItem(RESTORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OverlayRestore;
  } catch {
    return null;
  }
}

function clearRestore() {
  try {
    localStorage.removeItem(RESTORE_KEY);
  } catch {
    /* ignore */
  }
}

export async function enterOverlayMode(prevPinned: boolean): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow, LogicalSize, LogicalPosition, currentMonitor } = await import(
      "@tauri-apps/api/window"
    );
    const win = getCurrentWindow();

    const sizeBefore = await win.outerSize();
    const posBefore = await win.outerPosition();
    const scale = await win.scaleFactor();
    let decorationsBefore = true;
    try {
      decorationsBefore = await win.isDecorated();
    } catch {
      /* older Tauri runtime — assume true */
    }
    saveRestore({
      width: Math.round(sizeBefore.width / scale),
      height: Math.round(sizeBefore.height / scale),
      x: Math.round(posBefore.x / scale),
      y: Math.round(posBefore.y / scale),
      alwaysOnTop: prevPinned,
      decorations: decorationsBefore,
    });

    // Frameless first so the resize doesn't briefly show the title bar.
    try {
      await win.setDecorations(false);
    } catch {
      /* setDecorations not permitted — fall back to framed overlay */
    }
    await win.setSize(new LogicalSize(OVERLAY_WIDTH, OVERLAY_HEIGHT));
    await win.setAlwaysOnTop(true);

    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const mScale = monitor.scaleFactor;
        const monW = monitor.size.width / mScale;
        const monH = monitor.size.height / mScale;
        const monX = monitor.position.x / mScale;
        const monY = monitor.position.y / mScale;
        const x = Math.round(monX + monW - OVERLAY_WIDTH - SCREEN_MARGIN);
        const y = Math.round(monY + monH - OVERLAY_HEIGHT - SCREEN_MARGIN);
        await win.setPosition(new LogicalPosition(x, y));
      }
    } catch {
      /* monitor lookup is best-effort */
    }
  } catch (err) {
    console.error("enterOverlayMode failed", err);
  }
}

export async function exitOverlayMode(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow, LogicalSize, LogicalPosition } = await import(
      "@tauri-apps/api/window"
    );
    const win = getCurrentWindow();
    const r = loadRestore();
    if (r) {
      try {
        await win.setDecorations(r.decorations);
      } catch {
        /* ignore */
      }
      await win.setSize(new LogicalSize(r.width, r.height));
      await win.setPosition(new LogicalPosition(r.x, r.y));
      await win.setAlwaysOnTop(r.alwaysOnTop);
      clearRestore();
    } else {
      try {
        await win.setDecorations(true);
      } catch {
        /* ignore */
      }
      await win.setAlwaysOnTop(false);
    }
  } catch (err) {
    console.error("exitOverlayMode failed", err);
  }
}

let focusGuardUnlisten: (() => void) | null = null;

/**
 * Re-applies `setAlwaysOnTop(true)` whenever the booth window loses focus.
 *
 * Windows reliably honors `HWND_TOPMOST`, but some apps (Serato in
 * full-screen-ish layouts, full-screen browsers, etc.) can momentarily steal
 * the top spot when they activate. Re-asserting on every blur event keeps the
 * Q overlay glued to the foreground while the DJ clicks back into Serato.
 *
 * Returns a function that disables the guard. Safe to call multiple times —
 * the previous guard is detached before a new one is attached.
 */
export async function startAlwaysOnTopGuard(): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    if (focusGuardUnlisten) {
      focusGuardUnlisten();
      focusGuardUnlisten = null;
    }
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    const unlisten = await win.onFocusChanged(({ payload: focused }) => {
      if (focused) return;
      void win.setAlwaysOnTop(true).catch(() => {
        /* permission denied or window gone — nothing to do */
      });
    });
    focusGuardUnlisten = unlisten;
    return () => {
      try {
        unlisten();
      } catch {
        /* ignore */
      }
      if (focusGuardUnlisten === unlisten) focusGuardUnlisten = null;
    };
  } catch (err) {
    console.error("startAlwaysOnTopGuard failed", err);
    return () => {};
  }
}

export function stopAlwaysOnTopGuard() {
  if (focusGuardUnlisten) {
    try {
      focusGuardUnlisten();
    } catch {
      /* ignore */
    }
    focusGuardUnlisten = null;
  }
}
