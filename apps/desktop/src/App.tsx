import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CrowdRequest,
  CreateSessionResponse,
  DeclineReason,
  DjProfile,
  PlanTier,
  TrackRecord,
  TransitionSuggestion,
} from "@q/shared";
import {
  createSession,
  syncLibrary,
  syncPlayedTracks,
  updateRequest,
  endSession,
  pushLiveStatus,
  updateSessionSettings,
} from "./api";
import { importRekordboxAuto, importRekordboxFromDialog } from "./rekordbox";
import { importSeratoAuto, importSeratoFromDialog } from "./serato";
import QLogo from "./components/QLogo";
import NowPlayingBar from "./components/NowPlayingBar";
import QrSticker from "./components/QrSticker";
import WelcomeTour from "./components/WelcomeTour";
import StartGigPrompt from "./components/StartGigPrompt";
import PrivacyFiltersPanel from "./components/PrivacyFiltersPanel";
import OverlayDock from "./components/OverlayDock";
import DeclineMenu from "./components/DeclineMenu";
import LibrarySetupHint, { type LibrarySetupKind } from "./components/LibrarySetupHint";
import LibraryProfilePicker from "./components/LibraryProfilePicker";
import { openExternal } from "./lib/openExternal";
import {
  loadLibrarySource,
  saveLibrarySource,
  shouldImportLocalLibrary,
  autoCrateApplies,
  LIBRARY_SOURCE_LABELS,
  type LibrarySource,
} from "./lib/libraryProfile";
import {
  enterOverlayMode,
  exitOverlayMode,
  startAlwaysOnTopGuard,
  stopAlwaysOnTopGuard,
} from "./lib/overlayWindow";
import UpdateBanner from "./components/UpdateBanner";
import { checkForUpdate, suppressVersion, type AvailableUpdate } from "./lib/updater";
import CrateSelectionPanel, { type CrateOption } from "./components/CrateSelectionPanel";
import HiddenTracksInspector, {
  type HiddenTrackEntry,
} from "./components/HiddenTracksInspector";
import {
  loadSeratoSelection,
  saveSeratoSelection,
  loadRekordboxSelection,
  saveRekordboxSelection,
  type CrateSelection,
} from "./lib/crateSelection";
import {
  loadPrivacyFilters,
  partitionTracks,
  savePrivacyFilters,
  type PrivacyFilters,
} from "./lib/privacyFilter";
import {
  addToQueueCrate,
  buildImportIndex,
  resetQueueCrate,
} from "./lib/queueCrate";
import TrackMeta from "./components/TrackMeta";
import { useSeratoPlayback, type SeratoLinkStatus } from "./hooks/useSeratoPlayback";
import { useProlinkPlayback, type ProlinkStatus } from "./hooks/useProlinkPlayback";
import { useQueueAutoAdvance } from "./hooks/useQueueAutoAdvance";
import { fetchAccountMe, getAccountToken, saveAccountToken } from "./lib/account";
import {
  crowdUrlForPhone,
  crowdUrlNeedsLanHint,
  phoneCrowdUrlIsLocalhost,
} from "./lib/crowdUrl";
import {
  pruneQueueAgainstNowPlaying,
  wasPlayedEarlierTonight,
  type NowPlaying,
  type PlayedTrack,
  type UpNextItem,
} from "./lib/trackMatch";
import {
  localSuggestionsOffline,
  queueDecisionIfOffline,
  queueLibraryIfOffline,
  runSync,
} from "./sync/engine";
import { getDecisions, outboxCounts, queueDecision } from "./sync/outbox";
import {
  loadSyncPollPreset,
  saveSyncPollPreset,
  syncPollIntervalMs,
  syncPollPresetMeta,
  SYNC_POLL_PRESETS,
  type SyncPollPreset,
} from "./lib/syncSettings";
import {
  BOOTH_WORK_MODE_META,
  loadBoothWorkMode,
  saveBoothWorkMode,
  type BoothWorkMode,
} from "./lib/boothWorkMode";
import { loadAutostartWanted, saveAutostartWanted } from "./lib/autostartPref";
import { useDjSoftwareSentinel } from "./hooks/useDjSoftwareSentinel";

const STORAGE_KEY = "q-gig";
const DJ_NAME_KEY = "q-dj-display-name";
const VIEW_MODE_KEY = "q-view-mode";
const PLAN_KEY = "q-plan-tier";
const AUTO_ADVANCE_KEY = "q-rekordbox-auto-advance";

function loadAutoAdvance(): boolean {
  try {
    return localStorage.getItem(AUTO_ADVANCE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveAutoAdvance(on: boolean) {
  try {
    localStorage.setItem(AUTO_ADVANCE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
const WEB_URL =
  import.meta.env.VITE_Q_WEB_URL?.replace(/\/$/, "") || "http://localhost:5174";
type DjSoftware = "rekordbox" | "serato";

function loadPlan(): PlanTier {
  try {
    return localStorage.getItem(PLAN_KEY) === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

function savePlan(plan: PlanTier) {
  try {
    localStorage.setItem(PLAN_KEY, plan);
  } catch {
    /* ignore */
  }
}

function loadDockMode(): boolean {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) !== "full";
  } catch {
    return true;
  }
}

function saveDockMode(dock: boolean) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, dock ? "dock" : "full");
  } catch {
    /* ignore */
  }
}

interface GigState {
  sessionId: string;
  code: string;
  name: string;
  displayName: string;
  djToken: string;
  crowdUrl: string;
  trackCount: number;
  maxPendingRequests: number;
  maxRequestsPerGuest: number;
}

function loadDjDisplayName(): string {
  try {
    return localStorage.getItem(DJ_NAME_KEY) || "";
  } catch {
    return "";
  }
}

function saveDjDisplayName(name: string) {
  try {
    localStorage.setItem(DJ_NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

function loadGig(): GigState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GigState>;
    if (!parsed.sessionId || !parsed.code || !parsed.djToken || !parsed.crowdUrl) return null;
    return {
      sessionId: parsed.sessionId,
      code: parsed.code,
      name: parsed.name ?? "Tonight",
      displayName: parsed.displayName ?? parsed.name ?? "DJ",
      djToken: parsed.djToken,
      crowdUrl: parsed.crowdUrl,
      trackCount: parsed.trackCount ?? 0,
      maxPendingRequests: parsed.maxPendingRequests ?? 20,
      maxRequestsPerGuest: parsed.maxRequestsPerGuest ?? 3,
    };
  } catch {
    return null;
  }
}

function saveGig(gig: GigState | null) {
  if (gig) localStorage.setItem(STORAGE_KEY, JSON.stringify(gig));
  else localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [gig, setGig] = useState<GigState | null>(loadGig);
  const [requests, setRequests] = useState<CrowdRequest[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncPollPreset, setSyncPollPreset] = useState<SyncPollPreset>(loadSyncPollPreset);
  const [boothWorkMode, setBoothWorkMode] = useState<BoothWorkMode>(loadBoothWorkMode);
  const [autostartWanted, setAutostartWanted] = useState(loadAutostartWanted);
  const djSoftwareSentinel = useDjSoftwareSentinel(Boolean(gig));
  const [lastSyncOkAt, setLastSyncOkAt] = useState<number | null>(null);
  const [, setSyncTick] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [djSoftware, setDjSoftware] = useState<DjSoftware>("rekordbox");
  const [outbox, setOutbox] = useState({ decisions: 0, library: false });
  const [serverPending, setServerPending] = useState(0);
  const [djDisplayName, setDjDisplayName] = useState(loadDjDisplayName);
  const [maxPending, setMaxPending] = useState(20);
  const [maxPerGuest, setMaxPerGuest] = useState(3);
  const [pinWindow, setPinWindow] = useState(false);
  const [dockMode, setDockMode] = useState(loadDockMode);

  useEffect(() => {
    let cancelled = false;
    if (dockMode) {
      document.body.classList.add("overlay-mode");
      void enterOverlayMode(false).then(() => {
        if (!cancelled) setPinWindow(true);
        void startAlwaysOnTopGuard();
      });
    } else {
      document.body.classList.remove("overlay-mode");
    }
    return () => {
      cancelled = true;
      stopAlwaysOnTopGuard();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tier, setTier] = useState<PlanTier>(loadPlan);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [queue, setQueue] = useState<UpNextItem[]>([]);
  const [proHints, setProHints] = useState<TransitionSuggestion[]>([]);
  const [playedHistory, setPlayedHistory] = useState<PlayedTrack[]>([]);
  const [seratoLinkStatus, setSeratoLinkStatus] = useState<SeratoLinkStatus>("idle");
  const [prolinkStatus, setProlinkStatus] = useState<ProlinkStatus>("idle");
  const [prolinkDetail, setProlinkDetail] = useState<string | undefined>(undefined);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(loadAutoAdvance);
  const [setupHint, setSetupHint] = useState<LibrarySetupKind | null>(null);
  const [librarySource, setLibrarySourceState] = useState<LibrarySource | null>(loadLibrarySource);

  function pickLibrarySource(next: LibrarySource) {
    setLibrarySourceState(next);
    saveLibrarySource(next);
    // If there's already a live gig, push the new profile to the API so the
    // crowd's search scope re-tunes immediately (e.g. switching from
    // "Local only" to "Both" lights up Spotify results without restarting).
    if (gig) {
      updateSessionSettings(gig.sessionId, gig.djToken, { librarySource: next })
        .then(() => {
          setMessage(`Library profile set to "${LIBRARY_SOURCE_LABELS[next].title}".`);
        })
        .catch(() => {
          setMessage(
            "Couldn't push the library profile change to the server — your local pick is saved; crowd will pick it up on the next sync.",
          );
        });
    }
  }
  const [account, setAccount] = useState<DjProfile | null>(null);
  const [lanIpv4, setLanIpv4] = useState<string | null>(null);
  const [spotifyCrowdSearch, setSpotifyCrowdSearch] = useState(false);
  const [requestPulse, setRequestPulse] = useState(false);
  const [startGigPromptOpen, setStartGigPromptOpen] = useState(false);
  const [privacyFilters, setPrivacyFilters] = useState<PrivacyFilters>(() => loadPrivacyFilters());
  const [privateHidden, setPrivateHidden] = useState(0);
  const [hiddenEntries, setHiddenEntries] = useState<HiddenTrackEntry[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [allowedOnce, setAllowedOnce] = useState<Set<string>>(() => new Set());
  /**
   * Snapshot of the most recent import (public + private tracks) so the
   * Hidden Tracks inspector's "Allow once" can re-build and re-sync the
   * library without forcing the DJ to re-import from disk.
   */
  const lastImportRef = useRef<{
    publicTracks: TrackRecord[];
    privateTracks: TrackRecord[];
  } | null>(null);
  /**
   * Lookup table for the "Q Requests" auto-crate writer — maps `externalId`
   * (from the DJ's library import) → full track record (with `localPath`).
   * Rebuilt on every importLibrary call and consulted on every accepted
   * request so we can append the song's file path to Q Requests.m3u8 /
   * Q Requests.crate without ever exposing the path to the server.
   */
  const importIndexRef = useRef<Map<string, TrackRecord>>(new Map());
  const [seratoSelection, setSeratoSelection] = useState<CrateSelection>(() =>
    loadSeratoSelection(),
  );
  const [rekordboxSelection, setRekordboxSelection] = useState<CrateSelection>(() =>
    loadRekordboxSelection(),
  );
  const [crateOptions, setCrateOptions] = useState<CrateOption[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<AvailableUpdate | null>(null);
  const installUpdateRef = useRef<(() => Promise<void>) | null>(null);
  const prevPendingCountRef = useRef(0);

  useEffect(() => {
    // Slight delay so the booth UI paints first; the check is best-effort.
    const t = setTimeout(() => {
      void checkForUpdate({
        onAvailable: (info, install) => {
          installUpdateRef.current = install;
          setPendingUpdate(info);
        },
      });
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  function updatePrivacyFilters(next: PrivacyFilters) {
    setPrivacyFilters(next);
    savePrivacyFilters(next);
  }

  function updateSeratoSelection(next: CrateSelection) {
    setSeratoSelection(next);
    saveSeratoSelection(next);
  }

  function updateRekordboxSelection(next: CrateSelection) {
    setRekordboxSelection(next);
    saveRekordboxSelection(next);
  }

  async function allowOnce(externalId: string) {
    if (!gig) return;
    const snap = lastImportRef.current;
    if (!snap) {
      // No import snapshot yet (e.g. allowOnce clicked after a reload).
      // Best we can do is mark it for the next import.
      setAllowedOnce((prev) => {
        const next = new Set(prev);
        next.add(externalId);
        return next;
      });
      setMessage(
        "Marked allow-once — run Auto-import once for it to land in the crowd's search.",
      );
      return;
    }

    const nextAllowed = new Set(allowedOnce);
    nextAllowed.add(externalId);
    setAllowedOnce(nextAllowed);

    // Rebuild the library payload using the saved snapshot + updated allow-list.
    const allowedTracks = snap.privateTracks.filter((t) => nextAllowed.has(t.externalId));
    const stillPrivate = snap.privateTracks.filter((t) => !nextAllowed.has(t.externalId));
    const localTracks = [...snap.publicTracks, ...allowedTracks];

    setHiddenEntries((prev) => prev.filter((e) => e.track.externalId !== externalId));
    setPrivateHidden(stillPrivate.length);
    const next = { ...gig, trackCount: localTracks.length };
    setGig(next);
    saveGig(next);

    if (online) {
      setBusy(true);
      try {
        await syncLibrary(gig.sessionId, gig.djToken, localTracks);
        setMessage(`Allowed for this gig — added to the crowd's search instantly.`);
      } catch (e) {
        setMessage(
          e instanceof Error
            ? `Allow-once couldn't sync: ${e.message}. It'll push on next Sync.`
            : "Allow-once couldn't sync — queued for next sync.",
        );
        queueLibraryIfOffline(gig.sessionId, localTracks, false);
      } finally {
        setBusy(false);
      }
    } else {
      queueLibraryIfOffline(gig.sessionId, localTracks, false);
      setMessage("Allow-once queued — it'll sync when you're back online.");
    }
  }
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const lastSyncRef = useRef(lastSync);
  lastSyncRef.current = lastSync;
  const tierRef = useRef(tier);
  tierRef.current = tier;
  const nowPlayingRef = useRef<NowPlaying | null>(null);
  nowPlayingRef.current = nowPlaying;
  const lastPlayedSyncRef = useRef(0);

  const refreshOutbox = useCallback(() => {
    if (!gig) return;
    setOutbox(outboxCounts(gig.sessionId));
  }, [gig]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_Q_API_URL || "http://localhost:8787";
    void fetch(`${base}/health`)
      .then((r) => r.json())
      .then((d: { spotifySearch?: boolean }) => setSpotifyCrowdSearch(Boolean(d.spotifySearch)))
      .catch(() => setSpotifyCrowdSearch(false));
  }, []);

  const doSync = useCallback(
    async (fullPull = false) => {
      if (!gig || !online) return null;
      try {
        const { result, requests: merged, lastSync: ls } = await runSync(
          gig.sessionId,
          gig.djToken,
          tierRef.current,
          requestsRef.current,
          { fullPull, lastSync: lastSyncRef.current },
        );
        setRequests(merged);
        if (ls) setLastSync(ls);
        setServerPending(result.pendingOnServer);
        refreshOutbox();
        if (result.pullOk || result.pushedDecisions > 0 || result.librarySynced) {
          setLastSyncOkAt(Date.now());
        }
        return result;
      } catch {
        return null;
      }
    },
    [gig, online, refreshOutbox],
  );

  useEffect(() => {
    if (!gig || !online || boothWorkMode === "booth") return;
    const ms = syncPollIntervalMs(syncPollPreset);
    void doSync(false);
    const id = setInterval(() => void doSync(false), ms);
    return () => clearInterval(id);
  }, [gig, online, doSync, syncPollPreset, boothWorkMode]);

  useEffect(() => {
    if (!gig || !online || !nowPlaying?.title) return;
    void pushLiveStatus(gig.sessionId, gig.djToken, {
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      bpm: nowPlaying.bpm,
      key: nowPlaying.key,
    }).catch(() => {
      /* phone HUD is best-effort */
    });
  }, [gig, online, nowPlaying?.title, nowPlaying?.artist, nowPlaying?.bpm, nowPlaying?.key]);

  /** Refresh "last synced X ago" label every 10s without polling the API. */
  useEffect(() => {
    if (!lastSyncOkAt) return;
    const id = setInterval(() => setSyncTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, [lastSyncOkAt]);

  useEffect(() => {
    if (!online || !gig) return;
    doSync(true);
  }, [online]);

  useEffect(refreshOutbox, [gig, refreshOutbox]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void (async () => {
      if (!("__TAURI_INTERNALS__" in window)) return;
      try {
        const { getCurrent, onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
        const focusWindow = () => {
          void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
            const win = getCurrentWindow();
            void win.show();
            void win.unminimize();
            void win.setFocus();
          });
        };
        const wantsStartGig = (url: string) => {
          const u = url.toLowerCase();
          return u.includes("start-gig") || u.includes("start_gig");
        };
        const applyHandoff = async (rawUrls: string[]) => {
          for (const raw of rawUrls) {
            let parsed: URL | null = null;
            try {
              parsed = new URL(raw);
            } catch {
              continue;
            }
            const token = parsed.searchParams.get("token")?.trim();
            if (!token) continue;
            saveAccountToken(token);
            try {
              const res = await fetchAccountMe();
              setAccount(res.user);
            } catch {
              saveAccountToken(null);
              setAccount(null);
            }
            return true;
          }
          return false;
        };
        const handleUrls = (urls: string[]) => {
          focusWindow();
          void applyHandoff(urls);
          if (urls.some(wantsStartGig)) setStartGigPromptOpen(true);
        };
        const initial = await getCurrent();
        if (initial?.length) handleUrls(initial);
        unlisten = await onOpenUrl(handleUrls);
      } catch {
        /* deep link unavailable in dev */
      }
    })();
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (!gig) {
      prevPendingCountRef.current = 0;
      return;
    }
    const n = requests.filter((r) => r.status === "pending").length;
    if (n > prevPendingCountRef.current) {
      setRequestPulse(true);
      const t = window.setTimeout(() => setRequestPulse(false), 2600);
      prevPendingCountRef.current = n;
      return () => window.clearTimeout(t);
    }
    prevPendingCountRef.current = n;
  }, [requests, gig]);

  useEffect(() => {
    if (!getAccountToken()) return;
    fetchAccountMe()
      .then((r) => setAccount(r.user))
      .catch(() => {
        saveAccountToken(null);
        setAccount(null);
      });
  }, []);

  useEffect(() => {
    if (import.meta.env.VITE_Q_CROWD_LAN_URL) return;
    void import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<string | null>("get_lan_ipv4"))
      .then((ip) => {
        if (ip) setLanIpv4(ip);
      })
      .catch(() => {
        /* browser build or invoke unavailable */
      });
  }, []);

  const seratoOn = Boolean(gig) && djSoftware === "serato";
  const rekordboxOn = Boolean(gig) && djSoftware === "rekordbox";

  useSeratoPlayback({
    enabled: seratoOn,
    onNowPlaying: setNowPlaying,
    onHistory: setPlayedHistory,
    onLinkStatus: (status) => {
      setSeratoLinkStatus(status);
      // Serato Lite never writes to _Serato_/History/Sessions/. If the import
      // succeeded (we have a Subcrates folder somewhere) but the History
      // folder is missing, that's almost always Serato Lite — surface the
      // friendly explanation rather than leaving the DJ wondering why
      // "Now Playing" is permanently blank.
      if (status === "no_folder" && lastImportRef.current && setupHint == null) {
        setSetupHint("serato-lite");
      }
    },
  });

  useProlinkPlayback({
    enabled: rekordboxOn,
    importIndex: importIndexRef.current,
    onNowPlaying: setNowPlaying,
    onStatus: (status, detail) => {
      setProlinkStatus(status);
      setProlinkDetail(detail);
    },
  });

  // Rekordbox laptop-only fallback: when no Pro DJ Link gear is broadcasting
  // and the DJ enabled auto-advance in settings, run a track-length timer to
  // promote queue items.
  const autoAdvanceActive = rekordboxOn && autoAdvance && prolinkStatus !== "connected";

  useQueueAutoAdvance({
    enabled: autoAdvanceActive,
    nowPlaying,
    queue,
    onAdvance: (next) => {
      markQueuePlaying(next);
    },
    onDeckIdle: () => {
      // Track ran its course with nothing queued behind it — clear the deck
      // so the next accepted request gets auto-promoted immediately.
      setNowPlaying(null);
    },
  });

  // When auto-advance is active and the deck is idle (no current track) but
  // there's something queued, kick playback off automatically. This handles
  // the very first accept of the night and any time the queue refills after
  // running dry.
  useEffect(() => {
    if (!autoAdvanceActive) return;
    if (nowPlaying || queue.length === 0) return;
    markQueuePlaying(queue[0]);
    // markQueuePlaying is stable; intentionally not in deps to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvanceActive, nowPlaying, queue]);

  useEffect(() => {
    setQueue((prev) => pruneQueueAgainstNowPlaying(nowPlaying, prev));
  }, [nowPlaying]);

  useEffect(() => {
    if (!gig || !online || playedHistory.length === 0) return;
    const now = Date.now();
    if (now - lastPlayedSyncRef.current < 8000) return;
    lastPlayedSyncRef.current = now;
    void syncPlayedTracks(gig.sessionId, gig.djToken, playedHistory).catch(() => {
      /* retry on next poll */
    });
  }, [gig, online, playedHistory]);

  useEffect(() => {
    if (!gig) return;
    const accepted = requests.filter((r) => r.status === "accepted");
    setQueue((prev) => {
      const ids = new Set(prev.map((p) => p.requestId));
      const added = accepted
        .filter((r) => !ids.has(r.id))
        .map((r) => requestToQueueItem(r, playedHistory, nowPlayingRef.current));
      const merged = added.length > 0 ? [...prev, ...added] : prev;
      return pruneQueueAgainstNowPlaying(nowPlayingRef.current, merged);
    });
  }, [requests, gig, playedHistory]);

  function requestToQueueItem(
    request: CrowdRequest,
    history: PlayedTrack[],
    np: NowPlaying | null,
  ): UpNextItem {
    // Look up the imported library entry so the queue item knows the track
    // length — the Rekordbox auto-advance timer keys off this.
    const local =
      (request.matchedTrackId && importIndexRef.current.get(request.matchedTrackId)) ||
      (request.externalId && importIndexRef.current.get(request.externalId)) ||
      undefined;
    return {
      requestId: request.id,
      title: request.title,
      artist: request.artist,
      bpm: request.bpm ?? np?.bpm,
      key: request.key ?? np?.key,
      durationSec: local?.durationSec,
      playedEarlierTonight:
        request.playedEarlierTonight ??
        wasPlayedEarlierTonight(request.title, request.artist, history, np),
    };
  }

  function addToQueue(request: CrowdRequest) {
    setQueue((prev) => {
      if (prev.some((p) => p.requestId === request.id)) return prev;
      const next = [
        ...prev,
        requestToQueueItem(request, playedHistory, nowPlayingRef.current),
      ];
      return pruneQueueAgainstNowPlaying(nowPlayingRef.current, next);
    });
  }

  function removeFromQueue(requestId: string) {
    setQueue((prev) => prev.filter((p) => p.requestId !== requestId));
  }

  function markQueuePlaying(item: UpNextItem) {
    setNowPlaying({
      title: item.title,
      artist: item.artist,
      bpm: item.bpm,
      key: item.key,
      durationSec: item.durationSec,
      playedAt: Date.now(),
    });
    setPlayedHistory((prev) => {
      const key = `${item.title}\0${item.artist}`.toLowerCase();
      if (prev.some((p) => `${p.title}\0${p.artist}`.toLowerCase() === key)) return prev;
      return [...prev, { title: item.title, artist: item.artist }];
    });
    setQueue((prev) => prev.filter((p) => p.requestId !== item.requestId));
  }

  async function syncNow() {
    if (!gig) return;
    if (!online) {
      setMessage("You're offline. Use phone hotspot, then tap Sync now.");
      return;
    }
    setBusy(true);
    const result = await doSync(true);
    setBusy(false);
    if (result) {
      const parts: string[] = [];
      if (result.pulled > 0) parts.push(`${result.pulled} new`);
      if (result.pushedDecisions > 0) parts.push(`${result.pushedDecisions} decisions sent`);
      if (result.librarySynced) parts.push("library uploaded");
      const pullNote = result.pullOk ? "" : " (couldn't refresh requests — weak signal; your queue is unchanged)";
      setMessage(
        parts.length > 0
          ? `Synced: ${parts.join(", ")}. ${result.pendingOnServer} pending on server.${pullNote}`
          : `Up to date. ${result.pendingOnServer} pending on server.${pullNote}`,
      );
    } else {
      setMessage("Sync timed out — Serato keeps playing. Try again when signal improves.");
    }
  }

  function formatLastSyncAgo(): string | null {
    if (!lastSyncOkAt) return null;
    const sec = Math.max(0, Math.floor((Date.now() - lastSyncOkAt) / 1000));
    if (sec < 15) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ago`;
  }

  async function startGig() {
    if (!navigator.onLine) {
      setMessage(
        "You need internet once to start a gig (creates your session & QR). After that, accept/decline and library import work offline — sync when you have signal.",
      );
      return;
    }
    setBusy(true);
    setMessage(null);
    const display = djDisplayName.trim() || "DJ";
    saveDjDisplayName(display);
    try {
      const res: CreateSessionResponse = await createSession(
        {
          name: "Tonight",
          displayName: display,
          maxPendingRequests: maxPending,
          maxRequestsPerGuest: maxPerGuest,
          // Carry the DJ's library profile to the API so the crowd search
          // is scoped correctly from request #1.
          librarySource: librarySource ?? undefined,
        },
        getAccountToken(),
      );
      const next: GigState = {
        sessionId: res.session.id,
        code: res.session.code,
        name: res.session.name,
        displayName: res.session.displayName ?? display,
        djToken: res.djToken,
        crowdUrl: res.crowdUrl,
        trackCount: 0,
        maxPendingRequests: res.session.maxPendingRequests ?? maxPending,
        maxRequestsPerGuest: res.session.maxRequestsPerGuest ?? maxPerGuest,
      };
      setGig(next);
      saveGig(next);
      setRequests([]);
      setLastSync(null);
      // Reset per-gig "Allow once" exceptions — surprise-drop mixes should
      // re-engage their privacy filter every time the DJ starts a new gig.
      setAllowedOnce(new Set());
      // Fresh gig → fresh "Q Requests" crate. Old paths from last night's
      // gig shouldn't bleed into tonight's auto-built crate.
      resetQueueCrate(res.session.id);
      const profileNote = res.crowdProfileUrl
        ? ` Permanent crowd link: ${res.crowdProfileUrl}`
        : res.profileUrl
          ? ` Profile: ${res.profileUrl}`
          : "";
      setMessage(
        `Gig started. Print your QR sticker, import library, then Sync now.${profileNote}`,
      );
      setStartGigPromptOpen(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not start gig");
    } finally {
      setBusy(false);
    }
  }

  async function saveLimits(updates: {
    maxPendingRequests?: number;
    maxRequestsPerGuest?: number;
    displayName?: string;
  }) {
    if (!gig) return;
    setBusy(true);
    try {
      const { session } = await updateSessionSettings(gig.sessionId, gig.djToken, updates);
      const next: GigState = {
        ...gig,
        displayName: session.displayName ?? gig.displayName,
        maxPendingRequests: session.maxPendingRequests ?? gig.maxPendingRequests,
        maxRequestsPerGuest: session.maxRequestsPerGuest ?? gig.maxRequestsPerGuest,
      };
      setGig(next);
      saveGig(next);
      if (updates.displayName) saveDjDisplayName(updates.displayName);
      setMessage("Settings saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  async function togglePinWindow() {
    const next = !pinWindow;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(next);
      setPinWindow(next);
    } catch {
      setMessage("Pin window works in the desktop app (Tauri), not in browser dev mode.");
    }
  }

  async function importLibrary(mode: "auto" | "file") {
    if (!gig) return;
    setBusy(true);
    setMessage(null);
    try {
      const result =
        djSoftware === "rekordbox"
          ? mode === "auto"
            ? await importRekordboxAuto({ selection: rekordboxSelection })
            : await importRekordboxFromDialog({ selection: rekordboxSelection })
          : mode === "auto"
            ? await importSeratoAuto({ privacy: privacyFilters, selection: seratoSelection })
            : await importSeratoFromDialog({
                privacy: privacyFilters,
                selection: seratoSelection,
              });

      if (!result) {
        if (mode === "auto" && djSoftware === "rekordbox") {
          // Most common reason: Rekordbox 6 ships with XML export disabled.
          // Show the step-by-step hint instead of a vague toast.
          setSetupHint("rekordbox-xml-missing");
          setMessage(null);
        } else {
          setMessage(
            mode === "auto"
              ? "No Serato Subcrates folder found. Point to your _Serato_/Subcrates folder."
              : "Import cancelled.",
          );
        }
        return;
      }

      // Compute crate options for the selection panel so the DJ can pick a
      // narrower scope next import.
      if (djSoftware === "serato" && "crates" in result) {
        const opts = (result.crates ?? []).map((c) => ({
          id: c.path,
          name: c.name,
          trackCount: c.trackCount,
        }));
        setCrateOptions(opts);
      } else if (djSoftware === "rekordbox" && "playlists" in result) {
        const opts = (result.playlists ?? []).map((p) => ({
          id: p.path,
          name: p.path,
          trackCount: p.trackIds.length,
        }));
        setCrateOptions(opts);
      }

      // Privacy partition — but honour the per-gig "Allow once" exceptions.
      const { publicTracks, privateTracks: rawPrivate } = partitionTracks(
        result.tracks,
        privacyFilters,
      );
      const allowedTracks = rawPrivate.filter((t) => allowedOnce.has(t.externalId));
      const privateTracks = rawPrivate.filter((t) => !allowedOnce.has(t.externalId));
      const localTracks = [...publicTracks, ...allowedTracks];

      // Snapshot for the Hidden Tracks inspector's instant "Allow once" flow:
      // we rebuild the uploaded list from this without re-reading from disk.
      lastImportRef.current = { publicTracks, privateTracks: rawPrivate };
      // Index every imported track (public + private) so the auto-crate writer
      // can look up local file paths the moment a request is accepted.
      importIndexRef.current = buildImportIndex([...publicTracks, ...rawPrivate]);

      // Build the hidden-tracks inspector entries.
      const entries: HiddenTrackEntry[] = [];
      for (const t of privateTracks) {
        const titleLow = t.title.toLowerCase();
        const artistLow = t.artist.toLowerCase();
        let reason = "Filter match";
        for (const kw of privacyFilters.keywords) {
          if (!kw.trim()) continue;
          if (titleLow.includes(kw.toLowerCase()) || artistLow.includes(kw.toLowerCase())) {
            reason = `Keyword: ${kw}`;
            break;
          }
        }
        if (reason === "Filter match" && privacyFilters.hideMashups) {
          if (/\s[xX×]\s+\S/.test(t.title) && /\S\s[xX×]\s/.test(t.title)) {
            reason = "Mashup pattern";
          }
        }
        entries.push({ track: t, reason });
      }

      const skippedCrates =
        "skippedCrates" in result ? (result as { skippedCrates: string[] }).skippedCrates : [];
      for (const path of skippedCrates) {
        entries.push({
          track: { externalId: path, title: path.split(/[\\\/]/).pop() ?? path, artist: "(crate)" },
          reason: "Private crate (filename match)",
        });
      }
      setHiddenEntries(entries);

      const hiddenTotal = privateTracks.length + skippedCrates.length;
      setPrivateHidden(hiddenTotal);

      const cratesRead =
        "crateFilesRead" in result ? (result as { crateFilesRead: number }).crateFilesRead : 0;
      const countLabel =
        cratesRead > 1
          ? `${localTracks.length} tracks from ${cratesRead} crates`
          : `${localTracks.length} tracks`;
      const privateNote =
        hiddenTotal > 0
          ? ` · ${hiddenTotal} kept private${skippedCrates.length ? ` (${skippedCrates.length} crate${skippedCrates.length === 1 ? "" : "s"} skipped)` : ""}`
          : "";

      // Track-metadata health snapshot — helps the DJ spot the difference
      // between "library imported" and "library imported but no BPM/key
      // tagged in their DJ app yet". A low ratio here is the leading cause
      // of "why don't I see BPM pills on the queue?".
      const withBpm = localTracks.filter((t) => Number.isFinite(t.bpm as number)).length;
      const withKey = localTracks.filter((t) => !!t.key).length;
      const metaNote =
        localTracks.length > 0
          ? ` · ${withBpm}/${localTracks.length} have BPM, ${withKey}/${localTracks.length} have key`
          : "";
      const lowMetaWarning =
        localTracks.length > 0 &&
        (withBpm < localTracks.length * 0.5 || withKey < localTracks.length * 0.5)
          ? djSoftware === "rekordbox"
            ? " — analyze your library in Rekordbox (right-click track → Analyze Track) to fill in missing BPM/key."
            : " — in Serato, right-click your crate → Set Auto BPM / Set Auto Key to analyze missing tracks."
          : "";

      const next = { ...gig, trackCount: localTracks.length };
      setGig(next);
      saveGig(next);

      if (online) {
        await syncLibrary(gig.sessionId, gig.djToken, localTracks);
        const syncResult = await runSync(
          gig.sessionId,
          gig.djToken,
          tierRef.current,
          requestsRef.current,
          { fullPull: true },
        );
        if (syncResult) {
          setRequests(syncResult.requests);
          setServerPending(syncResult.result.pendingOnServer);
        }
        setMessage(
          `Imported ${countLabel}${privateNote}${metaNote} and synced to cloud.${lowMetaWarning}`,
        );
      } else {
        queueLibraryIfOffline(gig.sessionId, localTracks, true);
        setMessage(
          `Imported ${countLabel}${privateNote}${metaNote} locally. Queued — tap Sync when online.${lowMetaWarning}`,
        );
      }
      refreshOutbox();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(
    requestId: string,
    status: "accepted" | "declined",
    declineReason?: DeclineReason,
  ) {
    if (!gig) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status, declineReason: status === "declined" ? declineReason : undefined }
          : r,
      ),
    );

    const applyAccepted = async (req: CrowdRequest) => {
      addToQueue(req);
      await writeAcceptedToCrate(req);
    };

    try {
      if (online) {
        void updateRequest(
          gig.sessionId,
          gig.djToken,
          requestId,
          status,
          tierRef.current,
          declineReason,
        )
          .then(async (res) => {
            setRequests((prev) => prev.map((r) => (r.id === requestId ? res.request : r)));
            if (status === "accepted") {
              await applyAccepted(res.request);
              setProHints(
                tierRef.current === "pro" ? res.suggestions.filter((s) => s.pro) : [],
              );
            } else {
              removeFromQueue(requestId);
              setProHints([]);
            }
          })
          .catch(() => {
            queueDecision({ sessionId: gig.sessionId, requestId, status, declineReason });
            refreshOutbox();
            if (status === "accepted") {
              const req = requestsRef.current.find((r) => r.id === requestId);
              if (req) void applyAccepted({ ...req, status: "accepted" });
            } else {
              removeFromQueue(requestId);
            }
            setMessage("Queued — tap Sync now when you have signal.");
          });
      } else {
        queueDecisionIfOffline(gig.sessionId, requestId, status, false, declineReason);
        refreshOutbox();
        if (status === "accepted") {
          const req = requestsRef.current.find((r) => r.id === requestId);
          if (req) {
            addToQueue({ ...req, status: "accepted" });
            await writeAcceptedToCrate(req);
          }
          setProHints([]);
        } else {
          removeFromQueue(requestId);
          setProHints([]);
        }
        setMessage("Saved offline — will send when you sync.");
      }
    } catch {
      queueDecision({ sessionId: gig.sessionId, requestId, status, declineReason });
      refreshOutbox();
      if (status === "accepted") {
        const req = requestsRef.current.find((r) => r.id === requestId);
        if (req) void applyAccepted({ ...req, status: "accepted" });
      } else {
        removeFromQueue(requestId);
      }
      setMessage("Queued — tap Sync now when you have signal.");
    }
  }

  /**
   * Appends an accepted request's local file path to the "Q Requests" m3u8
   * playlist (and, on Serato, the auto-loaded .crate). Silent no-op for
   * tracks we can't locate on disk (e.g. crowd searched via Spotify and the
   * DJ doesn't own the file).
   */
  async function writeAcceptedToCrate(req: CrowdRequest) {
    if (!gig) return;
    // Spotify-only DJs have no local files to add to a crate — skip the
    // write entirely (instead of silently no-op'ing inside addToQueueCrate
    // which would still emit a misleading "added to crate" toast).
    if (!autoCrateApplies(librarySource)) return;
    const externalId = req.matchedTrackId || req.externalId;
    if (!externalId) return;
    try {
      const result = await addToQueueCrate({
        sessionId: gig.sessionId,
        djSoftware,
        track: { externalId, title: req.title, artist: req.artist },
        importIndex: importIndexRef.current,
      });
      if (result?.message) setMessage(result.message);
    } catch {
      // Non-fatal — the request was still accepted, the booth just couldn't
      // update the on-disk playlist (e.g. permissions or no Music folder).
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const pendingIds = new Set(getDecisions(gig?.sessionId ?? "").map((d) => d.requestId));
  const phoneCrowdUrl = gig
    ? crowdUrlForPhone(gig.crowdUrl, gig.code, lanIpv4)
    : "";

  async function toggleViewMode() {
    const next = !dockMode;
    setDockMode(next);
    saveDockMode(next);
    if (next) {
      document.body.classList.add("overlay-mode");
      await enterOverlayMode(pinWindow);
      setPinWindow(true);
      void startAlwaysOnTopGuard();
    } else {
      stopAlwaysOnTopGuard();
      await exitOverlayMode();
      document.body.classList.remove("overlay-mode");
      setPinWindow(false);
    }
  }

  const updateBanner = pendingUpdate && installUpdateRef.current && (
    <UpdateBanner
      update={pendingUpdate}
      onInstall={async () => {
        const fn = installUpdateRef.current;
        if (fn) await fn();
      }}
      onDismiss={() => setPendingUpdate(null)}
      onSkip={() => {
        if (pendingUpdate) suppressVersion(pendingUpdate.version);
        setPendingUpdate(null);
      }}
    />
  );

  if (dockMode && gig) {
    return (
      <>
        {updateBanner}
        <OverlayDock
          gigCode={gig.code}
          gigDisplayName={gig.displayName}
          nowPlaying={nowPlaying}
          pending={pending}
          queue={queue}
          pendingPulse={requestPulse}
          online={online}
          busy={busy}
          pinned={pinWindow}
          djSoftware={djSoftware}
          onAccept={(id) => void handleDecision(id, "accepted")}
          onDecline={(id, reason) => void handleDecision(id, "declined", reason)}
          onPlayed={(item) => markQueuePlaying(item as UpNextItem)}
          onSync={() => void syncNow()}
          onTogglePin={() => void togglePinWindow()}
          onExpand={() => void toggleViewMode()}
        />
      </>
    );
  }

  return (
    <div className={`shell ${dockMode ? "shell-dock" : ""}`}>
      <WelcomeTour />
      {updateBanner}
      <HiddenTracksInspector
        open={inspectorOpen}
        title="Tracks hidden from the crowd"
        entries={hiddenEntries}
        allowed={allowedOnce}
        onAllowOnce={allowOnce}
        onClose={() => setInspectorOpen(false)}
        emptyMessage="Your most recent import wasn't filtered."
      />
      <StartGigPrompt
        open={startGigPromptOpen}
        onClose={() => setStartGigPromptOpen(false)}
        onStartGig={() => void startGig()}
        busy={busy}
        liveCode={gig?.code}
        librarySource={librarySource}
        onLibrarySourceChange={pickLibrarySource}
      />
      {dockMode && (
        <header className="dock-topbar">
          <QLogo size={28} className="dock-brand" />
          {gig ? (
            <span className="dock-meta">
              {gig.displayName} · <strong>{gig.code}</strong>
              {pending.length > 0 && (
                <span className={`dock-pending-badge ${requestPulse ? "pulse" : ""}`}>
                  {pending.length} pending
                </span>
              )}
            </span>
          ) : (
            <span className="dock-meta muted">No gig</span>
          )}
          <div className="dock-topbar-actions">
            {gig && (
              <button type="button" className="btn-top" disabled={busy} onClick={syncNow}>
                Sync
              </button>
            )}
            <button type="button" className="btn-top" onClick={togglePinWindow}>
              {pinWindow ? "Unpin" : "Pin"}
            </button>
            <button type="button" className="btn-top" onClick={() => void toggleViewMode()}>
              Expand
            </button>
          </div>
        </header>
      )}

      <aside className={`panel ${dockMode ? "panel-dock-controls" : ""}`}>
        {!dockMode && (
          <>
            <QLogo size={40} className="brand-mark" />
            <p className="muted">DJ Command Center</p>
          </>
        )}
        {dockMode && <p className="pane-heading dock-setup-label">Setup</p>}
        {!dockMode && (
          <button type="button" className="btn ghost" style={{ marginTop: "0.5rem" }} onClick={() => void toggleViewMode()}>
            Mini overlay
          </button>
        )}

        {!dockMode && (
          <>
            <h4 className="settings-section-label">DJ software</h4>
            {djSoftwareSentinel && (
              <p className="muted sync-hint">
                {djSoftwareSentinel.any_running
                  ? "Serato/Rekordbox detected — live tracking can run."
                  : "Open Serato or Rekordbox to start file watchers."}
              </p>
            )}
            <label className="field-label autostart-row">
              <input
                type="checkbox"
                checked={autostartWanted}
                onChange={(e) => {
                  setAutostartWanted(e.target.checked);
                  saveAutostartWanted(e.target.checked);
                }}
              />
              Start Q with Windows (registry hook in Phase 1C)
            </label>
          </>
        )}
        <div className="software-tabs">
          <button
            type="button"
            className={`tab ${djSoftware === "rekordbox" ? "active" : ""}`}
            onClick={() => setDjSoftware("rekordbox")}
          >
            Rekordbox
          </button>
          <button
            type="button"
            className={`tab ${djSoftware === "serato" ? "active" : ""}`}
            onClick={() => setDjSoftware("serato")}
          >
            Serato
          </button>
        </div>

        <div className={`software-tabs tier-tabs ${dockMode ? "hidden" : ""}`}>
          <button
            type="button"
            className={`tab ${tier === "free" ? "active" : ""}`}
            onClick={() => {
              setTier("free");
              savePlan("free");
              setProHints([]);
            }}
          >
            Free
          </button>
          <button
            type="button"
            className={`tab plan-pro ${tier === "pro" ? "active" : ""}`}
            onClick={() => {
              setTier("pro");
              savePlan("pro");
            }}
          >
            Pro
          </button>
        </div>

        {!gig ? (
          <div className="gig-setup">
            <div className="account-box">
              <p className="pane-heading" style={{ margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
                Q account (optional)
              </p>
              {account ? (
                <p className="muted" style={{ fontSize: "0.8rem" }}>
                  Signed in as <strong>@{account.handle}</strong> — gigs link to your profile.
                  <a
                    href={`${WEB_URL}/studio`}
                    className="btn ghost"
                    style={{ marginTop: "0.35rem", width: "100%", display: "block", textAlign: "center" }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open studio (web)
                  </a>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ marginTop: "0.35rem", width: "100%" }}
                    onClick={() => {
                      saveAccountToken(null);
                      setAccount(null);
                    }}
                  >
                    Sign out
                  </button>
                </p>
              ) : (
                <>
                  <p
                    className="muted"
                    style={{ fontSize: "0.78rem", margin: "0.1rem 0 0.5rem" }}
                  >
                    Sign in once on the website — we&apos;ll bring you right back to the
                    booth app when you&apos;re done.
                  </p>
                  <button
                    type="button"
                    className="btn primary"
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      marginTop: "0.25rem",
                    }}
                    onClick={async () => {
                      const url = `${WEB_URL}/login?returnTo=desktop`;
                      setMessage(
                        "Opening browser… finish on the website and the booth will sign you in automatically.",
                      );
                      await openExternal(url);
                    }}
                  >
                    Sign in / create account
                  </button>
                  <p
                    className="muted"
                    style={{ fontSize: "0.7rem", marginTop: "0.5rem", textAlign: "center" }}
                  >
                    Already signed in elsewhere? Click <strong>Sign in</strong> — if you have a
                    web session it&apos;ll bounce back here instantly without asking again.
                  </p>
                </>
              )}
            </div>
            <label className="field-label">
              Your name (center of QR)
              <input
                className="field-input"
                value={djDisplayName}
                onChange={(e) => setDjDisplayName(e.target.value)}
                placeholder="e.g. DJ Ayesh"
              />
            </label>
            <label className="field-label">
              Max pending in queue
              <input
                className="field-input"
                type="number"
                min={1}
                max={100}
                value={maxPending}
                onChange={(e) => setMaxPending(Number(e.target.value) || 20)}
              />
            </label>
            <label className="field-label">
              Max requests per person
              <input
                className="field-input"
                type="number"
                min={1}
                max={20}
                value={maxPerGuest}
                onChange={(e) => setMaxPerGuest(Number(e.target.value) || 3)}
              />
            </label>
            <button className="btn primary" onClick={startGig} disabled={busy}>
              Start gig
            </button>
          </div>
        ) : (
          <>
            <p className="muted" style={{ marginTop: "1rem" }}>
              {gig.displayName} · code <strong>{gig.code}</strong>
            </p>
            <p className="muted url-line" title={gig.crowdUrl}>
              Phone: {phoneCrowdUrl}
            </p>
            <p className="muted">{gig.trackCount} tracks in local catalog</p>
            {spotifyCrowdSearch && (
              <p className="muted">Crowd search: Spotify (BPM + key on each request)</p>
            )}
            <p className="muted limits-line">
              Limits: {pending.length}/{gig.maxPendingRequests} pending · {gig.maxRequestsPerGuest}/person
            </p>
            <h4 className="settings-section-label">Gig limits</h4>
            <div className="gig-setup compact">
              <label className="field-label">
                QR name
                <input
                  className="field-input"
                  value={gig.displayName}
                  onChange={(e) => setGig({ ...gig, displayName: e.target.value })}
                  onBlur={() => saveLimits({ displayName: gig.displayName })}
                />
              </label>
              <label className="field-label">
                Queue cap
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  max={100}
                  value={gig.maxPendingRequests}
                  onChange={(e) =>
                    setGig({ ...gig, maxPendingRequests: Number(e.target.value) || 20 })
                  }
                  onBlur={() => saveLimits({ maxPendingRequests: gig.maxPendingRequests })}
                />
              </label>
              <label className="field-label">
                Per person
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  max={20}
                  value={gig.maxRequestsPerGuest}
                  onChange={(e) =>
                    setGig({ ...gig, maxRequestsPerGuest: Number(e.target.value) || 3 })
                  }
                  onBlur={() => saveLimits({ maxRequestsPerGuest: gig.maxRequestsPerGuest })}
                />
              </label>
            </div>
            <h4 className="settings-section-label">Window</h4>
            <button type="button" className={`btn ghost ${pinWindow ? "active-pin" : ""}`} onClick={togglePinWindow}>
              {pinWindow ? "Unpin window" : "Pin on top"}
            </button>
            <h4 className="settings-section-label">Work mode</h4>
            <div className="booth-mode-toggle" role="group" aria-label="Booth work mode">
              {(["crowd", "booth"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`btn ghost booth-mode-btn ${boothWorkMode === mode ? "active" : ""}`}
                  onClick={() => {
                    setBoothWorkMode(mode);
                    saveBoothWorkMode(mode);
                  }}
                >
                  {BOOTH_WORK_MODE_META[mode].label}
                </button>
              ))}
            </div>
            <p className="muted sync-hint">{BOOTH_WORK_MODE_META[boothWorkMode].hint}</p>
            <h4 className="settings-section-label">Crowd sync</h4>
            <p className="muted sync-hint">
              Requests use your hotspot in the background — never Serato. If Wi‑Fi drops, accept/decline
              still works offline. Your music files never leave this laptop.
            </p>
            <label className="sync-poll-label">
              Check for new requests
              <select
                className="sync-poll-select"
                value={syncPollPreset}
                onChange={(e) => {
                  const next = e.target.value as SyncPollPreset;
                  setSyncPollPreset(next);
                  saveSyncPollPreset(next);
                }}
              >
                {SYNC_POLL_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {syncPollPresetMeta(p).label}
                  </option>
                ))}
              </select>
              <small className="muted">{syncPollPresetMeta(syncPollPreset).hint}</small>
            </label>
            <h4 className="settings-section-label">Library</h4>
            <div className="library-source-summary">
              <span className="muted library-source-summary-label">Library profile:</span>
              <strong>
                {librarySource ? LIBRARY_SOURCE_LABELS[librarySource].title : "Not picked"}
              </strong>
              <LibraryProfilePicker
                value={librarySource}
                onChange={pickLibrarySource}
                showHeading={false}
              />
            </div>
            <button className="btn primary" onClick={syncNow} disabled={busy}>
              Sync now
            </button>
            {shouldImportLocalLibrary(librarySource) ? (
              <>
                <button
                  className="btn ghost"
                  onClick={() => importLibrary("auto")}
                  disabled={busy}
                >
                  {djSoftware === "rekordbox" ? "Auto-import Rekordbox" : "Auto-import Serato"}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => importLibrary("file")}
                  disabled={busy}
                >
                  {djSoftware === "rekordbox" ? "Choose rekordbox.xml…" : "Choose Subcrates folder…"}
                </button>
              </>
            ) : (
              <p className="muted library-source-skip">
                Spotify-only profile — Q doesn&apos;t need a local-library import. The crowd will
                find tracks via Spotify search; you cue them up live in {djSoftware === "rekordbox" ? "Rekordbox" : "Serato"}.
              </p>
            )}
            {setupHint && (
              <LibrarySetupHint
                kind={setupHint}
                onPickManually={() => {
                  setSetupHint(null);
                  void importLibrary("file");
                }}
                onDismiss={() => setSetupHint(null)}
              />
            )}
            {djSoftware === "rekordbox" && (
              <>
                <h4 className="settings-section-label">Live tracking</h4>
                <div className="prolink-status">
                  <span
                    className={`prolink-dot prolink-dot-${prolinkStatus}`}
                    aria-hidden
                  />
                  <span className="prolink-label">
                    {prolinkStatus === "connected"
                      ? "Pro DJ Link: connected"
                      : prolinkStatus === "listening"
                        ? "Pro DJ Link: listening…"
                        : prolinkStatus === "stopped"
                          ? "Pro DJ Link: off"
                          : "Pro DJ Link: idle"}
                  </span>
                </div>
                {prolinkDetail && (
                  <p className="muted prolink-detail">{prolinkDetail}</p>
                )}
                <label className="auto-advance-toggle">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => {
                      setAutoAdvance(e.target.checked);
                      saveAutoAdvance(e.target.checked);
                    }}
                  />
                  <span>
                    Auto-advance queue by track length
                    <small className="muted">
                      Fallback when no CDJ/DDJ-1000 broadcasts. Auto-promotes the next
                      queued song after the current one's duration elapses.
                    </small>
                  </span>
                </label>
              </>
            )}
            <h4 className="settings-section-label">Audience visibility</h4>
            <PrivacyFiltersPanel
              filters={privacyFilters}
              onChange={updatePrivacyFilters}
              privateCount={privateHidden}
            />
            {hiddenEntries.length > 0 && (
              <button
                type="button"
                className="btn ghost btn-inspector"
                onClick={() => setInspectorOpen(true)}
              >
                View hidden tracks ({hiddenEntries.length})
              </button>
            )}
            {crateOptions.length > 0 && (
              <CrateSelectionPanel
                softwareLabel={djSoftware === "rekordbox" ? "Rekordbox" : "Serato"}
                unitsLabel={djSoftware === "rekordbox" ? "playlists" : "crates"}
                options={crateOptions}
                selection={djSoftware === "rekordbox" ? rekordboxSelection : seratoSelection}
                onChange={djSoftware === "rekordbox" ? updateRekordboxSelection : updateSeratoSelection}
                onReimport={() => void importLibrary("auto")}
                busy={busy}
              />
            )}
            <button
              className="btn ghost"
              onClick={() => {
                if (gig && online) {
                  void endSession(gig.sessionId, gig.djToken).catch(() => {
                    /* local clear still runs */
                  });
                }
                setGig(null);
                saveGig(null);
                setRequests([]);
                setQueue([]);
                setNowPlaying(null);
                setPlayedHistory([]);
                setProHints([]);
              }}
            >
              End gig
            </button>
          </>
        )}

        <div className={`status ${online ? "online" : "offline"}`}>
          {online ? (
            boothWorkMode === "booth" ? (
              <>Online — booth only (manual Sync){formatLastSyncAgo() ? ` · last OK ${formatLastSyncAgo()}` : ""}</>
            ) : (
              <>
                Online — crowd sync every {syncPollIntervalMs(syncPollPreset) / 1000}s
                {formatLastSyncAgo() ? ` · last OK ${formatLastSyncAgo()}` : ""}
              </>
            )
          ) : (
            "Offline — decisions saved locally; music unaffected."
          )}
        </div>
        {gig && (outbox.decisions > 0 || outbox.library) && (
          <p className="outbox-badge">
            Queued: {outbox.decisions} decision{outbox.decisions !== 1 ? "s" : ""}
            {outbox.library ? " · library" : ""}
          </p>
        )}
        {gig && online && serverPending > pending.length && (
          <p className="outbox-badge server">
            {serverPending - pending.length} more request(s) on server — tap Sync
          </p>
        )}
        {message && <p className="muted" style={{ marginTop: "0.75rem" }}>{message}</p>}
      </aside>

      <main className="panel main-panel">
        {!gig && <p className="empty">Start a gig to get your QR sticker and request queue.</p>}
        {gig && (
          <QrSticker
            crowdUrl={gig.crowdUrl}
            phoneCrowdUrl={phoneCrowdUrl}
            sessionCode={gig.code}
            displayName={gig.displayName}
            showLanHint={crowdUrlNeedsLanHint(gig.crowdUrl) && !phoneCrowdUrlIsLocalhost(phoneCrowdUrl)}
            localhostQrWarning={phoneCrowdUrlIsLocalhost(phoneCrowdUrl)}
            compact={dockMode}
            disabled={busy}
          />
        )}
      </main>

      <aside className="panel right-stack">
        <section className="right-pane work-pane">
          <div className="queue-block">
            <NowPlayingBar
              nowPlaying={nowPlaying}
              seratoActive={Boolean(gig) && djSoftware === "serato"}
              seratoLinkStatus={seratoLinkStatus}
              prolinkStatus={prolinkStatus}
              autoAdvanceActive={autoAdvanceActive}
              djSoftware={djSoftware}
            />
            <div className="pane-header">
              <h2 className="pane-heading">Queue</h2>
              {gig && queue.length > 0 && <span className="queue-count">{queue.length}</span>}
            </div>
            <p className="pane-sub muted">Accepted tracks — drop off when you play them.</p>
            {tier === "pro" && proHints.length > 0 && (
              <div className="queue-suggestions">
                {proHints.map((s, i) => (
                  <div key={i} className="suggestion pro">
                    <strong>{s.label}</strong>
                    <span>{s.detail}</span>
                  </div>
                ))}
              </div>
            )}
            {gig &&
              (!online || boothWorkMode === "booth") &&
              (tier !== "pro" || proHints.length === 0) && (
                <div className="queue-suggestions">
                  {localSuggestionsOffline({
                    nowPlaying,
                    queueCount: queue.length,
                    boothOnly: boothWorkMode === "booth",
                  }).map((s, i) => (
                    <div key={i} className="suggestion">
                      <strong>{s.label}</strong>
                      <span>{s.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            {!gig && <p className="pane-empty muted">Start a gig first.</p>}
            {gig && queue.length === 0 && (
              <p className="pane-empty muted">Empty — accept a request below.</p>
            )}
            {queue.length > 0 && (
              <ul className="dj-queue-list">
                {queue.map((item) => (
                  <li key={item.requestId} className="dj-queue-item">
                    <div className="dj-queue-main">
                      <strong>{item.title}</strong>
                      <span>{item.artist}</span>
                      <TrackMeta bpm={item.bpm} musicalKey={item.key} />
                      {item.playedEarlierTonight && (
                        <span className="badge played-earlier">Played once already</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-top btn-quiet"
                      onClick={() => markQueuePlaying(item)}
                      title={
                        djSoftware === "rekordbox"
                          ? "Mark as now playing"
                          : "Remove if auto-detect missed"
                      }
                    >
                      {djSoftware === "rekordbox" ? "Playing" : "✕"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="requests-block">
            <div className="pane-header">
              <h2 className="pane-heading">Requests</h2>
              {gig && pending.length > 0 && (
                <span className={`queue-count ${requestPulse ? "pulse" : ""}`}>{pending.length}</span>
              )}
            </div>
            {gig && (
              <p className="pane-sub requests-hint muted">
                Accept or Decline on screen — keep your headphones on; no crowd yelling needed.
              </p>
            )}
            {!gig && <p className="pane-empty muted">Start a gig first.</p>}
            {gig && pending.length === 0 && (
              <p className="pane-empty muted">
                No pending requests.
                {!online && " Sync when online to pull crowd submissions."}
              </p>
            )}
            <ul className="requests-list">
              {pending.map((r) => (
              <li key={r.id} className="request">
                <div className="request-top">
                  {pendingIds.has(r.id) && <span className="badge pending">Queued to sync</span>}
                  {(r.playedEarlierTonight ||
                    wasPlayedEarlierTonight(
                      r.title,
                      r.artist,
                      playedHistory,
                      nowPlaying,
                    )) && (
                    <span className="badge played-earlier">Played once already</span>
                  )}
                </div>
                <div className="request-headline">
                  <h3>{r.title}</h3>
                  <TrackMeta bpm={r.bpm} musicalKey={r.key} compact />
                </div>
                <p className="meta">
                  {r.artist}
                  {r.source === "spotify" && " · Spotify"}
                  {r.inStock && " · In crate"}
                </p>
                <div className="actions">
                  <button
                    type="button"
                    className="btn good"
                    disabled={busy}
                    onClick={() => handleDecision(r.id, "accepted")}
                  >
                    Accept
                  </button>
                  <DeclineMenu
                    buttonClassName="btn bad"
                    buttonContent="Decline"
                    disabled={busy}
                    onDecline={(reason) => handleDecision(r.id, "declined", reason)}
                  />
                </div>
              </li>
            ))}
            </ul>
          </div>
        </section>
      </aside>
    </div>
  );
}
