export type DjSoftware = "rekordbox" | "serato";

const STORAGE_KEY = "q-dj-software";

export function loadDjSoftware(): DjSoftware {
  try {
    return localStorage.getItem(STORAGE_KEY) === "serato" ? "serato" : "rekordbox";
  } catch {
    return "rekordbox";
  }
}

export function saveDjSoftware(software: DjSoftware) {
  try {
    localStorage.setItem(STORAGE_KEY, software);
  } catch {
    /* ignore */
  }
}
