import type { LanGigHandoff } from "@q/shared";
import { generateSessionCode } from "@q/shared";

export type BoothGigState = {
  sessionId: string;
  code: string;
  name: string;
  displayName: string;
  djToken: string;
  crowdUrl: string;
  trackCount: number;
  maxPendingRequests: number;
  maxRequestsPerGuest: number;
  localOnly?: boolean;
};

const CROWD_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_Q_CROWD_URL) ||
  "http://localhost:5173";

export function handoffToGigState(h: LanGigHandoff, trackCount = 0): BoothGigState {
  return {
    sessionId: h.sessionId,
    code: h.code,
    name: h.name || "Tonight",
    displayName: h.displayName || h.name || "DJ",
    djToken: h.djToken,
    crowdUrl: h.crowdUrl,
    trackCount,
    maxPendingRequests: h.maxPendingRequests ?? 20,
    maxRequestsPerGuest: h.maxRequestsPerGuest ?? 3,
    localOnly: h.localOnly ?? false,
  };
}

export function createOfflineGigState(input: {
  displayName: string;
  maxPending: number;
  maxPerGuest: number;
}): BoothGigState {
  const code = generateSessionCode();
  return {
    sessionId: crypto.randomUUID(),
    code,
    name: "Tonight",
    displayName: input.displayName,
    djToken: crypto.randomUUID(),
    crowdUrl: `${CROWD_BASE.replace(/\/$/, "")}/r/${code}`,
    trackCount: 0,
    maxPendingRequests: input.maxPending,
    maxRequestsPerGuest: input.maxPerGuest,
    localOnly: true,
  };
}

export function lanHandoffFromGig(
  gig: BoothGigState,
  extras?: { librarySource?: string; crowdProfileUrl?: string },
): LanGigHandoff {
  return {
    sessionId: gig.sessionId,
    code: gig.code,
    djToken: gig.djToken,
    name: gig.name,
    displayName: gig.displayName,
    crowdUrl: gig.crowdUrl,
    crowdProfileUrl: extras?.crowdProfileUrl,
    librarySource: extras?.librarySource as LanGigHandoff["librarySource"],
    maxPendingRequests: gig.maxPendingRequests,
    maxRequestsPerGuest: gig.maxRequestsPerGuest,
    localOnly: gig.localOnly,
  };
}
