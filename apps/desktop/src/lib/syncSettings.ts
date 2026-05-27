/** How often the booth polls for new crowd requests while online. */

export type SyncPollPreset = "fast" | "normal" | "slow";

const STORAGE_KEY = "q-sync-poll-preset";

const PRESETS: Record<SyncPollPreset, { label: string; ms: number; hint: string }> = {
  fast: {
    label: "Fast (4s)",
    ms: 4_000,
    hint: "Dev / strong hotspot only — more network traffic",
  },
  normal: {
    label: "Normal (15s)",
    ms: 15_000,
    hint: "Recommended at gigs — gentle on CPU and Wi‑Fi",
  },
  slow: {
    label: "Slow (30s)",
    ms: 30_000,
    hint: "Weak signal — requests may arrive in bursts",
  },
};

export function loadSyncPollPreset(): SyncPollPreset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "fast" || raw === "normal" || raw === "slow") return raw;
  } catch {
    /* ignore */
  }
  return "normal";
}

export function saveSyncPollPreset(preset: SyncPollPreset) {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    /* ignore */
  }
}

export function syncPollIntervalMs(preset: SyncPollPreset = loadSyncPollPreset()): number {
  return PRESETS[preset].ms;
}

export function syncPollPresetMeta(preset: SyncPollPreset) {
  return PRESETS[preset];
}

export const SYNC_POLL_PRESETS: SyncPollPreset[] = ["fast", "normal", "slow"];
