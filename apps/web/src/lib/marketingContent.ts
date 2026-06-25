export type MarketingFeature = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  accent?: "pink" | "cyan" | "purple";
};

export const BOOTH_FEATURES: MarketingFeature[] = [
  {
    id: "command-center",
    title: "Command Center",
    description: "QR, queue, and now playing on one screen — or a mini dock beside Serato.",
    accent: "pink",
  },
  {
    id: "library",
    title: "Real library sync",
    description: "Import Serato crates or Rekordbox XML. Crowd searches what you actually play.",
    accent: "cyan",
  },
  {
    id: "gatekeeper",
    title: "You control the queue",
    description: "Accept or decline every request. Guests see status on their phone.",
    accent: "purple",
  },
  {
    id: "mix-coach",
    title: "Mix Coach",
    description: "Harmonic next-track picks. Drag onto Serato or Rekordbox.",
    accent: "cyan",
  },
  {
    id: "offline",
    title: "Works offline",
    description: "Bad Wi‑Fi? Keep mixing. Sync when you're back online.",
    accent: "pink",
  },
  {
    id: "permanent-qr",
    title: "One QR sticker",
    description: "Your /dj/handle always points to tonight's gig when you're live.",
    accent: "cyan",
  },
];

export const CROWD_FEATURES: MarketingFeature[] = [
  {
    id: "no-app",
    title: "No app needed",
    description: "Scan the QR on your phone. LTE works — no venue Wi‑Fi.",
    accent: "pink",
  },
  {
    id: "search",
    title: "Search & request",
    description: "Find tracks in the DJ's library or Spotify. Three taps.",
    accent: "cyan",
  },
  {
    id: "status",
    title: "Live status",
    description: "See when the DJ accepts or passes on your request.",
    accent: "purple",
  },
  {
    id: "share",
    title: "Bring a friend",
    description: "Share the booth link so your table can request too.",
    accent: "pink",
  },
  {
    id: "after",
    title: "After the set",
    description: "Rate the DJ, follow their profile, tip if you want.",
    accent: "cyan",
  },
];

export const COMMUNITY_FEATURES: MarketingFeature[] = [
  {
    id: "profile",
    title: "DJ profile",
    description: "Handle, mixes, bio, socials, and gig ratings.",
    accent: "pink",
  },
  {
    id: "feed",
    title: "Mix feed",
    description: "Share sets. Like, save, and follow DJs you love.",
    accent: "cyan",
  },
  {
    id: "studio",
    title: "Web studio",
    description: "Manage your profile and mixes from any browser.",
    accent: "purple",
  },
];

export const COMPARE_NSR: { q: string; them: string }[] = [
  {
    q: "Serato/Rekordbox depth + drag to deck",
    them: "Form-only request pages",
  },
  {
    q: "Search-first crowd UX",
    them: "Heavy wedding intake forms",
  },
  {
    q: "Ratings + follow after the gig",
    them: "Email list / merch focus",
  },
];

export const CHANGELOG_021 = [
  "Command Center — QR, queue, live now playing",
  "Mix Coach + drag to Serato/Rekordbox",
  "Post-gig ratings on DJ profiles",
  "Crowd share link + friend QR",
  "Offline booth + sync on reconnect",
  "Request alerts — sound + desktop notification",
];
