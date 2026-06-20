export * from "./sanitize.js";
export * from "./harmonic.js";
export * from "./urls.js";
export * from "./ble.js";

export type RequestStatus = "pending" | "accepted" | "declined";

export interface TrackRecord {
  externalId: string;
  title: string;
  artist: string;
  album?: string;
  bpm?: number;
  key?: string;
  durationSec?: number;
  /**
   * Local filesystem path on the DJ's machine. Desktop-only — the API ignores
   * this field (and the desktop strips it before uploading) so it never leaves
   * the booth machine.
   */
  localPath?: string;
}

export type RequestSource = "library" | "spotify" | "manual";

export interface CrowdRequest {
  id: string;
  sessionId: string;
  title: string;
  artist: string;
  message?: string;
  /** Matched DJ's synced local library (Rekordbox/Serato) */
  inStock: boolean;
  matchedTrackId?: string;
  source?: RequestSource;
  externalId?: string;
  status: RequestStatus;
  createdAt: string;
  bpm?: number;
  key?: string;
  albumArtUrl?: string;
  /** Song was already played earlier in this set (from Serato history sync). */
  playedEarlierTonight?: boolean;
  /** Why the DJ said no — surfaced to the requester on the crowd page. */
  declineReason?: DeclineReason;
}

/** Canonical DJ decline reasons (free text "other" is captured separately). */
export type DeclineReason =
  | "vibe"
  | "genre"
  | "tempo"
  | "explicit"
  | "duplicate"
  | "already_played"
  | "not_now"
  | "unavailable"
  | "other";

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  vibe: "Doesn't match the vibe",
  genre: "Wrong genre for tonight",
  tempo: "Wrong tempo right now",
  explicit: "Too explicit for this room",
  duplicate: "Already in the queue",
  already_played: "Already played tonight",
  not_now: "Maybe later",
  unavailable: "Not in my library",
  other: "Other",
};

/** Unified crowd search result (Spotify + optional local library). */
export interface TrackSearchHit {
  id: string;
  title: string;
  artist: string;
  album?: string;
  bpm?: number;
  key?: string;
  durationSec?: number;
  albumArtUrl?: string;
  source: RequestSource;
  inStock: boolean;
  spotifyId?: string;
  libraryTrackId?: string;
  playedEarlierTonight?: boolean;
  /** DJ added this track to their library recently (default: last 14 days). */
  isNew?: boolean;
  /** DJ has played this track often across past sets (default: 3+ plays). */
  isHot?: boolean;
}

/**
 * Where this DJ sources tracks for the gig — picked at gig-start. This
 * controls whether the crowd's search hits Spotify, the local library, or both.
 * `null` means a legacy session that pre-dates the library profile picker;
 * the server falls back to whatever `streamingSearch` is set to.
 */
export type LibrarySource = "local" | "spotify" | "both";

export interface Session {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  librarySyncedAt?: string;
  /** Open Spotify search for crowd (when API keys configured). */
  streamingSearch?: boolean;
  /**
   * DJ's pick from the gig-start library profile picker. Drives the crowd
   * search scope. `undefined` = legacy session (server falls back to global
   * streaming_search default).
   */
  librarySource?: LibrarySource;
  /** Shown in the center of the QR sticker (e.g. DJ name). */
  displayName?: string;
  /** Max pending requests in the DJ queue before crowd is paused. */
  maxPendingRequests?: number;
  /** Max track requests per crowd device per gig. */
  maxRequestsPerGuest?: number;
  /** False after DJ ends the gig — crowd shows post-set conversion, not search. */
  isLive?: boolean;
  endedAt?: string;
  /** DJ community handle when the session is linked to a signed-in account. */
  djHandle?: string;
  /** Crowd can see pending + accepted requests on a live wall (weddings, hype rooms). */
  publicWall?: boolean;
  /** Guests can attach a short note / shoutout to their request. */
  allowShoutouts?: boolean;
}

export interface SessionSettings {
  displayName?: string;
  maxPendingRequests?: number;
  maxRequestsPerGuest?: number;
  librarySource?: LibrarySource;
  publicWall?: boolean;
  allowShoutouts?: boolean;
}

/** Public crowd wall entry — no guest ids, safe for display. */
export interface PublicWallRequest {
  id: string;
  title: string;
  artist: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  bpm?: number;
  key?: string;
}

export type PlanTier = "free" | "pro";

export type SuggestionType = "bpm" | "key" | "genre" | "note" | "ai" | "track";

export interface TransitionSuggestion {
  type: SuggestionType;
  label: string;
  detail: string;
  pro?: boolean;
}

/** Library track ranked for harmonic / tempo fit with now playing. */
export interface MixSuggestionHit {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  score: number;
  matchLabel: string;
  matchDetail: string;
  /** Stable library id from import (matches desktop importIndex). */
  externalId?: string;
}

export interface SyncStatus {
  pendingCount: number;
  totalRequests: number;
  librarySynced: boolean;
}

/** Pushed by desktop on track change; read by Q Booth mobile. */
export interface SessionLiveStatus {
  sessionId: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  updatedAt: string;
}

export interface CreateSessionResponse {
  session: Session;
  djToken: string;
  crowdUrl: string;
  /** Marketing profile (web) when DJ is signed in */
  profileUrl?: string;
  /** Crowd redirect for permanent QR: /dj/handle → latest gig */
  crowdProfileUrl?: string;
}

/** Links shown on public DJ profile (Settings). */
export interface DjSocialLinks {
  instagram?: string;
  twitter?: string;
  soundcloud?: string;
  tiktok?: string;
  website?: string;
}

/** DJ account (community pillar). */
export interface DjProfile {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: DjSocialLinks;
  verified: boolean;
  createdAt: string;
  /** Stripe Payment Link, PayPal.me, Cash App, etc. — shown after gigs. */
  tipUrl?: string;
}

export interface AuthResponse {
  user: DjProfile;
  accountToken: string;
}

/** DJ-uploaded or linked mix (promotional — not Serato library files). */
export interface Mix {
  id: string;
  userId: string;
  title: string;
  description?: string;
  /** SoundCloud, Mixcloud, or other stream URL */
  externalUrl: string;
  isPublic: boolean;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate crowd ratings after gigs (1–5), when the DJ has ended sessions. */
export interface DjGigRatingStats {
  averageScore: number;
  ratingCount: number;
}

export interface DjProfilePublic extends DjProfile {
  mixes: Mix[];
  gigRatings?: DjGigRatingStats;
}
