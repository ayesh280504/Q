const PUBLIC_WALL_KEY = "q-public-wall";
const SHOUTOUTS_KEY = "q-allow-shoutouts";

export function loadPublicWallPref(): boolean {
  try {
    return localStorage.getItem(PUBLIC_WALL_KEY) === "1";
  } catch {
    return false;
  }
}

export function savePublicWallPref(on: boolean) {
  try {
    localStorage.setItem(PUBLIC_WALL_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadAllowShoutoutsPref(): boolean {
  try {
    return localStorage.getItem(SHOUTOUTS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveAllowShoutoutsPref(on: boolean) {
  try {
    localStorage.setItem(SHOUTOUTS_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
