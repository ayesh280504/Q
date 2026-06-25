import type { LibrarySource } from "@q/shared";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "q-account-token";
const GIG_KEY = "q-booth-gig";
const LIBRARY_KEY = "q-booth-library-source";
const DESKTOP_PAIRING_KEY = "q-desktop-pairing";

export type DesktopPairing = {
  host: string;
  port: number;
  token: string;
};

export type BoothGig = {
  sessionId: string;
  code: string;
  djToken: string;
  crowdUrl: string;
  crowdProfileUrl?: string;
  displayName: string;
  librarySource: LibrarySource;
};

export async function loadLibrarySourcePref(): Promise<LibrarySource | null> {
  try {
    const raw = await SecureStore.getItemAsync(LIBRARY_KEY);
    if (raw === "local" || raw === "spotify" || raw === "both") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export async function saveLibrarySourcePref(source: LibrarySource) {
  await SecureStore.setItemAsync(LIBRARY_KEY, source);
}

export async function loadAccountToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAccountToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function loadGig(): Promise<BoothGig | null> {
  try {
    const raw = await SecureStore.getItemAsync(GIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoothGig>;
    if (!parsed.sessionId || !parsed.code || !parsed.djToken || !parsed.crowdUrl) return null;
    return {
      sessionId: parsed.sessionId,
      code: parsed.code,
      djToken: parsed.djToken,
      crowdUrl: parsed.crowdUrl,
      crowdProfileUrl: parsed.crowdProfileUrl,
      displayName: parsed.displayName ?? "DJ",
      librarySource: parsed.librarySource ?? "both",
    };
  } catch {
    return null;
  }
}

export async function saveGig(gig: BoothGig | null) {
  if (gig) await SecureStore.setItemAsync(GIG_KEY, JSON.stringify(gig));
  else await SecureStore.deleteItemAsync(GIG_KEY);
}

export async function loadDesktopPairing(): Promise<DesktopPairing | null> {
  try {
    const raw = await SecureStore.getItemAsync(DESKTOP_PAIRING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DesktopPairing>;
    if (!parsed.host?.trim() || !parsed.token?.trim()) return null;
    return {
      host: parsed.host.trim(),
      port: parsed.port ?? 8765,
      token: parsed.token.trim(),
    };
  } catch {
    return null;
  }
}

export async function saveDesktopPairing(pairing: DesktopPairing | null) {
  if (pairing) await SecureStore.setItemAsync(DESKTOP_PAIRING_KEY, JSON.stringify(pairing));
  else await SecureStore.deleteItemAsync(DESKTOP_PAIRING_KEY);
}
