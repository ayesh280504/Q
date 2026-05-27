# Q Booth (Phase 1B)

Native Expo app — phone HUD for accept/decline at the mixer.

## Setup

```bash
cp apps/booth/.env.example apps/booth/.env
# Edit LAN IP for physical device testing

npm install
npm run dev:booth
```

Scan the QR with Expo Go, or run `npm run android` / `npm run ios` with a dev build.

## Requires

- Q API running (`npm run dev:api`)
- Q desktop running on laptop (pushes `live_status` / reads Serato-Rekordbox)
- DJ account (same email/password as web)

## Features

- Sign in → pick library profile → start gig
- Swipe right accept / left decline (with reason sheet)
- Large BPM/key header from desktop push
- Transition hint after accept
- Copy permanent crowd link
- 15s background poll (pull-to-refresh anytime)
