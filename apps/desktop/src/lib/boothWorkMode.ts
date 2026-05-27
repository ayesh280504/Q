/** Whether the booth auto-polls for crowd requests or stays local-only until manual sync. */

export type BoothWorkMode = "crowd" | "booth";

const STORAGE_KEY = "q-booth-work-mode";

export const BOOTH_WORK_MODE_META: Record<
  BoothWorkMode,
  { label: string; hint: string }
> = {
  crowd: {
    label: "Crowd live",
    hint: "Background sync for guest requests (recommended when QR is out)",
  },
  booth: {
    label: "Booth only",
    hint: "No auto-polling — library tools and manual Sync only",
  },
};

export function loadBoothWorkMode(): BoothWorkMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "crowd" || raw === "booth") return raw;
  } catch {
    /* ignore */
  }
  return "crowd";
}

export function saveBoothWorkMode(mode: BoothWorkMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
