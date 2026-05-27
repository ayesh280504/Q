# Phase build status (local — not pushed yet)

Track implementation before deploy. See [ROADMAP.md](./ROADMAP.md) for full product context.

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Real-gig validation (Rekordbox, Serato Spotify, friction list) | Checklist only — [PHASE-0-CHECKLIST.md](./PHASE-0-CHECKLIST.md) |
| **1** | Desktop stability hardening | **Built locally** |
| **1B** | Q Booth mobile (Expo) | **Scaffold built** — `apps/booth` |
| **1C** | Tray / autostart / DJ software sentinel | Sentinel command + pref UI |
| **1.5** | Spotify booth parity | API stub `/spotify/now-playing` |
| **2** | Social layer polish | Permanent QR on web profile |
| **3** | Q Pro moat | Roadmap only (not started) |

## Phase 1 checklist

- [x] `fetchWithTimeout` on desktop API
- [x] Sync poll 4s / 15s / 30s
- [x] Sync engine per-step try/catch
- [x] Crowd offline landing (`/dj/:handle`)
- [x] Booth only vs Crowd live work mode
- [x] Offline suggestions enriched (BPM/key from now playing)
- [x] Non-blocking accept/decline (no `busy` lock on network)
- [x] Welcome tour local-first copy
- [x] [INVESTOR-ONE-PAGER.md](./INVESTOR-ONE-PAGER.md)
- [x] API `live_status` + `is_live` + end gig

## Phase 1B checklist

- [x] `apps/booth` Expo app in monorepo
- [x] Auth (account token)
- [x] Start gig / End gig + library profile picker
- [x] Request feed + swipe accept/decline + decline reasons
- [x] Live header (poll `live_status`, large BPM/key)
- [x] Suggestions strip after accept
- [x] AMOLED UI, haptics, copy crowd link, pull-to-refresh
- [ ] Supabase auth (optional — email/password works)
- [ ] Bluetooth receive (Phase 1C)
- [ ] App Store / Play build + EAS

## Phase 1C checklist

- [ ] `detect_dj_software_running` Tauri command
- [ ] Autostart preference (localStorage + doc)
- [ ] System tray (future — needs UI design)
