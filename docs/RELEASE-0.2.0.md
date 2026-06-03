# Release 0.2.0 — production push

## What’s in this release

- Unified Q brand across **web**, **crowd** (guest phones), **desktop**, and **Q Booth** (Expo)
- Shared `@q/theme` tokens (black, Inter, pink/cyan/purple, white CTAs)
- Crowd LAN fix: phones use `/api` proxy, not `localhost`
- `npm run sync:env` for LAN dev
- Desktop booth UI Phase A–C (queue, overlay, QR sticker)

---

## Version files (must match `0.2.0`)

- [x] `package.json`
- [x] `apps/desktop/package.json`
- [x] `apps/desktop/src-tauri/tauri.conf.json`
- [x] `apps/desktop/src-tauri/Cargo.toml`
- [x] `apps/web/src/pages/DownloadPage.tsx` → `BOOTH_VERSION`
- [ ] `package-lock.json` — run `npm install` at repo root

---

## Copy-paste deploy

### 1. Build + test

```powershell
cd C:\Users\ayesh\Documents\Q
npm install
npm run build -w @q/shared
npm run build -w @q/api
npm run build -w @q/crowd
npm run build -w @q/web
```

### 2. Commit + push

```powershell
git add -A
git status
git commit -m "Release v0.2.0: unified brand, crowd mobile UI, desktop booth polish"
git push origin main
```

### 3. Wait for Render + Vercel

- Render: https://q-api-hp4b.onrender.com/health  
- Web: https://q-web-liart.vercel.app  
- Crowd: your crowd Vercel URL (if separate)

### 4. Build signed desktop

```powershell
cd C:\Users\ayesh\Documents\Q\apps\desktop
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\q-updater.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "YOUR_PASSWORD"
npm run tauri:build
```

### 5. GitHub Release

```powershell
cd C:\Users\ayesh\Documents\Q
git tag v0.2.0
git push origin v0.2.0
```

**Assets:**

- `Q_0.2.0_x64-setup.exe`
- `Q_0.2.0_x64-setup.exe.sig`

**Suggested release notes:**

```markdown
## Q 0.2.0

- One visual language everywhere: web, guest request page, and desktop booth
- Guest QR page redesigned for phones (black glass, readable at the booth)
- Desktop: white Accept buttons, pink accents, improved overlay + QR sticker
- Q Booth mobile app styling (Expo) — same brand as the website
- Better phone ↔ laptop dev setup (`npm run sync:env`)

Recommended for all DJs on 0.1.8 / 0.1.9. Auto-update within ~60s of this release.
```

### 6. Vercel — update download link (web project only)

| Variable | Value |
|----------|--------|
| `VITE_Q_INSTALLER_WINDOWS` | `https://github.com/ayesh280504/Q/releases/download/v0.2.0/Q_0.2.0_x64-setup.exe` |

Redeploy web (or trigger redeploy in dashboard).

### 7. Verify

- https://q-web-liart.vercel.app/download shows **0.2.0** and downloads the new `.exe`
- Desktop 0.1.9 → updater banner → install 0.2.0
- Start gig → QR → phone request → accept on desktop

---

## Direct links (after release)

| What | URL |
|------|-----|
| API | https://q-api-hp4b.onrender.com |
| Web | https://q-web-liart.vercel.app |
| Download | https://q-web-liart.vercel.app/download |
| GitHub releases | https://github.com/ayesh280504/Q/releases |
| Windows installer | https://github.com/ayesh280504/Q/releases/download/v0.2.0/Q_0.2.0_x64-setup.exe |

Full env tables: [PRODUCTION-DEPLOY.md](./PRODUCTION-DEPLOY.md).
