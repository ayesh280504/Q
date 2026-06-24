# gBETA Frontier Technology — Interview Prep (Q)

**Program:** gBETA Frontier Technology · inaugural cohort · starts **July 9, 2026**  
**Host:** Waukesha County Technical College (WCTC)  
**Operator:** [gener8tor](https://www.gener8tor.com/)  
**Interview lead:** Pushkaraj Kalkar  
**Format:** ~10 min pitch + ~10 min Q&A (20 min total)

**Schedule slots (CT):**

- Thu **June 25** · 10:00 AM – 12:00 PM  
- Fri **June 26** · 11:00 AM – 1:00 PM  
- Mon **June 29** · 11:00 AM – 1:00 PM  
- Tue **June 30** · 9:00 AM – 11:00 AM  

[Book via the link Pushkaraj sent.]

---

## What gBETA Frontier Technology actually is

This is **not** a generic startup accelerator. It’s a new program from the **Wisconsin Frontier Technology Consortium**, funded by a **~$950K WEDC Ignite Wisconsin** grant, designed to:

1. **Commercialize frontier tech** born in Wisconsin (or built by founders who will grow here)
2. **Connect technical founders** to customers, mentors, and investors
3. **Keep companies in-state** — “grow here, scale here”

**Consortium members:** Wisconsin Technology Council, UW–Madison, WARF, gener8tor, WCTC, MMAC.

**Program terms:**

- **Free, zero equity** (classic gBETA model)
- **7 weeks**, ~**5 startups per cohort**
- Concierge coaching + gener8tor’s national mentor/investor network
- Hosted at **WCTC** — ties to applied tech / workforce / industry partnerships

**Official focus areas (from press + flyer):**

- Advanced materials  
- Advanced sensing  
- Artificial intelligence  
- Energy storage  
- Intelligent systems  
- Robotics  
- Quantum computing & sensing  

You do **not** need to be in quantum or robotics. You need a credible **technical moat** and a path to **commercialization**.

---

## Why Q is a strong fit (your narrative)

gBETA wants **technical founders bridging innovation → customers**. Q is stronger than a generic consumer app because:

### 1. Intelligent systems (strongest frame)

Q is a **distributed local-first system**:

- DJ laptop = edge node (library, accept/decline, drag-to-deck, offline outbox)
- Cloud = coordination layer (metadata-only sync, sessions, ratings)
- Phones = client nodes (LTE, no venue dependency)

That’s an **intelligent orchestration problem**, not a CRUD app.

### 2. Advanced sensing (differentiator)

- **BLE proximity protocol** — desktop advertises `Q-XXXXXX`; iOS app discovers booths without QR
- **Serato live state** — parsing `master.sqlite` for now-playing (non-trivial integration)
- **Library metadata extraction** — Serato + Rekordbox parsers for real crate search

Say: *“We built a proximity discovery layer because iPhone Safari can’t scan BLE — that’s sensing + platform constraints, not a marketing feature.”*

### 3. AI (honest, not hype)

**Today:** Harmonic Mix Coach — Camelot wheel + BPM scoring for next-track suggestions  
**Roadmap:** Q Pro AI co-pilot (set-aware suggestions, smarter blends)

Don’t oversell LLM magic. Frame AI as **decision support at the booth** with structured music theory + library context.

### What to de-emphasize

- Wedding merch / tickets (competitors’ game, not yours)
- “We’re the Uber for DJs” (too vague)
- BLE mesh / geofencing (you wisely deferred these — shows discipline)

---

## What Pushkaraj is evaluating

From his email + gBETA’s model, expect scoring on:

| Dimension | What “good” looks like |
|-----------|------------------------|
| **Team** | Can *you* ship hard tech? Evidence: full stack built, production deploy, Serato/BLE depth |
| **Genesis** | Authentic problem; clear “why now” (mobile crowd, dead venue Wi‑Fi, iPhone BLE gap) |
| **Technology** | Real moat — not a Retool wrapper |
| **Market** | Two-sided platform with wedge (DJs) and expander (crowd network) |
| **Traction** | Honest early signal — pilots, gigs, product live; they know you’re pre-seed |
| **Program fit** | Specific asks: pilot intros, investor prep, WI ecosystem — not “I want mentorship” |

Pushkaraj’s background (from WTC coverage): focused on helping **technical founders bridge innovation and commercialization** from WCTC. Speak **founder-to-operator**: problem → system → proof → ask.

---

## Q vs VYU — how to handle it

They may ask why Q and not VYU (your travel/social app).

**Recommended framing:**

> “VYU is a collaborative travel product — Stripe split payments, Duffel API, 72 surveyed users. **Q is the better fit for Frontier Technology** because it combines **advanced sensing** (BLE protocol on CoreBluetooth/WinRT), **intelligent edge/cloud architecture** (offline-first booth sync), and deep OS integration with Serato — plus **8 professional DJs in live beta**. I’m pitching the company that best matches this cohort and is closest to commercial pilots.”

Be ready to name VYU briefly without derailing the interview.

---

## Likely Q&A — prepared answers

### “Is anyone paying?”

> “Pre-revenue. v0.2.1 is live and I’m running field tests with working DJs. The plan is free tier for network growth, Q Pro subscription for AI co-pilot and verified boost, plus tips flow-through. gBETA would help me convert pilots into paying early adopters.”

### “How is this different from NoSongRequests?”

> “NSR is wedding SaaS — forms, merch, tickets. Q is a **booth tool** for DJs who actually mix: Serato/Rekordbox import, offline operation, drag-to-deck, harmonic coach, and a crowd product that searches **their real library**. Different buyer, different moat.”

### “What’s the moat if Spotify or Apple builds this?”

> “Apple and Spotify don’t integrate with **local Serato crates**, **offline booths**, or **BLE booth discovery**. Our moat is local library truth + native DJ workflow + two-sided reputation loop after the gig.”

### “Why does BLE matter if QR exists?”

> “QR always works — it’s our universal fallback. BLE is for **repeat guests and iPhone users** at loud venues: tap ‘Find booth nearby’ instead of fighting camera focus and line-of-sight to a laptop sticker. It’s discovery UX, built on a custom protocol.”

### “Are you solo? Is that a risk?”

> “Yes, solo founder today — but I’ve shipped **two full-stack products** (Q and VYU), hold **Security+**, and ran security engineering internships at Vail Systems and Baxter Credit Union. The technical risk on Q is largely retired; the next risk is distribution, which is why I’m here.”

### “Why Wisconsin / why this program?”

> “I’m a **UW–Madison senior** graduating May 2026 — this consortium literally includes **UW and WARF**. I want Q’s first dense market to be **Madison and Milwaukee events** before national scale. gBETA Frontier Technology is the bridge from working prototype → local pilots → investor-ready, without leaving Wisconsin.”

### “What would you do in the 7 weeks?”

> “Three outcomes: (1) **5–10 pilot DJs** with measurable gigs, (2) **TestFlight → App Store** for Q Crowd iOS, (3) **seed-ready metrics** — requests per gig, rating rate, BLE join rate — and intros to WI investors.”

### “Show me the demo.”

Have laptop + phone ready. Narrate: *“Music never leaves the laptop — watch the request appear on LTE while the crate stays local.”*

---

## Wisconsin / consortium angles (use one if natural)

- **Events & hospitality** — weddings, clubs, festivals statewide  
- **Manufacturing / intelligent systems** — Wisconsin’s industrial base maps to “edge + cloud” narrative  
- **WCTC applied AI lab** — gener8tor already runs applied-AI cohorts at WCTC; you’re adjacent (decision support, not LLM chatbot)  
- **Talent** — intern or part-time help from technical college pipeline for QA / field tests  

---

## Day-before checklist

- [ ] Slide deck exported (10 slides max) — see [gBETA-PITCH-DECK.md](./gBETA-PITCH-DECK.md) *(personalized with your resume)*
- [ ] Laptop charged; phone on LTE (not venue Wi‑Fi) for demo  
- [ ] Screen recording backup if live demo fails  
- [ ] Production URLs open in tabs  
- [ ] 2-min and 5-min verbal pitches rehearsed out loud  
- [ ] Question for them prepared: *“What does success look like for a two-sided platform in this cohort vs. a B2B deep-tech vendor?”*

---

## Questions to ask Pushkaraj (pick 2)

1. “For the inaugural Frontier Tech cohort, are you optimizing for **first customers in Wisconsin** or **investor readiness for national scale**?”  
2. “Which mentor profiles have been most helpful for **hardware-adjacent / BLE** companies in past gBETA programs?”  
3. “What traction bar do alumni typically hit before gener8tor introduces **seed investors**?”  
4. “Is there a preferred path to **WARF / UW–Madison** technical advisors if we expand signal-processing or audio ML?”  

---

## Key links (research)

- [MKE Startup News — program launch](https://mkestartup.news/wisconsin-frontier-technology-consortium-launches-gbeta-frontier-technology-accelerator/)  
- [Wisconsin Technology Council — Kalkar announcement](https://wisconsintechnologycouncil.com/mke-startup-news-kalkar-to-lead-gbeta-frontier-technology-accelerator/)  
- [WEDC / Ignite Wisconsin context](https://wisconsintechnologycouncil.com/milwaukee-business-journal-applications-open-for-new-accelerator-targeting-early-stage-startups/)  
- Q product depth: [PRD.md](./PRD.md)

---

## One-paragraph elevator pitch (memorize)

> **Q is a two-sided DJ platform.** The crowd requests tracks on their phones over LTE — no venue Wi‑Fi. The DJ runs a local-first Command Center on their laptop: real Serato and Rekordbox integration, accept/decline control, harmonic Mix Coach, and drag-to-deck. I built a custom BLE proximity protocol — CoreBluetooth on Mac, WinRT on Windows — so iPhone guests can find the booth without scanning a QR. Music never leaves the laptop; only metadata syncs. **Eight professional DJs** are in live beta. I’m a **UW–Madison senior** with Security+ and security engineering experience; v0.2.1 is in production. I’m here because Q is an intelligent edge-cloud system with real sensing depth, and gBETA is the bridge to Wisconsin pilot customers and seed readiness.

---

## Founder snapshot (from resume — for your reference)

| | |
|--|--|
| **Name** | Ayesh Chandrasekera |
| **School** | UW–Madison · B.S. Information Science (CS & Data Science minors) · May 2026 |
| **Cert** | CompTIA Security+ ce (July 2025) |
| **Recent work** | Info Security Engineer Intern, Vail Systems (Jun 2025 – Jan 2026) |
| **Q traction** | 8 pro DJs live beta · threat-modeled API · v0.2.1 production |
| **Other app** | VYU — social travel (React Native, Stripe, Duffel) · 72 surveyed users |
| **Contact** | ayesh2805@outlook.com · 847-393-5449 · github.com/ayesh280504 |
