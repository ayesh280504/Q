/**
 * Shared helper for opening external URLs in the OS default browser.
 *
 * Tauri 2 silently drops `<a target="_blank">` and `window.open()` inside its
 * WebView. The opener plugin is the supported way to hand a URL to the OS so
 * the user's actual browser (Chrome / Edge / Safari / Firefox) opens it.
 * Falls back to `window.open` for the browser-dev build where Tauri isn't
 * present.
 */
export async function openExternal(url: string): Promise<void> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch (err) {
      // Fall through to window.open() — if even the opener plugin failed,
      // there's nothing else to do besides log it.
      console.warn("openUrl failed, falling back to window.open:", err);
    }
  }
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    /* ignore */
  }
}
