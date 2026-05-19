# Q Community — Mix marketplace (v1 PRD)

## Vision

A free discovery layer where DJs share **promotional mixes** (links to SoundCloud, Mixcloud, etc.) — not their Serato/Rekordbox library files. Built for the love of DJing, separate from booth request mode.

## What's shipped (v1 foundation)

| Feature | Status |
|---------|--------|
| DJ accounts (Supabase: email + Google) | ✅ |
| Legacy API email/password (no Supabase) | ✅ fallback |
| Web onboarding tour | ✅ |
| Desktop first-run tour | ✅ |
| Public handle (`@handle`) | ✅ |
| Profile page `/dj/:handle` | ✅ |
| Mix locker (link-based uploads) | ✅ |
| Public mix feed `/community` | ✅ |
| Verified badge (DB flag, manual for now) | ✅ schema |
| Play counts | ✅ |
| Gigs linked to account when signed in | ✅ |
| Crowd redirect `/dj/:handle` → latest gig | ✅ |

## Not in v1

- Audio file hosting on Q servers
- Follow graph / comments / likes
- In-app verification workflow
- Native mix upload from Serato
- Paid tiers for feed boost

## API (summary)

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| GET | `/auth/me` | `X-Q-Account-Token` |
| GET | `/mixes/feed` | — |
| GET | `/djs/:handle` | — |
| GET | `/djs/:handle/active-gig` | — |
| POST | `/auth/mixes` | account token |
| POST | `/sessions` | optional account token |

## Next steps

1. Deploy API + web + crowd to production URLs
2. Permanent QR: encode `https://crowd.example/dj/{handle}` on stickers
3. Verification request flow (form → admin approve)
4. Feed ranking (engagement, not pay-to-win)
