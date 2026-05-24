/** Spotify Web API — crowd open search + BPM/key via audio-features. */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

const MUSICAL_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export function isSpotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim());
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

export function formatMusicalKey(key: number, mode: number): string {
  const name = MUSICAL_KEYS[key] ?? "?";
  return mode === 1 ? `${name} major` : `${name} minor`;
}

export type SpotifySearchHit = {
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  albumArtUrl?: string;
  durationSec?: number;
  bpm?: number;
  key?: string;
  previewUrl?: string;
};

type SpotifyTrackItem = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  album?: { name?: string; images?: Array<{ url: string }> };
  artists?: Array<{ name: string }>;
};

type AudioFeatures = {
  id: string;
  tempo: number;
  key: number;
  mode: number;
};

export async function getSpotifyTrackFeatures(
  spotifyId: string,
): Promise<{ bpm?: number; key?: string }> {
  const token = await getAccessToken();
  if (!token) return {};

  const res = await fetch(`${API_BASE}/audio-features/${spotifyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};

  const f = (await res.json()) as AudioFeatures | null;
  if (!f?.id) return {};
  return {
    bpm: Math.round(f.tempo),
    key: formatMusicalKey(f.key, f.mode),
  };
}

export async function searchSpotifyTracks(query: string, limit = 20): Promise<SpotifySearchHit[]> {
  const token = await getAccessToken();
  if (!token || query.trim().length < 2) return [];

  const q = encodeURIComponent(query.trim());
  const searchRes = await fetch(`${API_BASE}/search?q=${q}&type=track&limit=${Math.min(limit, 50)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!searchRes.ok) return [];

  const searchJson = (await searchRes.json()) as {
    tracks?: { items?: SpotifyTrackItem[] };
  };
  const items = searchJson.tracks?.items ?? [];
  if (items.length === 0) return [];

  const ids = items.map((t) => t.id).join(",");
  const featRes = await fetch(`${API_BASE}/audio-features?ids=${ids}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const featuresById = new Map<string, AudioFeatures>();
  if (featRes.ok) {
    const featJson = (await featRes.json()) as { audio_features?: Array<AudioFeatures | null> };
    for (const f of featJson.audio_features ?? []) {
      if (f?.id) featuresById.set(f.id, f);
    }
  }

  return items.map((t) => {
    const feat = featuresById.get(t.id);
    const artist = t.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
    return {
      spotifyId: t.id,
      title: t.name,
      artist,
      album: t.album?.name,
      albumArtUrl: t.album?.images?.[0]?.url,
      durationSec: Math.round(t.duration_ms / 1000),
      bpm: feat ? Math.round(feat.tempo) : undefined,
      key: feat ? formatMusicalKey(feat.key, feat.mode) : undefined,
      previewUrl: t.preview_url ?? undefined,
    };
  });
}
