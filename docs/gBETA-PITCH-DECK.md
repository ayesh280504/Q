# Q — gBETA Frontier Technology Pitch Deck

**Format:** 10 slides · ~10 minutes · then 10 min Q&A  
**Interviewer:** Pushkaraj Kalkar · gBETA Frontier Technology (gener8tor / WCTC)  
**Tip:** They said don’t over-design — copy each slide into Google Slides or PowerPoint. One idea per slide.

---

## Slide 1 — Title

**Q**  
*Queue, not chaos.*

Two-sided DJ platform: crowd requests on their phones; DJ runs a local-first command center with real Serato/Rekordbox depth.

**Ayesh Chandrasekera** · Founder  
ayesh2805@outlook.com · Madison, WI · github.com/ayesh280504

---

## Slide 2 — Team

**Who I am**

- **UW–Madison** senior (B.S. Information Science, CS & Data Science minors) · graduating **May 2026**
- **CompTIA Security+** · security engineering intern experience (Vail Systems, Baxter Credit Union)
- Solo technical founder — built Q’s full stack: **Tauri/Rust desktop**, React web, Node API, **BLE proximity protocol** (CoreBluetooth + WinRT), Serato/Rekordbox parsers

**Why me for this problem**

- Security-first builder: rate limiting, threat modeling, offline-first sync — not a no-code wrapper
- **8 professional DJs** in live beta with structured feedback cycles
- Shipping **v0.2.1 in production** — not a slide deck idea

---

## Slide 3 — Genesis

**The moment**

Every DJ knows the scene: someone shoves a phone in your face, venue Wi‑Fi is dead, and “request apps” are really **wedding intake forms** — merch, tickets, paywalls — not tools for someone actually mixing on Serato.

**Insight**

The hard part isn’t a web form. It’s **respecting the DJ’s local library** (music never leaves the laptop), **working offline at the booth**, and giving the crowd a real path on **LTE** — no venue network required.

**Q started as:** fix the full loop — join → search the DJ’s actual crate → request → accept/decline → rate → follow → next gig.

---

## Slide 4 — Product (30-second version)

**Four surfaces, one loop**

| Who | What |
|-----|------|
| **DJ (desktop)** | Command Center: import crate, QR + BLE beacon, accept/decline, Mix Coach, drag-to-deck |
| **Crowd (web)** | Scan QR → search library + Spotify → request → status → post-gig rating |
| **Crowd (iOS app)** | **BLE “Find booth nearby”** — iPhone can’t do this in Safari |
| **Community (web)** | Profiles, gig ratings, follows, tips |

**One line:** Crowd uses LTE; DJ stays local-first; cloud only carries **metadata** — never audio files.

---

## Slide 5 — Technology (frontier-tech frame)

**Where Q fits gBETA focus areas**

| Focus area | What Q actually built |
|------------|----------------------|
| **Intelligent systems** | Local-first booth + cloud sync; offline outbox; harmonic Mix Coach (Camelot/BPM engine); session lifecycle orchestration |
| **Advanced sensing** | Custom **BLE proximity protocol** (`Q-XXXXXX` beacon); live **Serato SQLite** now-playing parse; Rekordbox/Serato library metadata extraction |
| **AI** | Harmonic next-track scoring today; **Q Pro** co-pilot on roadmap (smarter blends, set-aware suggestions) |

**Architecture (say this out loud):**

> BLE is **discovery only** — it broadcasts the session code. Requests ride **guest LTE → cloud API → DJ sync**. Music never leaves the laptop. That split is the technical moat.

**Stack:** Rust/Tauri desktop · React · Hono API · SQLite · Supabase auth · Expo iOS crowd app

---

## Slide 6 — Competitive landscape

**Not competing on wedding SaaS upsells**

| | **Q** | NoSongRequests / wedding SaaS | Crate Hackers / Banger Button |
|--|-------|------------------------------|-------------------------------|
| Crowd product (QR, search, status) | ✅ | Forms + merch/tickets | ❌ |
| Serato/RB depth + drag-to-deck | ✅ | ❌ | DJ-side only |
| Offline booth | ✅ | Cloud-first | N/A |
| BLE proximity join | ✅ | ❌ | ❌ |
| Post-gig reputation loop | ✅ | Event page | ❌ |

**Defensible stack:** local library truth · native file drag · proximity protocol · two-sided network effects (rate → follow → next gig)

---

## Slide 7 — Traction

**Built & shipped (v0.2.1)**

- ✅ Desktop Command Center (Windows + macOS) with Serato now-playing, queue, Mix Coach, BLE beacon
- ✅ Crowd web live: `https://q-crowd.vercel.app`
- ✅ Community + API in production
- ✅ Full gig loop: start session → QR → phone request on LTE → accept → play celebration → post-gig rating
- 🔄 Q Crowd iOS app → TestFlight next (`app.q.crowd`)

**Customers / validation**

- **8 professional DJs** in live beta — structured feedback cycles on real gigs
- Threat-modeled request network (IP rate limiting, spam/flood hardening)
- Production deploy live (crowd + community + API); full gig loop validated end-to-end
- TestFlight iOS crowd app next (`app.q.crowd`)

**Stage:** Pre-revenue, post-MVP — ready for pilot customers and App Store launch.

---

## Slide 8 — Demo

**Live (2 min) or backup video**

1. **Start gig** on laptop → session code + QR + BLE pill  
2. **Phone** (crowd web or iOS app) → search → submit request  
3. **Desktop** → accept → queue → now playing updates  
4. **End set** → crowd sees rating + DJ socials + tip link  

**Backup:** Screen recording + GitHub / production URLs if Wi‑Fi fails.

**URLs to have open:**

- Crowd: `https://q-crowd.vercel.app`
- Web: `https://q-web-liart.vercel.app`
- API health: `https://q-api-hp4b.onrender.com/health`

---

## Slide 9 — Market & vision

**Beachhead:** Mobile DJs, club/resident DJs, weddings — anyone on **Serato/Rekordbox** who wants controlled requests without chaos.

**Wedge:** Free booth + crowd (network growth) → **Q Pro** (AI co-pilot, verified boost) → native tips (Stripe later).

**12-month vision**

- App Store Q Crowd (BLE headline feature)
- **50+ active DJs in Wisconsin & Midwest** — Madison/Milwaukee events first
- Venue/promoter pilots; top-rated DJ discovery from gig ratings

**Why Wisconsin / gBETA:** UW–Madison student building in the **Frontier Technology Consortium** ecosystem (UW + WARF + WCTC). Events, hospitality, and intelligent systems align with growing **here** before national scale.

---

## Slide 10 — Why gBETA Frontier Technology

**What I need from the program**

| gBETA offers | How I’d use it |
|--------------|----------------|
| **Customer intros** | Pilot DJs, event companies, venues in WI |
| **Mentor network** | Go-to-market, hardware/BLE scale-up, investor narrative |
| **Investor readiness** | Seed story: two-sided platform + frontier-tech stack (sensing + intelligent systems) |
| **WCTC / consortium** | Technical credibility, possible talent or applied-AI lab ties |

**Cohort goal (7 weeks):**

1. **5–10 pilot DJs** running paid or promo gigs on Q  
2. **TestFlight → App Store** for Q Crowd iOS  
3. **Metrics:** requests/gig, rating completion, BLE join rate  
4. **Fundraise prep:** seed deck + WI investor conversations  

**Ask:** Feedback on positioning, intro to first pilot customers, and help sharpening the deep-tech story for investors who care about **systems**, not just “another app.”

---

## Appendix — If they ask “what about VYU?”

**VYU** is my other project — a collaborative social travel app (React Native, Supabase, Stripe, Duffel API) with 72 surveyed users and secure payment orchestration.

**Suggested answer:**

> “VYU is a consumer fintech/travel product. **Q maps directly to frontier tech** — BLE sensing, local-first intelligent systems, CoreBluetooth/WinRT integration, and offline sync at the edge. Q is further along on **live beta with working DJs**, has a clearer two-sided market, and fits Wisconsin’s events ecosystem. That’s why I’m pitching Q for this cohort.”

---

## Speaker notes — timing (10 min)

| Slide | ~Time | Focus |
|-------|-------|-------|
| 1–2 | 1:00 | Credibility fast |
| 3 | 1:00 | Story — make them feel the problem |
| 4 | 1:30 | Product clarity |
| 5 | 2:00 | **Deep tech — don’t skip** |
| 6 | 1:00 | Why you win |
| 7 | 1:00 | Honest traction |
| 8 | 1:30 | Show, don’t tell |
| 9–10 | 1:00 | Vision + why gBETA |
