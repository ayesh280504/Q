export type RequestStatus = "pending" | "accepted" | "declined";

export interface TrackRecord {
  externalId: string;
  title: string;
  artist: string;
  album?: string;
  bpm?: number;
  key?: string;
  durationSec?: number;
}

export interface CrowdRequest {
  id: string;
  sessionId: string;
  title: string;
  artist: string;
  message?: string;
  /** @deprecated Use library search; kept for API compat */
  inStock: boolean;
  matchedTrackId?: string;
  status: RequestStatus;
  createdAt: string;
  bpm?: number;
  key?: string;
  /** Song was already played earlier in this set (from Serato history sync). */
  playedEarlierTonight?: boolean;
}

export interface Session {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  librarySyncedAt?: string;
  /** Shown in the center of the QR sticker (e.g. DJ name). */
  displayName?: string;
  /** Max pending requests in the DJ queue before crowd is paused. */
  maxPendingRequests?: number;
  /** Max track requests per crowd device per gig. */
  maxRequestsPerGuest?: number;
}

export interface SessionSettings {
  displayName?: string;
  maxPendingRequests?: number;
  maxRequestsPerGuest?: number;
}

export type PlanTier = "free" | "pro";

export type SuggestionType = "bpm" | "key" | "genre" | "note" | "ai" | "track";

export interface TransitionSuggestion {
  type: SuggestionType;
  label: string;
  detail: string;
  pro?: boolean;
}

export interface SyncStatus {
  pendingCount: number;
  totalRequests: number;
  librarySynced: boolean;
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

/** DJ account (community pillar). */
export interface DjProfile {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  verified: boolean;
  createdAt: string;
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

export interface DjProfilePublic extends DjProfile {
  mixes: Mix[];
}
