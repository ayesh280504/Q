# Spotify open search (crowd requests)

DJ feedback: move from a **fixed local library index** to **reactive verification** — the crowd searches any track; the DJ sees **BPM + key** on each request and accepts or declines.

**Silent booth:** guests request from their phone (QR); the DJ taps **Accept / Decline** on screen — no yelling, no pulling off headphones mid-transition.

## How it works

1. Guest types in the crowd app (`/r/CODE`).
2. API searches **Spotify** (when keys are configured) and merges matches from the DJ's **synced Serato/Rekordbox library** ("In DJ crate").
3. Guest taps **Request** → row stores title, artist, Spotify id, **BPM**, **key**.
4. DJ booth app syncs pending requests with BPM/key on each line.

Local library sync is still used to mark **in crate** when the same track exists on the laptop.

## Setup (Spotify Developer)

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → Create app.
2. Add to root `.env`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

3. Restart API: `npm run dev:stack`
4. Check: `GET http://localhost:8787/health` → `"spotifySearch": true`

No user Spotify login is required — **Client Credentials** flow (search + audio features only).

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /sessions/:code/tracks/search?q=` | Open search (Spotify + library) |
| `POST /sessions/:code/requests` | Body may include `spotifyId`, `bpm`, `key`, `albumArtUrl` |

Legacy `GET /sessions/:code/library/search` remains for older clients.

## Limits

- Spotify does not grant playback from this flow — discovery + BPM/key only.
- Audio features are estimates; always verify in the booth.
- Production: comply with [Spotify Developer Policy](https://developer.spotify.com/policy).
