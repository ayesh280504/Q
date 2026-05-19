# Pre-deploy checklist — get everything working locally first

Use this before Render / Vercel / Supabase. Deploy only when the **gig loop** and **community loop** pass on your machine.

---

## How to test (every time)

**Terminal 1:** `npm run dev:stack`  
**Terminal 2:** `npm run tauri:dev -w @q/desktop` (needs Rust in PATH)

| URL | App |
|-----|-----|
| http://localhost:5174 | Marketing + community |
| http://localhost:5173/r/CODE | Crowd requests |
| http://localhost:8787/health | API |

Phone on same Wi‑Fi: set `VITE_Q_CROWD_LAN_URL=http://YOUR_LAN_IP:5173` in `.env`, restart desktop.

---

## Pillar 1 — Booth (must pass)

| # | Test | Pass? |
|---|------|-------|
| 1 | Start gig (online once) → session code + QR appear | ☐ |
| 2 | Save PNG / Print sticker | ☐ |
| 3 | Phone scans QR (LAN URL) → crowd page loads | ☐ |
| 4 | Auto-import Serato or Rekordbox → track count updates | ☐ |
| 5 | Sync now → library on server (crowd search finds tracks) | ☐ |
| 6 | Crowd submits request → Sync → appears in **Requests** | ☐ |
| 7 | Accept → moves to **Queue** | ☐ |
| 8 | Serato: play track → leaves queue + **Now playing** updates | ☐ |
| 9 | Decline → removed from pending | ☐ |
| 10 | Offline: accept/decline → outbox → hotspot → Sync pushes | ☐ |
| 11 | “Played once already” shows if song was in Serato history | ☐ |

**Known limits before deploy:**

- **Rekordbox:** no auto now-playing yet — use **✕** on queue or play in Serato for auto-detect.
- **Start gig** needs internet once (creates session on API).

---

## Pillar 2 — Community (must pass)

| # | Test | Pass? |
|---|------|-------|
| 1 | http://localhost:5174/register → create account | ☐ |
| 2 | http://localhost:5174/studio → add public mix (URL) | ☐ |
| 3 | http://localhost:5174/community → mix on feed | ☐ |
| 4 | http://localhost:5174/dj/HANDLE → profile + mixes | ☐ |
| 5 | Desktop: sign in / register (same account) | ☐ |
| 6 | Signed in → Start gig → profile link in message | ☐ |
| 7 | http://localhost:5173/dj/HANDLE → redirects to active gig | ☐ |

---

## Not required before first deploy

- Q Pro / AI transitions (stub)
- Desktop installer hosted online
- Traktor
- Email verification / password reset
- Mix comments, follows, likes

---

## After local pass → deploy order

1. Render: API + env (`Q_CROWD_URL`, `Q_WEB_URL`)
2. Vercel: crowd + web (`VITE_Q_API_URL` → Render API)
3. Supabase: migrate SQLite → Postgres when you need durable production DB
4. Desktop: rebuild with production `VITE_Q_API_URL`

See README **QR sticker** and **Environment variables** sections.
