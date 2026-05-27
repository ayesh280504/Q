import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type DjSoftwareStatus = {
  serato: boolean;
  rekordbox: boolean;
  any_running: boolean;
};

/** Polls Windows tasklist for Serato / Rekordbox (Phase 1C). */
export function useDjSoftwareSentinel(enabled: boolean, intervalMs = 5000) {
  const [status, setStatus] = useState<DjSoftwareStatus | null>(null);

  useEffect(() => {
    if (!enabled || !("__TAURI_INTERNALS__" in window)) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const next = await invoke<DjSoftwareStatus>("detect_dj_software_running");
        if (!cancelled) setStatus(next);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };

    void tick();
    const id = setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, intervalMs]);

  return status;
}
