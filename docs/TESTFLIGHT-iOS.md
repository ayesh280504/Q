# Q Crowd iOS — TestFlight checklist

Ship **`app.q.crowd`** so iPhone guests can join via BLE (Safari cannot scan beacons).

## Prerequisites

| Item | Value |
|------|--------|
| App path | `apps/crowd-mobile` |
| Bundle ID | `app.q.crowd` |
| Expo slug | `q-crowd` |
| Crowd host | `https://q-crowd.vercel.app` |
| BLE plugin | `react-native-ble-plx` (dev client required — not Expo Go alone) |

Apple Developer account with App Store Connect access.

## One-time setup

### 1. EAS project

```bash
cd apps/crowd-mobile
npm install
npx eas login
npx eas init
```

Link to Expo project when prompted (creates `projectId` in `app.json`).

### 2. App Store Connect

1. **My Apps** → **+** → New App → iOS → name **Q Crowd**
2. Bundle ID: `app.q.crowd`
3. Note the **Apple ID** (numeric) for `eas.json` → `submit.production.ios.ascAppId`

### 3. Secrets / env

Production crowd URL is set in `eas.json` build profiles. Override with EAS secrets if needed:

```bash
npx eas secret:create --name EXPO_PUBLIC_Q_CROWD_URL --value https://q-crowd.vercel.app --scope project
```

### 4. Update `eas.json` submit block

Replace placeholders in `apps/crowd-mobile/eas.json`:

- `appleId` — your Apple ID email
- `ascAppId` — App Store Connect app numeric ID
- `appleTeamId` — Developer portal team ID

## Build & submit

```bash
cd apps/crowd-mobile

# Internal device build (TestFlight pipeline)
npx eas build --platform ios --profile production

# After build succeeds
npx eas submit --platform ios --profile production --latest
```

Or build + submit in one step:

```bash
npx eas build --platform ios --profile production --auto-submit
```

## TestFlight verification

With a **Mac DJ laptop** running Q desktop (gig live, BLE pill visible):

| Step | Expected |
|------|----------|
| Install TestFlight build on iPhone | App opens to home |
| **Find booth nearby** | Lists `Q-XXXXXX` within ~10 m |
| Tap booth | Request WebView loads `/r/CODE` |
| Submit request | DJ desktop shows pending request |
| QR fallback | Camera scan opens same session |

Also test **peer QR** (Share button) — friend scans without BLE.

## App Review notes (draft)

> Q Crowd helps guests at live DJ events request songs. Bluetooth is used only to discover nearby DJ booths broadcasting a short session code; all requests go over the internet. A QR code fallback is always available.

Privacy: no account required to request; optional rating after the set.

## Related

- [MAC-BLE-VERIFY.md](./MAC-BLE-VERIFY.md) — DJ-side beacon on macOS
- [PRODUCTION-DEPLOY.md](./PRODUCTION-DEPLOY.md) — API + crowd URLs
- [PRD.md](./PRD.md) — networking & proximity architecture
