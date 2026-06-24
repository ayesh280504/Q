# Mac BLE beacon — field verification

Confirm the **Q desktop** app advertises session code `Q-XXXXXX` on macOS so iPhone **Q Crowd** can discover booths without QR.

## Why this matters

- Wedding/club DJs skew **Mac + Serato**
- iPhone guests need the **native Q Crowd app** for BLE (Safari has no Web Bluetooth)
- BLE is **discovery only** — requests still go guest LTE → Render API

## DJ laptop (Mac)

### Build / run

```bash
cd apps/desktop
npm run tauri dev
# or production build from apps/desktop after signing setup
```

### Start a gig

1. Sign in (Supabase) if prompted
2. **Start gig** — note 6-character code (e.g. `Q-A1B2C3`)
3. Command Center should show **BLE nearby** / beacon active pill

### macOS permissions

First launch may prompt for **Bluetooth**. Allow Q in:

**System Settings → Privacy & Security → Bluetooth → Q**

If advertising fails silently, check **Console.app** filter `q-desktop` or Tauri logs.

### Info.plist (Tauri)

Bluetooth usage strings must be present for App Store / notarization. Verify in `apps/desktop/src-tauri/Info.plist` (or `tauri.conf.json` bundle config):

- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

Example copy: *"Q broadcasts your gig code so nearby guests can join without scanning a QR code."*

## Guest phone (iPhone)

Use **Q Crowd** dev client or TestFlight build (`app.q.crowd`):

```bash
cd apps/crowd-mobile
npx expo run:ios --device
```

1. Open app → **Find booth nearby**
2. Within ~10 m of Mac, booth should appear as `Q-XXXXXX`
3. Tap → request page for that session

**Fallback:** scan QR from desktop or enter code manually — should match same session.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No booth in scan list | Mac Bluetooth on; gig live; app has BT permission; try closer range |
| Wrong / stale code | End gig and start new one; code rotates per session |
| iOS scan works, requests fail | API URL / network — BLE does not carry HTTP |
| Windows works, Mac doesn't | CoreBluetooth path vs Windows implementation — file issue with logs |

## Protocol reference

- Advertised name pattern: `Q-` + session code (see `packages/shared/src/ble.ts`)
- Crowd app parses advertisement and opens `EXPO_PUBLIC_Q_CROWD_URL/r/{code}`

## Sign-off criteria

- [ ] Mac laptop + iPhone TestFlight/dev build
- [ ] Booth appears in nearby scan within 10 m
- [ ] Tap loads crowd request UI for correct session
- [ ] At least one LTE request reaches Mac Command Center
- [ ] QR fallback still works when BLE disabled

When signed off, proceed with [TESTFLIGHT-iOS.md](./TESTFLIGHT-iOS.md) external testing.
