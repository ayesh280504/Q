import type { TrackRecord } from "@q/shared";

const OUTBOX_KEY = "q-outbox";

export interface QueuedDecision {
  sessionId: string;
  requestId: string;
  status: "accepted" | "declined";
  declineReason?: string;
  queuedAt: string;
}

interface OutboxStore {
  decisions: QueuedDecision[];
  libraries: Array<{
    sessionId: string;
    tracks: TrackRecord[];
    queuedAt: string;
  }>;
}

function load(): OutboxStore {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return { decisions: [], libraries: [] };
    return JSON.parse(raw) as OutboxStore;
  } catch {
    return { decisions: [], libraries: [] };
  }
}

function save(store: OutboxStore) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(store));
}

export function queueDecision(decision: Omit<QueuedDecision, "queuedAt">) {
  const store = load();
  store.decisions = store.decisions.filter(
    (d) => !(d.sessionId === decision.sessionId && d.requestId === decision.requestId),
  );
  store.decisions.push({ ...decision, queuedAt: new Date().toISOString() });
  save(store);
}

export function getDecisions(sessionId: string): QueuedDecision[] {
  return load().decisions.filter((d) => d.sessionId === sessionId);
}

export function clearDecision(sessionId: string, requestId: string) {
  const store = load();
  store.decisions = store.decisions.filter(
    (d) => !(d.sessionId === sessionId && d.requestId === requestId),
  );
  save(store);
}

export function queueLibrary(sessionId: string, tracks: TrackRecord[]) {
  const store = load();
  store.libraries = store.libraries.filter((l) => l.sessionId !== sessionId);
  store.libraries.push({ sessionId, tracks, queuedAt: new Date().toISOString() });
  save(store);
}

export function getPendingLibrary(sessionId: string): TrackRecord[] | null {
  return load().libraries.find((l) => l.sessionId === sessionId)?.tracks ?? null;
}

export function clearPendingLibrary(sessionId: string) {
  const store = load();
  store.libraries = store.libraries.filter((l) => l.sessionId !== sessionId);
  save(store);
}

export function outboxCounts(sessionId: string) {
  const store = load();
  return {
    decisions: store.decisions.filter((d) => d.sessionId === sessionId).length,
    library: store.libraries.some((l) => l.sessionId === sessionId),
  };
}
