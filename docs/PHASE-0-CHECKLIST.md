# Phase 0 — Booth validation (manual)

Do **not** treat Phase 1B+ as production-ready until these pass. No code required — run on real hardware.

## Rekordbox (brother's laptop)

- [ ] v0.1.7 installed; sign-in / opener works
- [ ] `rekordbox.xml` import or auto-detect
- [ ] Q Requests `.m3u8` appears in Music folder; tracks append on accept
- [ ] Decline menu smart-flip; reasons reach crowd page
- [ ] BPM/key visible (Pro DJ Link or manual Playing)
- [ ] Full mock gig: start → import → accept 3 → decline 2 → end

## Serato (your laptop)

- [ ] Auto-import Subcrates; Q Requests crate updates on accept
- [ ] **Spotify 60s test:** play one Spotify track ≥60s → open latest `History/Sessions/*.session` → track logged?
- [ ] If no History row → note for Phase 1.5 OAuth currently-playing

## Crowd / API

- [x] Spotify crowd search works (limit ≤10 without Extended Quota)
- [ ] Permanent QR `/dj/:handle` redirects when gig live; offline page when not

## Friction log (one real or mock gig)

| Time | What happened | Severity |
|------|----------------|----------|
| | | |

**Exit criteria:** 1 Serato + 1 Rekordbox session without show-stoppers.
