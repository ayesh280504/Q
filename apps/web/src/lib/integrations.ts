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
    detail: "Crate import, live now-playing, Q Requests crate, drag onto deck, Mix Coach.",
    status: "live",
    category: "dj",
  },
  {
    id: "rekordbox",
    name: "Rekordbox",
    detail: "XML import, Pro DJ Link now-playing, playlist import, drag local files.",
    status: "live",
    category: "dj",
  },
  {
    id: "spotify",
    name: "Spotify",
    detail: "Crowd search + BPM/key when API keys are configured on the server.",
    status: "live",
    category: "music",
  },
  {
    id: "tidal",
    name: "Tidal / streaming",
    detail: "Tracks in your Serato library sync to crowd search — no separate Tidal API yet.",
    status: "partial",
    category: "music",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    detail: "Profile link + mix URLs on community — not crowd request search.",
    status: "partial",
    category: "music",
  },
  {
    id: "instagram",
    name: "Instagram · X · TikTok",
    detail: "Public profile links after the gig — follow conversion.",
    status: "live",
    category: "social",
  },
  {
    id: "tips",
    name: "Tips (Stripe / PayPal / Cash App)",
    detail: "Paste your tip link in Settings — guests see it after the set ends.",
    status: "live",
    category: "pay",
  },
  {
    id: "proximity",
    name: "BLE proximity join",
    detail: "Mac/Windows desktop beacons session code; iOS/Android Q Crowd app + /nearby web (Android Chrome).",
    status: "live",
    category: "crowd",
  },
  {
    id: "ratings",
    name: "Crowd gig ratings",
    detail: "1–5 after end gig → average on DJ profile + community top rated.",
    status: "live",
    category: "reputation",
  },
  {
    id: "mixcoach",
    name: "Mix Coach",
    detail: "Harmonic next-track picks + native drag to Serato/Rekordbox.",
    status: "live",
    category: "booth",
  },
  {
    id: "vdj",
    name: "Virtual DJ",
    detail: "Library adapter — planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "traktor",
    name: "Traktor",
    detail: "Collection.nml import — planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "djay",
    name: "djay",
    detail: "Adapter evaluation — planned.",
    status: "planned",
    category: "dj",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    detail: "Crowd search expansion — planned.",
    status: "planned",
    category: "music",
  },
  {
    id: "stripe-native",
    name: "Native Stripe checkout",
    detail: "In-app tip flow without pasting a link — planned.",
    status: "planned",
    category: "pay",
  },
];
