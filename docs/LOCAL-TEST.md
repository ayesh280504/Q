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
| API crashes on start (`better_sqlite3.node` / NODE_MODULE_VERSION) | Node version changed — run `npm rebuild better-sqlite3` from repo root, restart `dev:stack`. |

### Windows firewall

If the phone can't reach the laptop, allow Node through Windows Firewall for private networks, or temporarily allow inbound on ports **5173** and **8787**.

### Find your LAN IP manually

```powershell
ipconfig
```

Look for **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.0.155`).

---

## 6. Feature checklist (test everything)

Use this when you return — tick each box after verifying locally. **Desktop = Tauri app** unless noted.

### Stack health

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 1 | API up | `npm run dev:check` → ✓ API | ☐ |
| 2 | Crowd + web up | `dev:check` → ✓ Crowd, ✓ Web | ☐ |

### DJ booth (desktop)

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 3 | Sign in | Supabase login if prompted | ☐ |
| 4 | Start gig | Code + QR appear; BLE pill shows | ☐ |
| 5 | Import library | Serato crates or Rekordbox XML | ☐ |
| 6 | Sync now | Crowd search finds imported tracks | ☐ |
| 7 | Request alert | Phone submits → sound/notification on desktop | ☐ |
| 8 | Accept / decline | Crowd status updates; decline reasons work | ☐ |
| 9 | Queue lifecycle | Accepted → queue; played → leaves queue | ☐ |
| 10 | Serato now-playing | Play in Serato → desktop updates (SQLite path) | ☐ |
| 11 | Mix Coach | Suggestions appear; drag suggestion to deck | ☐ |
| 12 | Drag handle (active) | ⠿ on request with local path → drag to Serato/RB | ☐ |
| 13 | Drag hint (muted) | ⠿ gray + tooltip when no local path / no import | ☐ |
| 14 | Public wall / shoutouts | Toggles affect crowd page | ☐ |
| 15 | End gig | Session ends; crowd sees rating screen | ☐ |
| 16 | Offline sync | Airplane mode → accept locally → sync when back | ☐ |

### Crowd (phone or second browser)

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 17 | QR join | Scan desktop QR → `/r/CODE` loads | ☐ |
| 18 | Library search | Find track from DJ import | ☐ |
| 19 | Spotify fallback | Search track not in crate (needs Spotify keys) | ☐ |
| 20 | Manual request | Title + artist when search misses | ☐ |
| 21 | Play celebration | When DJ plays your accepted track → full-screen animation | ☐ |
| 22 | Post-gig rating | 1–5 stars after end gig | ☐ |
| 23 | Tip + socials | DJ tip URL + Instagram etc. on end screen | ☐ |
| 24 | Peer QR | Guest share button → friend scans same booth | ☐ |
| 25 | `/dj/:handle` | Permanent DJ link works | ☐ |

### Community web (localhost:5174)

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 26 | Sign up / sign in | Supabase auth → studio | ☐ |
| 27 | Settings — socials | Save Instagram, Venmo, etc. | ☐ |
| 28 | Settings persist | Sign out → sign in → socials still there | ☐ |
| 29 | Public profile | `/dj/yourhandle` shows bio + social icons | ☐ |
| 30 | Follow DJ | Follow from profile; feed updates | ☐ |
| 31 | Live banner | Follow a DJ → they start gig → green banner on web | ☐ |
| 32 | Browser alerts | Click “Enable alerts” on banner → permission → notify | ☐ |
| 33 | Gig rating on profile | After crowd rates, score shows on DJ profile | ☐ |
| 34 | Top-rated DJs | `/community` shows rated DJs | ☐ |
| 35 | Studio / mixes | Add mix link; appears on profile | ☐ |

### BLE & mobile (optional — needs device)

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 36 | Desktop BLE beacon | BLE pill on while gig live (Windows/Mac) | ☐ |
| 37 | Crowd iOS app | `npm run dev:crowd-mobile` → Find booth nearby | ☐ |
| 38 | Crowd web `/nearby` | Android Chrome only — scan for booth | ☐ |

### Production smoke (after deploy)

| # | Feature | How to test | Pass? |
|---|---------|-------------|-------|
| 39 | Prod health | `npm run check:prod` | ☐ |
| 40 | LTE request | Phone on cellular → scan prod QR → request | ☐ |
| 41 | Render persistence | Socials survive after API redeploy (needs `Q_DATA_DIR` disk) | ☐ |

**What I can’t test for you:** Serato drag-to-deck, BLE on real phones, Supabase login (needs your keys), and anything requiring your DJ library paths. Run rows 3–16 and 17–25 yourself when you’re back — ~30–45 minutes for the full list.

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
