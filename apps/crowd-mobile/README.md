# Q Crowd (iOS / Android guest app)

Native guest app for **App Store** distribution — BLE nearby discovery + crowd request WebView.

## Dev (requires Expo Go or dev client)

```bash
# From repo root — sync LAN/production crowd URL
npm run sync:env

# Copy env (sync:env can write apps/booth/.env; for crowd-mobile set manually or copy example)
cp apps/crowd-mobile/.env.example apps/crowd-mobile/.env

npm run dev:crowd-mobile
```

**iOS:** `npx expo run:ios` (dev client with `react-native-ble-plx` — Expo Go alone is not enough for BLE).

**Android:** `npx expo run:android`

## BLE proximity

1. DJ runs **Q desktop** (Mac or Windows) → **Start gig** → **BLE nearby** pill shows in Command Center.
2. Guest opens **Q Crowd app** → **Find booth nearby** → tap booth → request page loads.

Fallback: enter 6-char code or scan QR (web crowd).

## Spread the gig (peer QR)

When you're on a booth in the app, tap the **QR button** (bottom-right). Your friend scans it with their camera — same booth, no trip to the DJ laptop. They can request in the browser or install the app later.

## App Store / TestFlight

- Bundle ID: `app.q.crowd`
- Uses hosted crowd at `EXPO_PUBLIC_Q_CROWD_URL` (production: `https://q-crowd.vercel.app`)
- Bluetooth usage strings in `app.json`
- EAS config: `eas.json` (profiles: `development`, `preview`, `production`)

Full checklist: [docs/TESTFLIGHT-iOS.md](../docs/TESTFLIGHT-iOS.md)

```bash
cd apps/crowd-mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production --latest
```

Mac DJ beacon verification: [docs/MAC-BLE-VERIFY.md](../docs/MAC-BLE-VERIFY.md)
