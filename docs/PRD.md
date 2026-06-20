# Q — Product Requirements Document (PRD)

**Version:** 0.2.1 · **Last updated:** May 2026

This is the canonical product doc for **Q** — what it is, who it’s for, what’s built, and why it wins. The technical README links here for product strategy; use [README.md](../README.md) for monorepo setup and API details.

---

## One-liner

**Q** is a two-sided DJ platform: the crowd requests tracks on their phones (LTE, no venue Wi‑Fi); the DJ runs a local-first command center on Mac/Windows with real Serato/Rekordbox depth, accept/decline control, harmonic mix coaching, and optional offline operation.

**Tagline:** *Queue, not chaos.*

---

## Problem

| Pain | Who feels it |
|------|----------------|
| Shouting, DMs, illegible notes for song requests | DJ |
| Venue Wi‑Fi is dead; USB/local library is sacred | DJ |
| Crowd wants to request *that* track but can’t reach the DJ | Guest |
| Existing “request apps” are wedding SaaS (forms, merch, tickets) not booth tools | DJ who actually mixes |
| No reputation loop after the gig | DJ building a following |

---

## Solution — four surfaces

| Surface | User | Role |
|---------|------|------|
| **Desktop (Tauri)** | DJ | Command Center: import library, QR, queue, Serato/RB now-playing, Mix Coach, drag-to-deck, offline sync |
| **Crowd web** | Guest | `/r/CODE` — search, request, shoutout, status, post-gig rating (no app install) |
| **Q Crowd iOS/Android** | Guest | App Store app: **BLE nearby join** + native shell around crowd request UI |
| **Web community** | DJ + fans | Profiles, mix feed, gig ratings, tips link, discovery |

| Cloud | Role |
|-------|------|
| **API (Render)** | Sessions, metadata-only library index, request queue, accounts, ratings |
| **Marketing web** | Explain, download, sign up |

---

## Core principles (non‑negotiable)

1. **Music never leaves the laptop** — only metadata (title, artist, BPM, key) syncs for crowd search.
2. **DJ works offline at the booth** — accept/decline + import without internet; **Sync now** over hotspot.
3. **Crowd uses their own data** — LTE; no venue Wi‑Fi.
4. **Real DJ software** — Serato + Rekordbox import, now-playing, native drag — not folder fiction.
5. **Honest scope** — no merch store, no Eventbrite clone, no paywall-before-request wedding flows.

---

## Platform priority (v0.2.1+)

Most guests at real gigs use **iPhone on LTE**. Safari cannot scan BLE beacons, so proximity join **requires the Q Crowd iOS app**. DJ laptops at clubs and weddings skew **Mac + Serato** — the desktop beacon must work on macOS first-class, not Windows-only.

| Priority | Surface | Why |
|----------|---------|-----|
| **P0** | **macOS desktop** — BLE beacon while gig live | Serato-heavy DJ market; beacon is the “tap to join” anchor for iPhone guests |
| **P0** | **Q Crowd iOS app** — BLE scan → request WebView | App Store path; only reliable BLE scan on iPhone (Web Bluetooth blocked on Safari) |
| **P1** | Windows desktop beacon | Same protocol; already shipped for dev/test on PC |
| **P1** | Android Q Crowd app | Same Expo codebase; Play Store after iOS proves loop |
| **P2** | Crowd web `/nearby` | Android Chrome Web Bluetooth only — bonus, not iPhone strategy |

**Guest join hierarchy (iPhone):** QR scan (always) → **Q Crowd app BLE nearby** → manual 6-char code.  
**Guest join hierarchy (Android):** QR → app BLE → web `/nearby` → manual code.

**Ship order:** Mac beacon verified → TestFlight `app.q.crowd` → App Store → Android → polish web nearby.

---

## Competitive moat

### vs NoSongRequests (NSR) and wedding request SaaS

| Q wins on | NSR typical |
|-----------|-------------|
| Serato + Rekordbox depth (crates, now-playing, drag) | Form + tip wall + integrations grid |
| Mix Coach (harmonic next-track + drag to deck) | No harmonic booth coaching |
| Offline-first booth + sync | Cloud-first |
| Crowd search against **actual DJ library** + Spotify | Generic request forms |
| Gig ratings → profile → community discovery | Event/ticket/merch focus |
| Permanent `/dj/handle` + session QR | Event pages |

**We do not compete on:** merch (Fourthwall), tickets (Eventbrite), full payment stack (yet).

### vs Crate Hackers / Banger Button

| Q wins on | Typical |
|-----------|---------|
| Full crowd product (QR, search, limits, status, ratings) | DJ-side track ID / drag only |
| Community + reputation after gig | Tool-only |
| BLE proximity join (desktop beacon + iOS app) | N/A |

### Defensible stack

- **Local library truth** — parsers for Serato/Rekordbox, not Spotify-only fiction.
- **Native drag-to-deck** — OS file drag onto Serato/RB (same class as Banger Button).
- **Harmonic engine** — shared Camelot/BPM scoring (`@q/shared/harmonic`).
- **Offline outbox** — gig doesn’t die when Wi‑Fi does.
- **Two-sided loop** — crowd requests → DJ accept → post-gig rating → profile → follow → next gig.
- **Proximity protocol** — desktop advertises `Q-XXXXXX`; iOS app scans without venue Wi‑Fi (NSR/wedding SaaS has no equivalent booth beacon).

### What Q is *not*

- Not a wedding intake form with upsells (NSR model).
- Not a DJ-only drag utility without crowd product (Crate Hackers / Banger Button).
- Not a streaming or mix-hosting platform (Spotify/SoundCloud links only in community).
- Not dependent on venue Wi‑Fi or guest account signup mid-set.

---

## Users & jobs to be done

### DJ (primary)

| Job | Success | v0.2.1 |
|-----|---------|--------|
| Start gig in ~60s | Code + QR + BLE beacon | ✅ |
| Import tonight’s library | Serato crates / RB XML | ✅ |
| Control requests | Accept/decline + reasons + alerts | ✅ |
| Mix confidently | Mix Coach + drag local files | ✅ |
| Work offline | Outbox + sync | ✅ |
| Build reputation | Ratings on profile + community | ✅ |
| Get tipped | Tip URL after set | ✅ (link-out) |

### Crowd (secondary)

| Job | Success | v0.2.1 |
|-----|---------|--------|
| Join the set | QR, `/nearby`, or **iOS app BLE scan** | ✅ / ✅ iOS app new |
| Bring a friend | **Peer QR** — connected guest shows same booth QR | ✅ web + iOS app FAB |
| Find a song | Library + Spotify search | ✅ |
| Know if DJ accepted | Status toasts | ✅ |
| Rate after set | 1–5 + follow CTA | ✅ |

### Guest funnel (how the bar actually works)

**Requests do not require the app.** The app is for repeat users and discovery — not a gate.

| Step | Who | How |
|------|-----|-----|
| 1 | Anyone at the bar | Scan **DJ laptop QR** → crowd web → request (no install) |
| 2 | Guest already on the gig | Tap **QR button** → friend scans **same booth link** (peer spread) |
| 3 | Regular with Q Crowd app | BLE nearby join or follow `/dj/handle` |
| 4 | Future | “Open gigs near me” when enough DJs + app users |

**Peer QR (“spread the gig”):** You’re on the DJ’s gig in the app or browser → small QR button → expand → friend scans with camera → lands on same `/r/CODE` → requests without walking to the booth. Optional: share link via iOS share sheet.

---

## Feature inventory (v0.2.1)

### Desktop booth
- Command Center (QR center, settings rail, queue, now playing)
- Serato now-playing + history fallback; Rekordbox import
- Accept/decline + decline reasons + request alerts
- Public wall + shoutouts toggles
- Mix Coach + native drag-to-deck
- **BLE proximity beacon** (Windows + macOS) while gig live
- End gig, overlay dock, pin on top
- Auto-updater (GitHub releases via API)

### Crowd
- Request page, search, manual fallback, limits
- Share booth, public wall, accept/decline toasts
- Post-gig rating + tip button + follow/register CTA
- **Peer QR** — connected guest shares booth with friends (`ShareBooth` web + app FAB)
- `/dj/:handle` permanent link
- Web `/nearby` (Android Chrome Web Bluetooth)
- **Q Crowd mobile app** — iOS/Android BLE scan + WebView requests

### Community web
- Accounts (Supabase), profiles, studio (mix links)
- Feed, likes, comments, follows
- Top-rated DJs, settings (tip URL, socials)
- Marketing pages: features, for-djs, for-crowd, integrations

### API
- Sessions, library sync, requests, live status, mix-suggestions
- Gig ratings, session status/wall
- Accounts, mixes, engagement

### Not in v0.2.1
- Native Stripe checkout (tip URL only)
- Traktor / Virtual DJ / djay adapters
- Push when followed DJ goes live
- Full audio hosting for mixes

---

## BLE proximity (Mac + iOS first)

**Protocol:** Desktop advertises local name `Q-XXXXXX` + manufacturer data `0x0710` + 6-char code. Shared in `packages/shared/src/ble.ts`.

| Platform | Advertise (DJ) | Scan (guest) | Priority |
|----------|----------------|--------------|----------|
| **macOS desktop** | ✅ CoreBluetooth (`ble_beacon.swift`) | — | **P0** |
| **iOS Q Crowd app** | — | ✅ `react-native-ble-plx` | **P0** |
| Windows desktop | ✅ WinRT publisher | — | P1 |
| Android Q Crowd app | — | ✅ same Expo app | P1 |
| Crowd web `/nearby` | — | Android Chrome only | P2 |
| iPhone Safari | — | ❌ — use iOS app or QR | — |

**Why iOS app matters:** Apple does not expose Web Bluetooth in Safari. Without the native app, iPhone guests cannot “Find booth nearby” — only QR or typing the code.

**Test flow (field test):** MacBook → Q desktop → **Start gig** → BLE pill on → guest iPhone → **Q Crowd** → Find booth nearby → tap → request page (WebView to production crowd URL).

**App Store:** Bundle `app.q.crowd`; hosted crowd at `EXPO_PUBLIC_Q_CROWD_URL`; Bluetooth usage strings in `app.json`. Build: `eas build --platform ios` → TestFlight → review. See [apps/crowd-mobile/README.md](../apps/crowd-mobile/README.md).

---

## Pricing (intent)

| Tier | Price | Includes |
|------|-------|----------|
| **Q Free** | $0 | Full booth + crowd + community + ratings |
| **Q Pro** | TBD | AI co-pilot, verified boost, smarter blends (stub in API) |

Tips: DJ paste Stripe/PayPal/Cash App link (native checkout later).

---

## Success metrics (field test)

1. DJ completes full gig loop without developer help
2. ≥1 real request accepted from phone on LTE
3. Post-gig rating submitted and visible on profile
4. iOS app finds booth via BLE within ~10m of laptop
5. Serato DJ tester: library sync + now-playing + drag on at least one track

---

## Roadmap (next)

1. **Verify Mac BLE beacon** on real hardware (CoreBluetooth + Info.plist permission)
2. **TestFlight iOS crowd app** — `apps/crowd-mobile`, bundle `app.q.crowd`
3. Ship v0.2.1 — deploy API/crowd/web + desktop installers (Mac + Windows)
4. **App Store** Q Crowd (guest) — BLE nearby as headline feature
5. EAS Android build for Play Store
6. Native Stripe tips
7. Traktor adapter
8. Venue/discovery from gig ratings (top-rated is seed)

---

## Related docs

- [README.md](../README.md) — monorepo, local dev, API summary
- [LOCAL-TEST.md](./LOCAL-TEST.md) — gig smoke test
- [PRODUCTION-DEPLOY.md](./PRODUCTION-DEPLOY.md) — Render/Vercel/App Store prep
- [RELEASE-0.2.1.md](./RELEASE-0.2.1.md) — release checklist
