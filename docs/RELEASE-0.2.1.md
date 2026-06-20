# Release 0.2.1 — booth fixes, crowd conversion, Command Center

Ship **after** LAN smoke test. This release bundles everything since v0.2.0 that was built locally but not yet tagged.

---

## What’s in 0.2.1

### Desktop (DJ)
- **Command Center** UI — full-screen booth: QR hero, collapsible settings, now-playing card + queue rail
- **Serato now-playing** — scan multiple session files; fallback to history when newest file is empty
- **DJ software preference** persisted; auto-select when only Serato or Rekordbox is running
- **Compact setup panel** — Sync + Import always visible; limits/privacy in `<details>`
- **Library sync on Sync** — pushes last import to API so crowd search works
- **End gig** in header; session `is_live` cleared on API
- **Request alerts** — optional sound + desktop notification on new crowd request
- **Public wall + shoutouts** toggles in gig settings
- **Mix coach** — harmonic next-track picks from synced library (`GET /mix-suggestions`)
- **Drag to deck** — native OS file drag onto Serato/Rekordbox (no Serato API partnership)
- **BLE proximity** — laptop beacons `Q-CODE` while gig is live (Windows); crowd `/nearby` scan (Android Chrome)

### Crowd (guest phones)
- **Post-gig screen** — “Set’s over” + follow/signup CTA (no login during set)
- **Share booth** — copy link, native share, QR for friends (same `/r/CODE`)
- **Faster end-gig detect** — `GET /sessions/:code/status` polled every 2s (tab visible)
- **Post-gig rating** — 1–5 tap after set ends (`gig_ratings` table)
- **Guest notes / shoutouts** — optional note on requests (when DJ allows)
- **Live request wall** — optional public wall of pending + accepted requests
- **Accept/decline toasts** — guests see DJ verdict on their phone
- **Offline `/dj/:handle`** — follow CTA when DJ not live
- Search empty-state **hints** from API when library missing

### Web (community + marketing)
- **Follow from crowd** — `?follow=handle&from=crowd` on register/login; auto-follow after auth
- **DJ profile** — shows aggregate crowd rating when available
- **Marketing pages** — `/features`, `/for-djs`, `/for-crowd`, `/about`, `/terms`
- Expanded homepage + download page with full feature list and changelog

### API
- Session fields: `isLive`, `endedAt`, `djHandle`, `publicWall`, `allowShoutouts`
- Block requests when gig ended (`403 gig_ended`)
- `GET /sessions/:code/status`, `POST /sessions/:code/rating`, `GET /sessions/:code/wall`

### Q Booth mobile (Expo)
- Branded screens (Sign in, Start gig, Live)
- **`metro.config.js`** — fixes Windows Metro crash on missing `@esbuild/*` folders
- `expo-asset` dependency; LAN via `apps/booth/.env`

---

## Version files (must match `0.2.1`)

- [x] `package.json`
- [x] `apps/desktop/package.json`
- [x] `apps/desktop/src-tauri/tauri.conf.json`
- [x] `apps/desktop/src-tauri/Cargo.toml`
- [x] `apps/web/src/pages/DownloadPage.tsx` → `BOOTH_VERSION`

---

## Build + test (local)

```powershell
cd C:\Users\ayesh\Documents\Q
npm install
npm run build -w @q/shared
npm run build -w @q/api
npm run build -w @q/crowd
npm run build -w @q/web
npm run build -w @q/desktop
```

### Smoke test checklist

| Step | Pass |
|------|------|
| `npm run dev:stack` + `npm run dev:desktop` | |
| Start gig → Import library → **Sync now** | |
| Phone on LAN: crowd `/r/CODE` → search finds tracks | |
| Serato: now playing updates on track change | |
| **Share link** / friend QR opens same booth | |
| **End gig** → crowd shows “Set’s over” within ~2s | |
| Rate 1–5 → profile shows average (signed-in DJ) | |
| **BLE:** desktop “BLE nearby” pill; Android Chrome `/nearby` finds booth | |
| `npm run dev:booth` → Expo Go connects (port 8081 free) | |

---

## Commit + tag

```powershell
git add -A
git status
git commit -m "Release v0.2.1: Command Center, crowd share/rating, Serato and search fixes"
git push origin main
git tag v0.2.1
git push origin v0.2.1
```

---

## Production

1. **Render** — redeploy API (new routes + `gig_ratings` table auto-created on boot).
2. **Vercel crowd** — redeploy; set `VITE_Q_WEB_URL=https://q-web-liart.vercel.app` (register links from crowd).
3. **Vercel web** — redeploy.
4. **Desktop** — signed build, GitHub Release assets:
   - `Q_0.2.1_x64-setup.exe`
   - `Q_0.2.1_x64-setup.exe.sig`
5. **Vercel web** — `VITE_Q_INSTALLER_WINDOWS` → new `.exe` URL.

See [PRODUCTION-DEPLOY.md](./PRODUCTION-DEPLOY.md) for env vars and Supabase redirects.

---

## Suggested GitHub release notes

```markdown
## Q 0.2.1

**DJ desktop**
- New Command Center layout (QR center, settings sidebar, live queue)
- Serato now-playing reliability fix
- Crowd library sync on Sync — guest search works after import

**Guest crowd page**
- Share booth link/QR with friends
- Set ends for everyone within seconds; optional 1–5 rating
- Follow DJ after the set (no account needed to request)

**Fixes**
- Compact DJ setup panel
- Expo Q Booth app starts on Windows (Metro config)
```

---

## Not in 0.2.1 (next)

- BLE on macOS + native iOS guest scanner (Web Bluetooth unavailable on Safari)
- Push/email when followed DJ goes live
- SSE/WebSocket instant session end (polling is 2s today)
