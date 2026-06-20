export type MarketingFeature = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  accent?: "pink" | "cyan" | "purple";
};

export const BOOTH_FEATURES: MarketingFeature[] = [
  {
    id: "mix-coach",
    title: "Mix coach + drag to deck",
    description:
      "Harmonic next-track picks from your synced library — drag ⠿ onto Serato or Rekordbox. No Serato API key required.",
    bullets: [
      "BPM + Camelot scoring against now playing",
      "Native OS file drag (same as Banger Button)",
      "Auto Q Requests crate when you accept crowd tracks",
    ],
    accent: "cyan",
  },
  {
    id: "command-center",
    title: "Command Center",
    description:
      "One full-screen booth layout: QR in the center, queue on the rail, now playing live from your decks.",
    bullets: [
      "Serato History + Rekordbox Pro DJ Link now-playing",
      "Mini overlay dock beside your software",
      "Pin on top — never lose the queue behind Serato",
    ],
    accent: "pink",
  },
  {
    id: "library",
    title: "Real library truth",
    description:
      "Import Serato crates and Rekordbox XML — not just folder scans. Streaming-heavy DJs get Spotify + crate search together.",
    bullets: [
      "Local · Spotify · Both crowd search profiles",
      "Privacy filters hide VIP edits from the crowd",
      "HOT / NEW badges from your actual play history",
    ],
    accent: "cyan",
  },
  {
    id: "gatekeeper",
    title: "Accept / decline gatekeeper",
    description:
      "Every request lands on your screen. You stay in the mix — no shouting, no guessing who asked for what.",
    bullets: [
      "Structured decline reasons guests see on their phone",
      "BPM & key on every request card",
      "Sound + desktop notification when a request lands",
    ],
    accent: "purple",
  },
  {
    id: "offline",
    title: "Offline-first booth",
    description:
      "Bad venue Wi‑Fi won't stop the set. Accept, decline, and import library offline — sync on hotspot between sets.",
    bullets: [
      "Decisions queue locally until signal returns",
      "Auto-built Q Requests crate / playlist",
      "Booth-only mode — zero background polling during the set",
    ],
    accent: "pink",
  },
  {
    id: "permanent-qr",
    title: "Permanent crowd QR",
    description:
      "One sticker on your gear: /dj/yourhandle always points to tonight's gig when you're live.",
    bullets: [
      "No new event page every wedding or club night",
      "Community profile + gig ratings after last call",
      "Guests follow you on Q — not just an email list",
    ],
    accent: "cyan",
  },
  {
    id: "mobile-booth",
    title: "Q Booth mobile companion",
    description:
      "Swipe accept/decline from your phone at the mixer when you step away from the laptop.",
    bullets: [
      "Live BPM/key HUD pushed from desktop",
      "Transition hints after you accept",
      "Same queue — phone or laptop",
    ],
    accent: "purple",
  },
];

export const CROWD_FEATURES: MarketingFeature[] = [
  {
    id: "no-app",
    title: "No app install",
    description: "Scan the QR on LTE. No venue Wi‑Fi, no App Store, no account during the set.",
    accent: "pink",
  },
  {
    id: "search",
    title: "Search-first requests",
    description:
      "Guests find tracks like Spotify — not a wedding form with shoutout tabs and event dates.",
    bullets: [
      "DJ library + Spotify hybrid search",
      "Manual fallback when search misses",
      "In-crate badges so guests know you can play it",
    ],
    accent: "cyan",
  },
  {
    id: "status",
    title: "Request status on your phone",
    description: "See when the DJ accepts or passes — with a reason, not a mystery.",
    accent: "purple",
  },
  {
    id: "share",
    title: "Bring a friend",
    description: "Share the booth link or friend QR so the whole table can request.",
    accent: "pink",
  },
  {
    id: "wall",
    title: "Live request wall",
    description:
      "Optional hype wall — the room sees what's being asked for. Off by default for club mode.",
    accent: "cyan",
  },
  {
    id: "after",
    title: "After the set",
    description:
      "Rate the DJ, follow their profile, browse mixes on the community feed — conversion without login during the gig.",
    accent: "purple",
  },
];

export const COMMUNITY_FEATURES: MarketingFeature[] = [
  {
    id: "profile",
    title: "Public DJ profile",
    description: "Handle, mixes, bio, social links, verified badge, and crowd gig ratings.",
    accent: "pink",
  },
  {
    id: "feed",
    title: "Mix feed",
    description: "Share sets, get likes, saves, and comments. Following tab for DJs you love.",
    accent: "cyan",
  },
  {
    id: "studio",
    title: "Web studio",
    description: "Manage your profile and mix locker from any browser — booth app syncs your account.",
    accent: "purple",
  },
];

export const COMPARE_NSR: { q: string; them: string }[] = [
  {
    q: "Mix coach + drag onto Serato/Rekordbox decks",
    them: "Banger Button subscription for live suggestions only",
  },
  {
    q: "Search-first crowd UX — three taps to request",
    them: "Form-heavy pages with shoutouts, themes, tabs",
  },
  {
    q: "Command Center + overlay beside your DJ software",
    them: "Separate phone app as primary workflow",
  },
  {
    q: "Community identity after the gig — follow, ratings, mixes",
    them: "Email list / MyFans marketing CRM",
  },
  {
    q: "Club-default: private DJ queue, optional public wall",
    them: "Public vote walls and tip leaderboards by default",
  },
];

export const CHANGELOG_021 = [
  "Command Center layout — QR center, queue rail, live now playing",
  "Share booth link + friend QR on crowd page",
  "Post-gig rating → aggregate on DJ profile",
  "Faster end-gig detection (~2s poll)",
  "Serato multi-session history scan fix",
  "Guest notes / shoutouts + optional live request wall",
  "Desktop request alerts — sound + notification",
  "Mix coach — harmonic suggestions + drag tracks onto Serato/Rekordbox",
  "Crowd accept/decline status toasts",
];
