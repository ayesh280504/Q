/** Phase 1C — preference until Windows registry autostart is wired in Tauri. */

const STORAGE_KEY = "q-autostart-wanted";

export function loadAutostartWanted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAutostartWanted(wanted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, wanted ? "1" : "0");
  } catch {
    /* ignore */
  }
}
