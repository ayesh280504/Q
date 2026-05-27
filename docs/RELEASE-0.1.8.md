# Release 0.1.8 — deploy checklist

## Version files (must all match `0.1.8`)

- [x] `package.json` (repo root)
- [x] `apps/desktop/package.json`
- [x] `apps/desktop/src-tauri/tauri.conf.json`
- [x] `apps/desktop/src-tauri/Cargo.toml`
- [ ] `package-lock.json` — run `npm install` at repo root after bump

---

## 0. Pre-flight (local)

```powershell
cd C:\Users\ayesh\Documents\Q
npm install
npm run build -w @q/shared
npm run build -w @q/api
npm run build -w @q/crowd
npm run build -w @q/web
npm run build -w @q/desktop
```

Quick smoke: `npm run dev:stack` + `npm run tauri:dev -w @q/desktop` — start gig, accept request, end gig.

---

## 1. Git commit + push

```powershell
cd C:\Users\ayesh\Documents\Q
git status
git add -A
git commit -m "Release v0.1.8: booth stability, live status API, crowd offline UX"
git push origin main
```

Use your real branch name if not `main`.

---

## 2. Deploy API (Render) — do this first

Render auto-deploys on push if connected to GitHub.

**Verify after deploy:**

```text
GET https://q-api-hp4b.onrender.com/health
```

Should return `spotifySearch: true` (if keys set).

**New in 0.1.8 (smoke):**

- Start gig from desktop → play track → `GET /sessions/{id}/live-status` returns title/BPM
- End gig → `POST /sessions/{id}/end` → `GET /djs/{handle}/active-gig` shows `live: false`

Render env (unchanged unless missing):

| Variable | Example |
|----------|---------|
| `Q_CROWD_URL` | `https://q-web-liart.vercel.app` or your crowd Vercel URL |
| `Q_WEB_URL` | `https://q-web-liart.vercel.app` |
| `Q_GITHUB_REPO` | `ayesh280504/Q` (for desktop updater) |

---

## 3. Deploy Crowd + Web (Vercel)

Both projects redeploy on push (if linked) or trigger redeploy in Vercel dashboard.

**Vercel env (both crowd + web):**

| Variable | Value |
|----------|--------|
| `VITE_Q_API_URL` | `https://q-api-hp4b.onrender.com` |

**Web only (after GitHub release exists):**

| Variable | Value |
|----------|--------|
| `VITE_Q_INSTALLER_WINDOWS` | Direct URL to `Q_0.1.8_x64-setup.exe` on GitHub Releases |

Crowd URL for QR / permanent link must match `Q_CROWD_URL` on Render.

---

## 4. Build Windows desktop installer

From repo root, with signing keys if you use auto-update (see `docs/RELEASING.md`):

```powershell
cd C:\Users\ayesh\Documents\Q\apps\desktop

# Optional — only if you sign updates:
# $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\q-updater.key" -Raw
# $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"

npm run tauri:build
```

**Artifacts** (upload both):

- `apps\desktop\src-tauri\target\release\bundle\nsis\Q_0.1.8_x64-setup.exe`
- `apps\desktop\src-tauri\target\release\bundle\nsis\Q_0.1.8_x64-setup.exe.sig` (required for in-app updater)
- `apps\desktop\src-tauri\target\release\bundle\msi\Q_0.1.8_x64-setup.msi` (optional alternate installer)

Production API URL for the built app: set in `.env.production` at repo root (`VITE_Q_API_URL=...`) before `tauri:build`.

---

## 5. GitHub Release

1. Tag: `git tag v0.1.8 && git push origin v0.1.8`
2. GitHub → **Releases** → **Draft new release**
3. Tag: `v0.1.8`, title: `Q 0.1.8`
4. Attach: `.exe`, `.exe.sig`, and `.msi`
5. Publish

**Suggested release notes (in-app updater shows this body):**

```markdown
## Q 0.1.8

- Gentler crowd sync: 15s default poll, optional Booth-only mode (no background sync)
- Faster, safer networking: timeouts so bad Wi‑Fi never freezes the booth
- End gig now clears your permanent QR until the next session
- Now playing can sync to the cloud for the Q Booth phone app (beta)
- Crowd: better page when your permanent link is scanned but you're not live
- Rekordbox/Serato process detection on Windows (settings)
```

---

## 6. After release

- [ ] Update `VITE_Q_INSTALLER_WINDOWS` on Vercel to the new `.exe` URL
- [ ] Install 0.1.8 on your machine; confirm updater banner from 0.1.7 (if updater enabled)
- [ ] Run `docs/PHASE-0-CHECKLIST.md` on real hardware
- [ ] Q Booth (Expo): point `apps/booth/.env` at production API — not part of this release binary

---

## What 0.1.8 does NOT include

- Mac desktop build
- App Store Q Booth app (code in `apps/booth`, dev via Expo Go only)
- System tray / auto-start with Serato (partial sentinel only)
