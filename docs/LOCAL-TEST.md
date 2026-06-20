# Local testing guide (Q v0.2.1)

Use this when you want to run a **full gig loop** on your laptop + phone before handing Q to DJ testers.

---

## 1. One-time setup

From the repo root (`Documents\Q`):

```powershell
npm install
npm run build -w @q/shared
npm run build -w @q/rekordbox
npm run build -w @q/serato
```

Copy `.env.example` → `.env` if you haven't already. Minimum for local:

| Variable | Purpose |
|----------|---------|
| `PORT=8787` | API |
| `VITE_Q_API_URL=http://localhost:8787` | Desktop + web → API |
| `Q_CROWD_URL` | Crowd URL for QR codes (see LAN below) |
| `SUPABASE_URL` + keys | Sign-in on web/desktop (use your Supabase project) |

Optional: `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` for crowd open search when the DJ library doesn't have a match.

---

## 2. Start the stack

**Terminal 1** — API + crowd + marketing web:

```powershell
npm run dev:stack
```

This runs `sync:env` first (LAN IP auto-detect on Windows when `Q_CROWD_URL` is still `localhost`).

**Terminal 2** — verify everything is up:

```powershell
npm run dev:check
```

You should see ✓ for API (:8787), Crowd (:5173), and Web (:5174).

**Terminal 3** — desktop booth (required for Serato drag + Command Center):

```powershell
npm run dev:desktop
```

> Drag tracks onto Serato/Rekordbox decks only works in the **Tauri** app, not in a browser tab.

---

## 3. Phone / LAN crowd

Your phone must be on the **same Wi‑Fi** as the laptop.

1. Run `npm run sync:env` — writes `VITE_Q_CROWD_LAN_URL` and `apps/booth/.env` from `Q_CROWD_URL`.
2. If `Q_CROWD_URL` is `localhost`, sync auto-detects your IPv4 (e.g. `192.168.0.155`) on Windows.
3. Restart `dev:stack` and `dev:desktop` after changing `.env`.

| Surface | URL on phone |
|---------|----------------|
| Crowd requests | `http://<lan-ip>:5173/r/SESSION_CODE` |
| Or scan QR | Desktop app → Start gig → QR sticker |

Crowd on LAN uses Vite's `/api` proxy — the phone never hits `localhost`.

---

## 4. Full gig smoke test

Do this once before sending builds to friends.

### A. Start gig (desktop)

1. Sign in (Supabase) if prompted.
2. **Start gig** → note session code.
3. **Import library** — Serato crates or Rekordbox XML from your usual path.
4. **Sync now** — metadata goes to API; crowd search populates.

### B. Crowd (phone or second browser)

1. Open crowd URL / scan QR.
2. Search for a track in the DJ library → submit request.
3. Optional: add a shoutout (if enabled in Command Center).
4. Submit a manual request if search misses (title + artist).

### C. Booth (desktop)

1. See request alert (sound + notification if enabled).
2. **Accept** or **Decline** — crowd sees status update.
3. Toggle **Public wall** / **Shoutouts** in Command Center.
4. Open **Mix Coach** — harmonic next-track suggestions.
5. Drag a request row (⠿) onto Serato/Rekordbox if the track has a local path.

### D. End gig + reputation

1. **End gig** on desktop.
2. On phone: rate the set (1–5), optional note.
3. If you set a **tip URL** in web Settings → crowd sees tip button after end.
4. Visit `/community` and your `/dj/handle` — rating should appear on profile / top-rated when enough ratings exist.

### E. Web marketing (optional)

- http://localhost:5174/features  
- http://localhost:5174/integrations  
- http://localhost:5174/download  

---

## 5. Troubleshooting

| Problem | Fix |
|---------|-----|
| `dev:check` fails on API | Is terminal 1 running `dev:stack`? Firewall blocking :8787? |
| Phone can't load crowd | Same Wi‑Fi? Run `npm run sync:env`. Use LAN IP, not `localhost`. |
| QR goes to wrong URL | Set `VITE_Q_CROWD_LAN_URL` in `.env`, restart desktop. |
| Crowd search empty | Desktop → Sync now after import. Check API logs. |
| Spotify search empty | Add Spotify keys to `.env`, restart API. |
| Drag doesn't work | Must use Tauri desktop app; track needs `localPath` from library import. |
| Sign-in fails | Check `SUPABASE_URL` / anon key in `.env` and Supabase dashboard. |

### Windows firewall

If the phone can't reach the laptop, allow Node through Windows Firewall for private networks, or temporarily allow inbound on ports **5173** and **8787**.

### Find your LAN IP manually

```powershell
ipconfig
```

Look for **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.0.155`).

---

## 7. Production (real gigs — LTE, any Wi‑Fi)

Local dev and production use the **same code paths** with different env vars:

| Surface | Local | Production |
|---------|-------|------------|
| API | `http://localhost:8787` | `https://q-api-hp4b.onrender.com` |
| Crowd QR | LAN IP (`sync:env`) | `https://q-crowd.vercel.app/r/CODE` |
| Desktop | `.env` or dev stack | `.env.production` baked into installer |

**Installed desktop app** talks to Render API. QR codes use `Q_CROWD_URL` from Render — guests open the **hosted crowd app**, not your laptop.

Check production without running locally:

```powershell
npm run check:prod
```

Before giving builds to DJ testers:

1. Push + deploy API (Render), crowd + web (Vercel)
2. Confirm Render `Q_CROWD_URL=https://q-crowd.vercel.app`
3. Crowd Vercel: `VITE_Q_API_URL` + `VITE_Q_WEB_URL` set
4. Build installer: `npm run tauri:build -w @q/desktop`
5. `npm run check:prod` → scan QR on phone (LTE works — no same Wi‑Fi needed)

Full deploy checklist: [docs/PRODUCTION-DEPLOY.md](PRODUCTION-DEPLOY.md)

---

## 8. Build installer for testers

```powershell
npm run build:desktop   # or tauri:build for signed installer
```

Installer output: `apps\desktop\src-tauri\target\release\bundle\nsis\Q_0.2.1_x64-setup.exe`

Testers use the **installed desktop app** + **hosted API/crowd** — they do not need your laptop running `dev:stack`.

Before sharing: `npm run check:prod` and one phone test on LTE (scan QR → search → request).

---

## Quick command reference

```powershell
npm run dev:stack      # API + crowd + web (local)
npm run dev:check      # local health check
npm run check:prod     # production health check
npm run sync:env       # LAN URLs for phone + QR
npm run dev:desktop    # Tauri booth
npm run dev:booth      # Expo mobile HUD (optional)
```
