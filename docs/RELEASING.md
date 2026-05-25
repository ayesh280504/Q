# Releasing the Q desktop app (with auto-update)

The Q booth app uses Tauri's built-in updater. Once a DJ has any signed build
installed, every future release you publish will surface as an in-app
"Update available" banner — no manual installer download required.

This document covers:

1. **One-time signing key setup** (do this once, ever)
2. **Configuring the API + Vercel for the updater**
3. **The release workflow** for every new version going forward

---

## 1. One-time signing key setup

The updater verifies every release with an ed25519 signature, so a malicious
`Q_x.y.z_x64-setup.exe` uploaded to a fake repo cannot be installed.

### Generate your keys (do this once)

In a terminal that has `cargo` on PATH:

```bash
cd apps/desktop
npx @tauri-apps/cli signer generate -w "$HOME/.tauri/q-updater.key"
# On Windows PowerShell use: $env:USERPROFILE\.tauri\q-updater.key
```

You'll be prompted for a password. Use a strong one and **save it in a
password manager** — losing it means you have to roll out a brand-new keypair
and every existing installed DJ would stop receiving updates.

This produces two files:

- `q-updater.key` — **private key** (keep secret, do not commit)
- `q-updater.key.pub` — **public key** (safe to commit/share)

### Paste the public key into `tauri.conf.json`

Open `apps/desktop/src-tauri/tauri.conf.json`. Find:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://q-api.onrender.com/desktop/update.json?target={{target}}&current_version={{current_version}}"
  ],
  "dialog": false,
  "pubkey": "REPLACE_ME_WITH_TAURI_SIGNER_PUBKEY"
}
```

Replace `REPLACE_ME_WITH_TAURI_SIGNER_PUBKEY` with the **contents of
`q-updater.key.pub`** (one long base64 string). Commit this change.

> **Note:** the endpoint URL above must match your Render API URL. If your
> deployed API is on a different domain, update both `endpoints` here.

### Store the private key for builds

You'll need two env vars set whenever you run `npm run tauri:build`:

```bash
# PowerShell (Windows)
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\q-updater.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password-here"

# Bash / WSL / macOS
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/q-updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your-password-here"
```

You can also paste these into a `.env.local` that's git-ignored and `source`
it before each build.

---

## 2. Configure Render + Vercel

### Render (API)

Add these env vars to the `q-api` service:

| Variable | Value | Required? |
|----------|-------|-----------|
| `Q_GITHUB_REPO` | `owner/repo` of your GitHub repo (e.g. `ayeshrk/Q`) | Yes |
| `Q_GITHUB_TOKEN` | A GitHub PAT with `repo` scope | Only if repo is private |

The API now exposes `GET /desktop/update.json?target=...&current_version=...`
that proxies the latest GitHub Release.

> Test it locally after deploying:
> ```
> curl "https://q-api.onrender.com/desktop/update.json?target=windows-x86_64&current_version=0.0.0"
> ```
> A 200 with JSON means it's working; a 204 means there's no newer release.

### Vercel (web)

No changes needed for the updater itself. You can keep the `VITE_Q_INSTALLER_WINDOWS`
env var pointing at a stable download URL (e.g. the "latest" GitHub Release
asset URL) for first-time installs.

---

## 3. Release workflow for every new version

Once the above is set up once, every future release looks like this:

### Step 1 — Bump version numbers

Update all three places so they match:

- `apps/desktop/src-tauri/tauri.conf.json` → `"version": "0.2.0"`
- `apps/desktop/src-tauri/Cargo.toml` → `version = "0.2.0"`
- `apps/desktop/package.json` → `"version": "0.2.0"` (optional but tidy)

### Step 2 — Build the signed installer

In a shell that has the `TAURI_SIGNING_*` env vars exported (see above):

```bash
cd apps/desktop
npm run tauri:build
```

Output files appear in `src-tauri/target/release/bundle/nsis/`:

- `Q_0.2.0_x64-setup.exe`        ← the installer
- `Q_0.2.0_x64-setup.exe.sig`    ← the signature **(critical — auto-update will skip this release if missing)**

### Step 3 — Publish a GitHub Release

1. Push your version-bump commit and tag it: `git tag v0.2.0 && git push --tags`
2. On GitHub → **Releases → Draft a new release**:
   - Tag: `v0.2.0`
   - Title: `Q 0.2.0` (or whatever)
   - Description: write actual release notes. **This text becomes the
     "What's new" body of the in-app banner**, so make it short and useful.
3. Drag both files into the assets dropzone:
   - `Q_0.2.0_x64-setup.exe`
   - `Q_0.2.0_x64-setup.exe.sig`
4. Publish the release.

### Step 4 — Done

Within ~60 seconds (the API caches GitHub responses for that long), every
running booth app on a previous version will receive the update notification
on its next launch:

> Q 0.2.0 is available
> [release notes]
> [Install & restart] [Later] [Skip]

If they click **Install & restart**, Tauri:

1. Downloads `Q_0.2.0_x64-setup.exe` from GitHub.
2. Verifies it against the embedded public key + the `.sig` file.
3. Runs the silent installer.
4. Relaunches the app into the new version.

If they click **Later**, they'll see it again next launch.
If they click **Skip**, this version is suppressed until a newer one is published.

---

## Important: the FIRST version with auto-update

**The currently-installed `v0.1.0` / `v0.1.1` does NOT have the updater
plugin compiled in.** Auto-update doesn't kick in until DJs have a build that
includes this code.

So the rollout sequence is:

1. Ship `v0.2.0` (or whatever version) with the updater plugin compiled in →
   DJs need to **manually download this build once** from your website.
2. From `v0.2.1` onwards, every release auto-updates silently.

You may want to bump version straight to `v0.2.0` to make this distinction
clear in changelogs.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Banner never appears | Hit the endpoint in a browser. 503 = `Q_GITHUB_REPO` not set on Render. 204 = current version equals latest tag (expected if there's no newer release). |
| `Update failed: signature verification failed` | The `.sig` file in the release was generated with a different private key than the one whose pubkey is in `tauri.conf.json`. Always sign with the same key. |
| `Update failed: invalid endpoint` | The `endpoints` URL in `tauri.conf.json` doesn't return JSON in the expected shape. Check `curl` output. |
| `npm run tauri:build` errors with "no signing key" | `TAURI_SIGNING_PRIVATE_KEY` env var is missing or empty. |
| Build artifacts are missing the `.sig` file | `bundle.createUpdaterArtifacts` is not `true` in `tauri.conf.json`. |
| Banner shows but install fails on Windows | The new release's installer is unsigned (Microsoft SmartScreen). Code-sign the `.exe` separately or it'll fail elevation. |

---

## Why this design?

- **GitHub Releases as the source of truth** — you already upload there, no
  new place to forget.
- **Render API as a thin proxy** — strips GitHub's response shape down to
  Tauri's expected manifest format, and caches for 60 seconds to avoid
  hammering the GitHub API.
- **ed25519 signature verification** — even if your GitHub account is
  compromised, an attacker can't ship a malicious update without the private
  key.
- **In-app UI, not a forced restart** — DJs in the middle of a set won't be
  surprised by a relaunch. They explicitly opt in via the banner.
