import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CrowdRequest,
  CreateSessionResponse,
  DjProfile,
  PlanTier,
  TransitionSuggestion,
} from "@q/shared";
import {
  createSession,
  syncLibrary,
  syncPlayedTracks,
  updateRequest,
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
import TrackMeta from "./components/TrackMeta";
import { useSeratoPlayback, type SeratoLinkStatus } from "./hooks/useSeratoPlayback";
import {
  fetchAccountMe,
  getAccountToken,
  loginAccount,
  registerAccount,
  saveAccountToken,
} from "./lib/account";
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

const STORAGE_KEY = "q-gig";
const DJ_NAME_KEY = "q-dj-display-name";
const VIEW_MODE_KEY = "q-view-mode";
const PLAN_KEY = "q-plan-tier";
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
  const [account, setAccount] = useState<DjProfile | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const [accountMode, setAccountMode] = useState<"signin" | "register">("signin");
  const [lanIpv4, setLanIpv4] = useState<string | null>(null);
  const [spotifyCrowdSearch, setSpotifyCrowdSearch] = useState(false);
  const [requestPulse, setRequestPulse] = useState(false);
  const [startGigPromptOpen, setStartGigPromptOpen] = useState(false);
  const [privacyFilters, setPrivacyFilters] = useState<PrivacyFilters>(() => loadPrivacyFilters());
  const [privateHidden, setPrivateHidden] = useState(0);
  const [hiddenEntries, setHiddenEntries] = useState<HiddenTrackEntry[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [allowedOnce, setAllowedOnce] = useState<Set<string>>(() => new Set());
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

  function allowOnce(externalId: string) {
    setAllowedOnce((prev) => {
      const next = new Set(prev);
      next.add(externalId);
      return next;
    });
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
        return result;
      } catch {
        return null;
      }
    },
    [gig, online, refreshOutbox],
  );

  useEffect(() => {
    if (!gig || !online) return;
    doSync(false);
    const id = setInterval(() => doSync(false), 4000);
    return () => clearInterval(id);
  }, [gig, online, doSync]);

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

  useSeratoPlayback({
    enabled: seratoOn,
    onNowPlaying: setNowPlaying,
    onHistory: setPlayedHistory,
    onLinkStatus: setSeratoLinkStatus,
  });

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
    return {
      requestId: request.id,
      title: request.title,
      artist: request.artist,
      bpm: request.bpm ?? np?.bpm,
      key: request.key ?? np?.key,
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
      setMessage(
        parts.length > 0
          ? `Synced: ${parts.join(", ")}. ${result.pendingOnServer} pending on server.`
          : `Up to date. ${result.pendingOnServer} pending on server.`,
      );
    } else {
      setMessage("Sync failed — try again in a few seconds.");
    }
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
        setMessage(
          mode === "auto"
            ? djSoftware === "rekordbox"
              ? "No rekordbox.xml found. Export from Rekordbox or pick the file manually."
              : "No Serato Subcrates folder found. Point to your _Serato_/Subcrates folder."
            : "Import cancelled.",
        );
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
        setMessage(`Imported ${countLabel}${privateNote} and synced to cloud.`);
      } else {
        queueLibraryIfOffline(gig.sessionId, localTracks, true);
        setMessage(
          `Imported ${countLabel}${privateNote} locally. Queued — tap Sync when online.`,
        );
      }
      refreshOutbox();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(requestId: string, status: "accepted" | "declined") {
    if (!gig) return;
    setBusy(true);

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
    );

    try {
      if (online) {
        const res = await updateRequest(
          gig.sessionId,
          gig.djToken,
          requestId,
          status,
          tierRef.current,
        );
        setRequests((prev) => prev.map((r) => (r.id === requestId ? res.request : r)));
        if (status === "accepted") {
          addToQueue(res.request);
          setProHints(
            tierRef.current === "pro" ? res.suggestions.filter((s) => s.pro) : [],
          );
        } else {
          removeFromQueue(requestId);
          setProHints([]);
        }
      } else {
        queueDecisionIfOffline(gig.sessionId, requestId, status, false);
        refreshOutbox();
        if (status === "accepted") {
          const req = requestsRef.current.find((r) => r.id === requestId);
          if (req) addToQueue({ ...req, status: "accepted" });
          setProHints([]);
        } else {
          removeFromQueue(requestId);
          setProHints([]);
        }
        setMessage("Saved offline — will send when you sync.");
      }
    } catch {
      queueDecision({ sessionId: gig.sessionId, requestId, status });
      refreshOutbox();
      if (status === "accepted") {
        const req = requestsRef.current.find((r) => r.id === requestId);
        if (req) addToQueue({ ...req, status: "accepted" });
      } else {
        removeFromQueue(requestId);
      }
      setMessage("Queued — tap Sync now when you have signal.");
    } finally {
      setBusy(false);
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
          onDecline={(id) => void handleDecision(id, "declined")}
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
          <h4 className="settings-section-label">DJ software</h4>
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
                  <div className="account-tabs" style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      type="button"
                      className={`btn ghost ${accountMode === "signin" ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setAccountMode("signin")}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      className={`btn ghost ${accountMode === "register" ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setAccountMode("register")}
                    >
                      Register
                    </button>
                  </div>
                  {accountMode === "register" && (
                    <>
                      <input
                        className="field-input"
                        placeholder="Username (e.g. dj_ayesh)"
                        value={accountHandle}
                        onChange={(e) => setAccountHandle(e.target.value.toLowerCase())}
                        style={{ marginTop: "0.35rem" }}
                      />
                    </>
                  )}
                  <input
                    className="field-input"
                    type="email"
                    placeholder="Email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    style={{ marginTop: "0.35rem" }}
                  />
                  <input
                    className="field-input"
                    type="password"
                    placeholder="Password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    style={{ marginTop: "0.35rem" }}
                  />
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ marginTop: "0.35rem", width: "100%" }}
                    disabled={busy}
                    onClick={async () => {
                      const email = accountEmail.trim();
                      const password = accountPassword;
                      const handle = accountHandle.trim();
                      if (!email || !password) {
                        setMessage("Enter your email and password.");
                        return;
                      }
                      if (accountMode === "register" && !handle) {
                        setMessage("Choose a handle (e.g. @djyesh) to register.");
                        return;
                      }
                      setBusy(true);
                      setMessage(
                        accountMode === "register"
                          ? "Creating account…"
                          : "Signing in…",
                      );
                      try {
                        const res =
                          accountMode === "register"
                            ? await registerAccount({
                                email,
                                password,
                                handle,
                                displayName: handle,
                              })
                            : await loginAccount(email, password);
                        saveAccountToken(res.accountToken);
                        setAccount(res.user);
                        setAccountPassword("");
                        setMessage(`Signed in as @${res.user.handle}`);
                      } catch (e) {
                        setMessage(
                          e instanceof Error
                            ? `Sign-in failed: ${e.message}`
                            : "Sign-in failed — check your internet and try again.",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {accountMode === "register" ? "Create account" : "Sign in"}
                  </button>
                  <p className="muted" style={{ fontSize: "0.72rem", marginTop: "0.35rem" }}>
                    Or use {WEB_URL}/register in your browser.
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
            <h4 className="settings-section-label">Library</h4>
            <button className="btn primary" onClick={syncNow} disabled={busy}>
              Sync now
            </button>
            <button className="btn ghost" onClick={() => importLibrary("auto")} disabled={busy}>
              {djSoftware === "rekordbox" ? "Auto-import Rekordbox" : "Auto-import Serato"}
            </button>
            <button className="btn ghost" onClick={() => importLibrary("file")} disabled={busy}>
              {djSoftware === "rekordbox" ? "Choose rekordbox.xml…" : "Choose Subcrates folder…"}
            </button>
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
          {online
            ? "Online — auto-syncing"
            : "Offline — booth mode. Decisions saved locally."}
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
                  <button
                    type="button"
                    className="btn bad"
                    disabled={busy}
                    onClick={() => handleDecision(r.id, "declined")}
                  >
                    Decline
                  </button>
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
