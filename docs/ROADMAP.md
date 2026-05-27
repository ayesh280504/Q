# Q — Product roadmap (full)

> Living doc. Synthesizes **all DJ discovery from the Gemini thread**, booth testing (v0.1.7), and repo state.
>
> **North star:** DJs trust Q because the **set never stutters** — crowd features are optional; the laptop is not the internet's hostage.

---

## Table of contents

1. [Everything you asked (inventory)](#everything-you-asked-inventory)
2. [What DJs told us](#what-djs-told-us)
3. [Architecture: minimal-risk requests](#architecture-minimal-risk-requests)
4. [Architecture: mobile DJ portal vs desktop overlay](#architecture-mobile-dj-portal-vs-desktop-overlay)
5. [Architecture: laptop offline + phone bridge](#architecture-laptop-offline--phone-bridge)
6. [What Q already has vs Gemini vision](#what-q-already-has-vs-gemini-vision)
7. [Phased roadmap](#phased-roadmap)
8. [Pitch scripts](#pitch-scripts)
9. [Open decisions](#open-decisions)

---

## Everything you asked (inventory)

Check these off as you learn / ship.

### Product & trust

| # | Your question / idea | Short answer | Roadmap phase |
|---|----------------------|--------------|---------------|
| Q1 | Best **minimal-risk** way to get requests to the DJ? | Async cloud queue + DJ polls; crowd never touches laptop | ✅ Mostly built; harden Phase 1 |
| Q2 | Scared bad connection **interrupts the set**, not just requests | Network off main path; timeouts; optional phone HUD | Phase 1 + 1B |
| Q3 | Does laptop need internet at all for trust? | Core: no. Start gig once: yes today. Crowd: their LTE | Phase 1 messaging + optional phone |
| Q4 | Spotify DJs are already online — does that change Q? | Their *audio* needs net; Q still reads **local** logs + metadata | Positioning only |
| Q5 | **Mobile DJ portal** — whole app or PWA? | Native **React Native/Expo** for trust (App Store) | Phase 1B |
| Q6 | Can DJ see **live BPM/key on phone** if requests move to phone? | Yes — laptop → phone via Bluetooth or tiny cloud status | Phase 1B |
| Q7 | **Permanent QR per DJ** vs new QR every gig? | Print once `@handle`; redirect when live | ✅ Partially built |
| Q8 | **Start gig from phone** instead of desktop? | Yes — phone updates cloud; optional BT command to EXE | Phase 1B |
| Q9 | Must EXE be **installed on laptop**? | **Yes** — only thing that reads Serato/Rekordbox files | Non-negotiable |
| Q10 | EXE must be **running** when phone starts gig? | Can't wake closed app from phone; use **autostart + sleep** | Phase 1C |
| Q11 | **Autostart** when laptop boots / when Serato opens? | `auto-launch` + process sentinel (`tasklist`) | Phase 1C |
| Q12 | How to **pitch non-technical DJs**? | 30-sec script below | Use now |
| Q13 | How does **Bluetooth** work (plain English)? | Paired walkie-talkie for tiny JSON text; laptop stays offline | Phase 1B optional |
| Q14 | Is this a big segue from current EXE? | **No** — split: EXE = brain; phone = live HUD | Phase 1B |
| Q15 | Social layer / prettier website — when? | After booth validation (Phase 0) | Phase 2 |

---

## What DJs told us

### Insight 1 — "Stability above all else"

- Laptop freeze/lag mid-set = career damage
- Forcing hotspot for core workflow = **dealbreaker**
- **Fix:** local-first core; crowd = optional add-on

### Insight 2 — Virtual DJ + "old school" requests

- VDJ = beginner/mobile; pros want **control**
- Q = **suggestion only**, never auto-mix / auto-load decks
- Old school = shout + search Serato; Q = **unified crate lookup + digital queue**

### Investor line (Erica Wenger)

> "When interviewing resident DJs in NYC and Wisconsin, their biggest feedback was stability in club environments. I engineered Q with a local-first architecture: core crate sync and suggestion engines run offline with zero latency, protecting creative control without risking the performance."

---

## Architecture: minimal-risk requests

**Your fear:** crowd traffic or bad Wi‑Fi **freezes Serato**.

**Gemini prescription:** "Air-gapped request bridge" — crowd → cloud only; DJ laptop pulls async.

### How Q works today (already close)

```
[Crowd phones, LTE] ──POST──► [Cloud API + SQLite]
                                    ▲
                    async poll (4s when online)
                                    │
[Laptop: Tauri app] ◄── read/write local state + outbox
        │
        └── UI reads LOCAL state only (not blocking on fetch)
```

| Safety property | Status today | Target |
|-----------------|--------------|--------|
| Crowd never connects to laptop | ✅ | ✅ |
| Spam hits cloud rate limits, not laptop | ✅ API limits | ✅ |
| Accept/decline works offline | ✅ outbox | ✅ |
| Fetch failures don't blank UI | ⚠️ | ✅ silent retry + 3s timeout |
| Poll doesn't block audio/UI thread | ⚠️ 4s interval in JS | ✅ configurable 15–30s + timeout |
| DJ reads from local cache | ✅ React state | ✅ explicit "last synced" |

### Hardening checklist (Phase 1)

- [ ] `fetchWithTimeout(3000)` on all sync calls
- [ ] Catch network errors silently; show subtle "last sync 2m ago"
- [ ] Optional: increase poll to **15–30s** when overlay-only (settings)
- [ ] Never `await` network on accept/decline click path
- [ ] Document: **worst case** = requests arrive late; **music never stops**

---

## Architecture: mobile DJ portal vs desktop overlay

**Gemini recommendation:** Move **live booth UI** to phone; laptop = headless engine.

| Approach | Pros | Cons | Q today |
|----------|------|------|---------|
| **Desktop overlay** (Tauri on same screen as Serato) | One device; already built | Screen space; network on performance laptop | ✅ v0.1.7 |
| **PWA on phone** | Fast to ship | Less "pro"; no App Store trust | ❌ You rejected |
| **React Native / Expo** | App Store trust; glanceable HUD; air-gaps laptop screen | New app; BT/native modules; Apple $99/yr | ❌ Planned 1B |
| **Phone only, no laptop** | — | **Impossible** — can't read Serato files | ❌ |

**Recommended product split (Gemini-aligned):**

| App | Role | When used |
|-----|------|-----------|
| **Q Desktop (EXE)** | Read RB/Serato DB + history; optional tray daemon; BT broadcast | Installed once; background at gig |
| **Q Booth (mobile)** | Start/end gig; live BPM/key; request feed; swipe accept/decline | On mixer stand |
| **Q Crowd (web)** | Scan QR; search; submit | Guest phones |
| **Q Web (marketing)** | Download, community, profiles | Discovery |

**You do NOT rewrite the brain** — you add a second client that talks to the same API (+ optional Bluetooth).

---

## Architecture: laptop offline + phone bridge

**Goal:** Performance laptop can stay **off venue Wi‑Fi**; set still works.

### Three ways to get "now playing" + requests to the phone

| Channel | Laptop internet? | Phone internet? | Complexity | Best for |
|---------|------------------|-----------------|------------|----------|
| **A. Cloud status (tiny JSON)** | Only for push (~1KB/track) | Yes (LTE) | Low | MVP phone portal |
| **B. Bluetooth SPP** | No | No (BT only) | Medium | Maximum laptop isolation |
| **C. Local WebSocket (LAN)** | No (ad-hoc Wi‑Fi) | No (same LAN) | Medium | Home rehearsal |

**Gemini leaned B for trust story; A is faster to ship.**

### Data flows (target state)

```
┌─────────────────────────────────────────┐
│  LAPTOP (Wi‑Fi OFF ok)                  │
│  Serato/RB → Q EXE reads local files    │
│       │                                 │
│       ├──► Bluetooth: {bpm,key,title}   │──┐
│       └──► (optional) cloud live_status │  │
└─────────────────────────────────────────┘  │
                                             ▼
┌─────────────────────────────────────────┐
│  DJ PHONE (LTE)                         │
│  • Pull crowd requests from cloud       │
│  • Show now playing + suggestions       │
│  • Start gig / End gig                  │
│  • Swipe accept / decline               │
└─────────────────────────────────────────┘
         ▲
         │ crowd requests (LTE)
┌────────┴────────┐
│  CROWD PHONES   │
└─────────────────┘
```

### Bluetooth (your clarification question)

**One sentence:** Laptop and phone are paired once; when a track changes, the EXE sends a **tiny text JSON** over Bluetooth — like a wireless serial cable. Laptop does not need Wi‑Fi.

**Setup:** Pair in OS settings → EXE runs BT server → phone app listens → parse `{ bpm, key, title, artist }`.

**Tech note:** Needs Expo **dev client** (not Expo Go) for `react-native-bluetooth-classic` or similar. Desktop: Rust or Node BT module from Tauri side.

### Start gig from phone

1. Phone → API: `is_live = true`, `active_gig_id = …` (unlocks permanent QR) — **can build on existing `/djs/:handle/active-gig`**
2. Phone → Bluetooth: `{"command":"START_GIG","settings":{...}}`
3. EXE wakes log watcher

**EXE must be running** (tray). Cannot launch closed Windows app from phone. **Workaround:** autostart on boot + sleep until START_GIG or Serato detected.

### Wake when Serato/Rekordbox opens

Poll `tasklist` every 5s for `Serato DJ.exe` / `rekordbox.exe`:

- Software opens → start history watcher + BT server
- Software closes → sleep (0% CPU story for DJs)

---

## What Q already has vs Gemini vision

| Gemini idea | Q today | Gap |
|-------------|---------|-----|
| Async crowd → cloud → DJ poll | ✅ 4s sync + outbox | Timeouts, slower poll option |
| Local library import offline | ✅ | — |
| Permanent QR `@handle` | ✅ `crowd.app/dj/:handle` → active gig | Sticker UX + "offline" landing page |
| Per-session code QR | ✅ Still works | Both models OK |
| Mobile portal native app | ❌ | Phase 1B |
| Bluetooth laptop ↔ phone | ❌ | Phase 1B optional |
| Start gig from phone | ❌ Desktop only | Phase 1B |
| EXE autostart / Serato wake | ❌ | Phase 1C |
| Swipe accept on phone | ❌ | Phase 1B |
| Now playing on phone | ❌ Desktop overlay | Phase 1B |
| Suggestion engine fully offline | ⚠️ stub | Phase 1 |
| No automation positioning | ✅ accept/decline only | Marketing |
| Accounts + community | ✅ foundation | Phase 2 polish |

**Important:** You do **not** throw away the desktop app. You **narrow** it to engine + optional overlay for DJs who prefer one screen.

---

## Phased roadmap

### Phase 0 — Booth bulletproof (now)

**Do not start mobile app until these pass.**

1. Brother's laptop — Rekordbox (XML, sign-in, Q Requests, decline, BPM/key)
2. Serato Spotify → History `.session` test
3. One real/mock gig — friction list
4. Spotify crowd search — ✅ fixed (limit 10)

**Exit:** 1 Serato + 1 Rekordbox gig without show-stoppers.

---

### Phase 1 — Stability hardening (desktop, ~2 weeks)

Align code + copy with "stability above all else."

| ID | Work |
|----|------|
| 1.1 | Network: 3s timeouts, silent failures, non-blocking accept path |
| 1.2 | Poll interval setting: 4s / 15s / 30s |
| 1.3 | Offline suggestions enriched (`localSuggestionsOffline`) |
| 1.4 | UX: **"Booth only"** vs **"Crowd live"** modes in sidebar |
| 1.5 | Marketing: local-first, crowd optional, music never uploaded |
| 1.6 | Permanent QR: crowd **offline landing** when DJ not live |
| 1.7 | Investor one-pager |

---

### Phase 1B — Q Booth mobile app (~4–6 weeks)

**New:** React Native (Expo) — App Store / Play Store.

| ID | Work |
|----|------|
| 1B.1 | Expo app scaffold; auth (same Supabase/account token) |
| 1B.2 | **Start gig / End gig** → API + unlock `/dj/:handle` |
| 1B.3 | Request feed: pull `/requests`, swipe accept/decline |
| 1B.4 | Live header: now playing BPM/key (via API `live_status` from desktop push) |
| 1B.5 | Suggestions strip (from last desktop sync or cloud) |
| 1B.6 | Dark AMOLED UI — glanceable from 2 ft |
| 1B.7 | (Optional) Bluetooth receive from desktop EXE |

**MVP path without Bluetooth:** Desktop EXE pushes `nowPlaying` to API every track change (1KB); phone polls. Laptop still needs **brief** connectivity for that push — or DJ uses desktop overlay for one more release.

**Trust path with Bluetooth:** Laptop stays Wi‑Fi off; phone gets BPM/key over BT; phone uses LTE only for crowd requests.

---

### Phase 1C — Desktop daemon (~2 weeks, parallel or after 1B)

| ID | Work |
|----|------|
| 1C.1 | System tray mode — minimal UI |
| 1C.2 | Autostart on Windows login (`auto-launch` or registry) |
| 1C.3 | Serato/Rekordbox process sentinel |
| 1C.4 | Bluetooth server in Rust (Tauri) or sidecar |
| 1C.5 | Listen for `START_GIG` / `END_GIG` from phone |

---

### Phase 1.5 — Spotify booth parity

| ID | Work |
|----|------|
| 1.5a | History parser for streaming tracks (if logs exist) |
| 1.5b | Else: Spotify OAuth + currently-playing |
| 1.5c | Extended Quota → search limit 50 |

---

### Phase 2 — Social layer (after booth trusted)

Per your plan + `docs/COMMUNITY.md`:

- Profile polish, feed UX, marketing refresh
- Permanent QR on printed sticker (design template)
- Follow/save DJ, gig history metadata

---

### Phase 3 — Q Pro & moat

- Cross-crate "where does this track live?"
- Pro transition hints (Camelot, BPM delta)
- Traktor, payments

---

## Priority matrix (updated)

```
                    DJ TRUST / SET SAFETY
                    high ─────────────────────────────►
                    │
    Phase 0         │  Rekordbox + Serato validation
    (you, now)      │  Spotify History test
                    │
    Phase 1         │  Async sync hardening (timeouts)
                    │  Offline suggestions + marketing
                    │
    Phase 1B        │  Native phone booth app  ◄── Gemini big bet
                    │  Start gig + permanent QR from phone
                    │
    Phase 1C        │  Tray daemon + Serato wake + BT
                    │
    Phase 2         │  Social / website polish
                    │
    Phase 3         │  Q Pro transitions
                    ▼
              low effort ─────────────────────────────► high effort
```

**Your sequence (confirmed):**

1. Phase 0 tests (Rekordbox brother + Spotify)
2. Phase 1 stability (quick wins on existing desktop)
3. Phase 1B mobile — **not a rewrite**; new client
4. Phase 2 social — when DJs trust the booth

---

## Pitch scripts

### 30-second pitch (non-technical DJ)

> "I built **Q** for resident and open-format DJs. At home, the desktop app reads your Serato or Rekordbox library offline and helps you prep — where tracks live, BPM, key, transition ideas. It never auto-mixes; you're still in control.
>
> At the gig, you can put your **phone** on the stand: guests scan **one QR** you printed once, request songs on their own data, and you swipe accept or ignore. Your **laptop doesn't have to fight the venue Wi‑Fi** — the heavy stuff stays local; your phone handles the crowd feed.
>
> Worst case if the internet dies? Your music keeps playing. You just sync requests when you have signal."

### Objection: "Will this lag my laptop?"

> "No. Crowd traffic never hits your laptop directly. Requests sit in the cloud; your app pulls them quietly in the background. If Wi‑Fi drops, the fetch fails silently — Serato doesn't know. We're not loading songs into your decks; it's a smart sticky-note + crate finder."

### Objection: "I need to install something?"

> "Yes — a small Windows utility once. It sits in the tray, almost no memory, and only reads your existing Serato files. Think of it like a driver for a wireless display on your phone. You control the gig from your phone; the laptop just translates what's playing."

### Objection: "Virtual DJ already does suggestions"

> "VDJ automates for beginners. Q is for Serato/Rekordbox pros — **suggestions only**, never telling you what to play. Plus we handle the crowd queue so you're not alt-tabbing while people shout in your ear."

---

## Open decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Phone MVP data path | Cloud status vs Bluetooth | Ship **cloud status** first; add BT in 1C |
| Keep desktop overlay? | Yes / deprecate | **Keep both** — overlay for early adopters; phone for pros |
| Poll interval default | 4s / 15s / 30s | **15s** default at gig; 4s dev only |
| macOS desktop | Blocked on Apple dev account | Windows first; Mac when account ready |
| React Native vs Tauri mobile | RN | **RN/Expo** per your App Store requirement |

---

## Implementation notes (when you open Cursor)

**Do not paste the entire Gemini thread.** Use focused prompts per slice:

1. `Phase 1`: "Add 3s fetch timeout to desktop sync; never block accept/decline"
2. `Phase 1B`: "New Expo app; auth; start gig; request list; PATCH accept/decline"
3. `Phase 1C`: "Tauri tray + Windows autostart + tasklist Serato detector"
4. `Phase 1C BT`: "Rust/Tauri Bluetooth SPP server; emit track JSON on history change"

Reference files: `apps/desktop/src/sync/engine.ts`, `apps/api/src/community.ts` (`active-gig`), `apps/crowd/src/pages/DjRedirectPage.tsx`.

---

## How to update this doc

- After each test: note pass/fail under Phase 0
- After each release: move rows in "What Q already has"
- Link PRs to phase IDs (e.g. `1B.3`)

**Related:** `README.md`, `docs/COMMUNITY.md`, `docs/PRE-DEPLOY-CHECKLIST.md`, `docs/RELEASING.md`
