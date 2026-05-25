/**
 * Tauri auto-updater wrapper.
 *
 * On startup the booth app calls `checkForUpdate()`. If a newer release is
 * available, `onAvailable` fires with the new version + release notes. The
 * caller decides when to install (we never force-relaunch silently).
 *
 * All calls are no-ops outside of the Tauri shell so browser dev mode keeps
 * working.
 */

export interface AvailableUpdate {
  version: string;
  notes?: string;
  /** ISO date the new release was published, if known. */
  date?: string;
}

const SUPPRESS_KEY = "q-update-suppress-until-v";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Map a semver string into a comparable tuple of numbers. */
function toTuple(v: string): number[] {
  return v
    .replace(/^v/, "")
    .split(/[.\-+]/)
    .map((part) => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

function isNewer(remote: string, local: string): boolean {
  const a = toTuple(remote);
  const b = toTuple(local);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

interface CheckOptions {
  /** Called when an update exists and the user hasn't suppressed it. */
  onAvailable: (info: AvailableUpdate, install: () => Promise<void>) => void;
  /** Called when no update or the check failed silently. */
  onNone?: () => void;
}

export async function checkForUpdate({ onAvailable, onNone }: CheckOptions): Promise<void> {
  if (!isTauri()) {
    onNone?.();
    return;
  }
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update || !update.available) {
      onNone?.();
      return;
    }
    // The plugin already compares versions, but double-check just in case
    // the manifest is misconfigured.
    if (update.currentVersion && !isNewer(update.version, update.currentVersion)) {
      onNone?.();
      return;
    }
    const suppressed = localStorage.getItem(SUPPRESS_KEY);
    if (suppressed && suppressed === update.version) {
      onNone?.();
      return;
    }

    const install = async () => {
      // Download + install. The plugin verifies the signature internally.
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    };

    onAvailable(
      {
        version: update.version,
        notes: update.body || undefined,
        date: update.date ?? undefined,
      },
      install,
    );
  } catch (err) {
    console.warn("update check failed", err);
    onNone?.();
  }
}

/** Remember the user's "skip this version" choice. */
export function suppressVersion(version: string): void {
  try {
    localStorage.setItem(SUPPRESS_KEY, version);
  } catch {
    /* ignore */
  }
}
