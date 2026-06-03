# Q Booth (Phase 1B)

Native Expo app — phone HUD for accept/decline at the mixer.

## Setup

```bash
# In root .env set Q_CROWD_URL=http://<your-lan-ip>:5173 (ipconfig on Windows)
npm run sync:env   # writes apps/booth/.env + VITE_Q_CROWD_LAN_URL for desktop QR

npm install
npm run dev:booth
```

In another terminal: `npm run dev:stack` (API + crowd) and `npm run dev:desktop`.

Scan the QR with Expo Go, or run `npm run android` / `npm run ios` with a dev build.

## Requires

- Q API running (`npm run dev:api`)
- Q desktop running on laptop (pushes `live_status` / reads Serato-Rekordbox)
- DJ account (same email/password as web)

## Brand

Mobile UI uses the same tokens as web/desktop (`@q/theme/tokens` — black AMOLED, Inter + JetBrains Mono, pink/cyan/purple accents, white primary CTAs).

## Features

- Sign in → pick library profile → start gig
- Swipe right accept / left decline (with reason sheet)
- Large BPM/key header from desktop push
- Transition hint after accept
- Copy permanent crowd link
- 15s background poll (pull-to-refresh anytime)
