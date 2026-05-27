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
  /** False when the request pull failed (network) — UI keeps last local queue. */
  pullOk: boolean;
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

/**
 * Push outbox → pull requests. Each network step is isolated so a timeout on
 * pull never blocks pushing accept/decline decisions made offline.
 */
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
    pullOk: false,
  };

  const pendingLib = getPendingLibrary(sessionId);
  if (pendingLib && pendingLib.length > 0) {
    try {
      await syncLibrary(sessionId, djToken, pendingLib);
      clearPendingLibrary(sessionId);
      result.librarySynced = true;
    } catch {
      /* keep library in outbox for next sync */
    }
  }

  const decisions = getDecisions(sessionId);
  for (const d of decisions) {
    try {
      await updateRequest(sessionId, djToken, d.requestId, d.status, plan, d.declineReason);
      clearDecision(sessionId, d.requestId);
      result.pushedDecisions++;
    } catch {
      /* keep in outbox for next sync */
    }
  }

  let serverRequests: CrowdRequest[] = [];
  try {
    const since = opts?.fullPull ? undefined : opts?.lastSync ?? undefined;
    const data = await fetchRequests(sessionId, djToken, since);
    serverRequests = data.requests;
    result.pulled = data.requests.length;
    result.pullOk = true;
  } catch {
    result.pullOk = false;
  }

  try {
    const status = await fetchSyncStatus(sessionId, djToken);
    result.pendingOnServer = status.pendingCount;
  } catch {
    result.pendingOnServer = serverRequests.filter((r) => r.status === "pending").length;
  }

  const pendingIds = new Set(getDecisions(sessionId).map((d) => d.requestId));
  const merged = result.pullOk
    ? opts?.fullPull
      ? mergeRequests(
          serverRequests,
          localRequests.filter((r) => pendingIds.has(r.id)),
          pendingIds,
        )
      : mergeRequests(serverRequests, localRequests, pendingIds)
    : localRequests;

  let lastSync = opts?.lastSync ?? null;
  if (result.pullOk && serverRequests.length > 0) {
    lastSync = serverRequests[serverRequests.length - 1]!.createdAt;
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
  declineReason?: string,
) {
  if (!online) queueDecision({ sessionId, requestId, status, declineReason });
}

export type OfflineSuggestionContext = {
  nowPlaying?: { title: string; artist: string; bpm?: number; key?: string } | null;
  queueCount?: number;
  boothOnly?: boolean;
};

/** Lightweight transition hints when the API is unreachable. */
export function localSuggestionsOffline(ctx?: OfflineSuggestionContext): TransitionSuggestion[] {
  const out: TransitionSuggestion[] = [];
  const np = ctx?.nowPlaying;

  if (np?.title) {
    const meta: string[] = [];
    if (np.bpm) meta.push(`${np.bpm} BPM`);
    if (np.key) meta.push(np.key);
    out.push({
      type: "track",
      label: "Now playing",
      detail: meta.length > 0 ? `${np.title} · ${meta.join(" · ")}` : np.title,
    });
  }

  if ((ctx?.queueCount ?? 0) > 0) {
    out.push({
      type: "note",
      label: "Up next",
      detail: `${ctx!.queueCount} accepted track${ctx!.queueCount === 1 ? "" : "s"} in your queue — mix when ready.`,
    });
  }

  out.push({
    type: "note",
    label: ctx?.boothOnly ? "Booth only" : "Offline sync",
    detail: ctx?.boothOnly
      ? "Crowd auto-sync is off. Tap Sync now when you want to pull or push requests."
      : "Accept/decline still works locally. Tap Sync when you have hotspot signal.",
  });

  return out;
}
