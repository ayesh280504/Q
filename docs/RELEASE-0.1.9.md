# Release 0.1.9 — hotfix (tasklist console flash)

## What changed

- Fix: DJ software sentinel no longer spawns visible `tasklist` cmd windows on Windows
- One hidden process check instead of three; poll every 30s instead of 5s

## Version files (must match `0.1.9`)

- `package.json`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/tauri.conf.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `package-lock.json` (after `npm install`)

---

## Full push pass (copy-paste)

### 1. Wait for build to finish, then rebuild if version was bumped after build started

If you already ran `tauri:build` at 0.1.8, run again at 0.1.9:

```powershell
cd C:\Users\ayesh\Documents\Q\apps\desktop
npm run tauri:build
```

### 2. Commit + push

```powershell
cd C:\Users\ayesh\Documents\Q
npm install --package-lock-only
git add -A
git status
git commit -m "Release v0.1.9: fix Windows tasklist console flash during DJ software check"
git push origin main
```

### 3. GitHub Release

```powershell
git tag v0.1.9
git push origin v0.1.9
```

Then on GitHub → **Releases** → **Draft new release**:

- **Tag:** `v0.1.9`
- **Title:** `Q 0.1.9`
- **Attach assets:**
  - `apps\desktop\src-tauri\target\release\bundle\nsis\Q_0.1.9_x64-setup.exe`
  - `apps\desktop\src-tauri\target\release\bundle\nsis\Q_0.1.9_x64-setup.exe.sig`
  - `apps\desktop\src-tauri\target\release\bundle\msi\Q_0.1.9_x64_en-US.msi` (optional)

**Release notes:**

```markdown
## Q 0.1.9 — hotfix

Fixes a bug in 0.1.8 where opening a gig caused repeated Command Prompt windows to flash (Windows `tasklist` check for Serato/Rekordbox).

- Hidden background process detection — no more cmd spam
- Gentler 30s poll interval for DJ software status

All 0.1.8 features unchanged. Recommended upgrade for all Windows users on 0.1.8.
```

### 4. Update Vercel download link (web project)

Set env var:

| Variable | Value |
|----------|--------|
| `VITE_Q_INSTALLER_WINDOWS` | `https://github.com/ayesh280504/Q/releases/download/v0.1.9/Q_0.1.9_x64-setup.exe` |

Redeploy web on Vercel (or wait for auto-deploy if only env changed).

### 5. API / Render

**No API changes in this pass** — Render does not need a redeploy unless you want to force one.

Auto-updater: existing 0.1.8 installs should pick up 0.1.9 within ~60s of the GitHub release going live (if `.sig` is attached and signing key matches).

### 6. Verify

- Install 0.1.9 → start gig → **no** cmd windows flashing
- `https://q-web-liart.vercel.app/download` → downloads 0.1.9 `.exe`
- Optional: `curl "https://q-api-hp4b.onrender.com/desktop/update.json?target=windows-x86_64&current_version=0.1.8"`

---

## Direct links (after release)

| What | URL |
|------|-----|
| API | https://q-api-hp4b.onrender.com |
| Web | https://q-web-liart.vercel.app |
| Download page | https://q-web-liart.vercel.app/download |
| GitHub releases | https://github.com/ayesh280504/Q/releases |
| Windows installer | https://github.com/ayesh280504/Q/releases/download/v0.1.9/Q_0.1.9_x64-setup.exe |
