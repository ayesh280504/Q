import type { CrowdRequest, PlanTier, TrackRecord, TransitionSuggestion } from "@q/shared";
import { fetchRequests, fetchSyncStatus, syncLibrary, updateRequest } from "../api";
import {
  clearDecision,
  clearPendingLibrary,
  getDecisions,
  getPendingLibrary,
  queueDecision,
  queueLibrary,
} from "./outbox";

export interface SyncResult {
  pulled: number;
  pushedDecisions: number;
  librarySynced: boolean;
  pendingOnServer: number;
}

/** Merge incremental server pulls into existing queue (server delta is not the full list). */
export function mergeRequests(
  serverDelta: CrowdRequest[],
  existing: CrowdRequest[],
  pendingDecisionIds: Set<string>,
): CrowdRequest[] {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const r of serverDelta) {
    if (!pendingDecisionIds.has(r.id)) map.set(r.id, r);
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function runSync(
  sessionId: string,
  djToken: string,
  plan: PlanTier,
  localRequests: CrowdRequest[],
  opts?: { fullPull?: boolean; lastSync?: string | null },
): Promise<{ result: SyncResult; requests: CrowdRequest[]; lastSync: string | null }> {
  const result: SyncResult = {
    pulled: 0,
    pushedDecisions: 0,
    librarySynced: false,
    pendingOnServer: 0,
  };

  const pendingLib = getPendingLibrary(sessionId);
  if (pendingLib && pendingLib.length > 0) {
    await syncLibrary(sessionId, djToken, pendingLib);
    clearPendingLibrary(sessionId);
    result.librarySynced = true;
  }

  const decisions = getDecisions(sessionId);
  for (const d of decisions) {
    try {
      await updateRequest(sessionId, djToken, d.requestId, d.status, plan);
      clearDecision(sessionId, d.requestId);
      result.pushedDecisions++;
    } catch {
      /* keep in outbox for next sync */
    }
  }

  const since = opts?.fullPull ? undefined : opts?.lastSync ?? undefined;
  const data = await fetchRequests(sessionId, djToken, since);
  result.pulled = data.requests.length;

  try {
    const status = await fetchSyncStatus(sessionId, djToken);
    result.pendingOnServer = status.pendingCount;
  } catch {
    result.pendingOnServer = data.requests.filter((r) => r.status === "pending").length;
  }

  const pendingIds = new Set(getDecisions(sessionId).map((d) => d.requestId));
  const merged = opts?.fullPull
    ? mergeRequests(
        data.requests,
        localRequests.filter((r) => pendingIds.has(r.id)),
        pendingIds,
      )
    : mergeRequests(data.requests, localRequests, pendingIds);

  let lastSync = opts?.lastSync ?? null;
  if (data.requests.length > 0) {
    lastSync = data.requests[data.requests.length - 1]!.createdAt;
  }

  return { result, requests: merged, lastSync };
}

export function queueLibraryIfOffline(sessionId: string, tracks: TrackRecord[], online: boolean) {
  if (!online) queueLibrary(sessionId, tracks);
}

export function queueDecisionIfOffline(
  sessionId: string,
  requestId: string,
  status: "accepted" | "declined",
  online: boolean,
) {
  if (!online) queueDecision({ sessionId, requestId, status });
}

export function localSuggestionsOffline(): TransitionSuggestion[] {
  return [
    {
      type: "note",
      label: "Offline",
      detail: "Basic transition hints from your local library. Sync when you're back online for the latest queue.",
    },
  ];
}
