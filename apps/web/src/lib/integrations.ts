export type IntegrationStatus = "live" | "partial" | "planned";

export type IntegrationItem = {
  id: string;
  name: string;
  detail: string;
  status: IntegrationStatus;
  category: string;
};

export const INTEGRATIONS: IntegrationItem[] = [
  {
    id: "serato",
    name: "Serato DJ",
    detail: "Crate import, now-playing, drag to deck.",
    status: "live",
    category: "dj",
  },
  {
    id: "rekordbox",
    name: "Rekordbox",
    detail: "XML import, Pro DJ Link, drag local files.",
    status: "live",
    category: "dj",
  },
  {
    id: "spotify",
    name: "Spotify",
    detail: "Crowd search when API keys are set.",
    status: "live",
    category: "music",
  },
  {
    id: "tidal",
    name: "Tidal / streaming",
    detail: "Via Serato library sync — no separate API.",
    status: "partial",
    category: "music",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    detail: "Profile and mix links on community.",
    status: "partial",
    category: "music",
  },
  {
    id: "instagram",
    name: "Instagram · X · TikTok",
    detail: "Social links on your profile and after gigs.",
    status: "live",
    category: "social",
  },
  {
    id: "tips",
    name: "Tips",
    detail: "Venmo, PayPal, Cash App, or Stripe link after the set.",
    status: "live",
    category: "pay",
  },
  {
    id: "proximity",
    name: "BLE nearby join",
    detail: "Desktop beacon + Q Crowd iOS app.",
    status: "live",
    category: "crowd",
  },
  {
    id: "ratings",
    name: "Gig ratings",
    detail: "1–5 stars after the set on your profile.",
    status: "live",
    category: "reputation",
  },
  {
    id: "mixcoach",
    name: "Mix Coach",
    detail: "Harmonic suggestions + drag to deck.",
    status: "live",
    category: "booth",
  },
  {
    id: "vdj",
    name: "Virtual DJ",
    detail: "Planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "traktor",
    name: "Traktor",
    detail: "Planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "djay",
    name: "djay",
    detail: "Planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    detail: "Planned.",
    status: "planned",
    category: "music",
  },
  {
    id: "stripe-native",
    name: "Native Stripe checkout",
    detail: "Planned.",
    status: "planned",
    category: "pay",
  },
];
