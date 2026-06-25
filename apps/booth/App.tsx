import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useBoothFonts } from "./src/hooks/useBoothFonts";
import type { CrowdRequest, DeclineReason, DjProfile, LibrarySource, SessionLiveStatus, TransitionSuggestion } from "@q/shared";
import {
  createSession,
  crowdProfileUrl,
  endSession,
  fetchLiveStatus,
  fetchMe,
  fetchRequests,
  fetchSyncStatus,
  login,
  updateRequest,
} from "./src/api";
import LiveScreen from "./src/screens/LiveScreen";
import SignInScreen from "./src/screens/SignInScreen";
import StartGigScreen from "./src/screens/StartGigScreen";
import {
  loadAccountToken,
  loadDesktopPairing,
  loadGig,
  loadLibrarySourcePref,
  saveAccountToken,
  saveDesktopPairing,
  saveGig,
  saveLibrarySourcePref,
  type BoothGig,
  type DesktopPairing,
} from "./src/storage";
import {
  probeDesktop,
  pushGigHandoff,
  requestDesktopStartGig,
} from "./src/lanHandoff";
import { colors, fonts } from "./src/theme";

type Screen = "loading" | "signin" | "home" | "live";

const POLL_MS = 15_000;

export default function App() {
  const fontsLoaded = useBoothFonts();
  const [screen, setScreen] = useState<Screen>("loading");
  const [profile, setProfile] = useState<DjProfile | null>(null);
  const [gig, setGig] = useState<BoothGig | null>(null);
  const [librarySource, setLibrarySource] = useState<LibrarySource | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<CrowdRequest[]>([]);
  const [live, setLive] = useState<SessionLiveStatus | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [suggestions, setSuggestions] = useState<TransitionSuggestion[]>([]);
  const [desktopHost, setDesktopHost] = useState("");
  const [desktopToken, setDesktopToken] = useState("");

  useEffect(() => {
    void loadDesktopPairing().then((p) => {
      if (p) {
        setDesktopHost(p.host);
        setDesktopToken(p.token);
      }
    });
  }, []);

  useEffect(() => {
    void (async () => {
      const [token, savedGig, savedLib] = await Promise.all([
        loadAccountToken(),
        loadGig(),
        loadLibrarySourcePref(),
      ]);
      if (savedLib) setLibrarySource(savedLib);
      if (!token) {
        setScreen("signin");
        return;
      }
      try {
        const me = await fetchMe(token);
        setProfile(me.user);
        if (savedGig) {
          setGig(savedGig);
          setScreen("live");
        } else {
          setScreen("home");
        }
      } catch {
        await saveAccountToken(null);
        setScreen("signin");
      }
    })();
  }, []);

  const refreshLive = useCallback(async () => {
    if (!gig) return;
    const [reqRes, liveRes, syncRes] = await Promise.all([
      fetchRequests(gig.sessionId, gig.djToken),
      fetchLiveStatus(gig.sessionId),
      fetchSyncStatus(gig.sessionId, gig.djToken),
    ]);
    setRequests(reqRes.requests.filter((r) => r.status === "pending"));
    setLive(liveRes.status);
    setPendingCount(syncRes.pendingCount);
  }, [gig]);

  useEffect(() => {
    if (screen !== "live" || !gig) return;
    void refreshLive().catch(() => {});
    const id = setInterval(() => void refreshLive().catch(() => {}), POLL_MS);
    return () => clearInterval(id);
  }, [screen, gig, refreshLive]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      await saveAccountToken(res.accountToken);
      setProfile(res.user);
      setScreen("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleStartGig() {
    const token = await loadAccountToken();
    if (!token || !profile || !librarySource) return;
    setBusy(true);
    setError(null);
    try {
      await saveLibrarySourcePref(librarySource);
      const displayName = profile.displayName;
      const crowdProfile = crowdProfileUrl(profile.handle);

      let pairing: DesktopPairing | null = null;
      if (desktopHost.trim() && desktopToken.trim()) {
        pairing = {
          host: desktopHost.trim(),
          port: 8765,
          token: desktopToken.trim(),
        };
        await saveDesktopPairing(pairing);
      } else {
        pairing = await loadDesktopPairing();
      }

      if (pairing && (await probeDesktop(pairing))) {
        try {
          const handoff = await requestDesktopStartGig(pairing, {
            displayName,
            librarySource,
            crowdProfileUrl: crowdProfile,
          });
          const next: BoothGig = {
            sessionId: handoff.sessionId,
            code: handoff.code,
            djToken: handoff.djToken,
            crowdUrl: handoff.crowdUrl,
            crowdProfileUrl: handoff.crowdProfileUrl ?? crowdProfile,
            displayName: handoff.displayName,
            librarySource,
          };
          await saveGig(next);
          setGig(next);
          setSuggestions([]);
          setScreen("live");
          return;
        } catch {
          /* try cloud below */
        }
      }

      const res = await createSession(token, {
        name: "Tonight",
        displayName,
        librarySource,
      });
      const next: BoothGig = {
        sessionId: res.session.id,
        code: res.session.code,
        djToken: res.djToken,
        crowdUrl: res.crowdUrl,
        crowdProfileUrl: res.crowdProfileUrl ?? crowdProfile,
        displayName: res.session.displayName ?? displayName,
        librarySource,
      };
      await saveGig(next);
      setGig(next);
      setSuggestions([]);
      setScreen("live");

      if (pairing && (await probeDesktop(pairing))) {
        try {
          await pushGigHandoff(pairing, {
            sessionId: next.sessionId,
            code: next.code,
            djToken: next.djToken,
            name: "Tonight",
            displayName: next.displayName,
            crowdUrl: next.crowdUrl,
            crowdProfileUrl: next.crowdProfileUrl,
            librarySource,
          });
        } catch {
          /* laptop not on LAN */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start gig");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndGig() {
    if (!gig) return;
    setBusy(true);
    try {
      await endSession(gig.sessionId, gig.djToken);
    } catch {
      /* clear locally */
    }
    await saveGig(null);
    setGig(null);
    setRequests([]);
    setLive(null);
    setSuggestions([]);
    setScreen("home");
    setBusy(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshLive();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAccept(requestId: string) {
    if (!gig) return;
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const res = await updateRequest(gig.sessionId, gig.djToken, requestId, "accepted");
      setSuggestions(res.suggestions.slice(0, 3));
    } catch {
      void refreshLive();
    }
  }

  async function handleDecline(requestId: string, reason?: DeclineReason) {
    if (!gig) return;
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      await updateRequest(gig.sessionId, gig.djToken, requestId, "declined", reason);
    } catch {
      void refreshLive();
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.pink} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === "loading" && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.pink} size="large" />
          <Text style={styles.loadingText}>Q Booth</Text>
          <StatusBar style="light" />
        </View>
      )}
      {screen === "signin" && (
        <SignInScreen
          email={email}
          password={password}
          error={error}
          busy={busy}
          onEmail={setEmail}
          onPassword={setPassword}
          onSubmit={() => void handleSignIn()}
        />
      )}
      {screen === "home" && profile && (
        <StartGigScreen
          profile={profile}
          librarySource={librarySource}
          desktopHost={desktopHost}
          desktopToken={desktopToken}
          onDesktopHost={setDesktopHost}
          onDesktopToken={setDesktopToken}
          error={error}
          busy={busy}
          onLibrarySource={(s) => {
            setLibrarySource(s);
            void saveLibrarySourcePref(s);
          }}
          onStart={() => void handleStartGig()}
          onSignOut={() => {
            void saveAccountToken(null);
            setProfile(null);
            setScreen("signin");
          }}
        />
      )}
      {screen === "live" && gig && (
        <LiveScreen
          gig={gig}
          live={live}
          requests={requests}
          suggestions={suggestions}
          pendingCount={pendingCount}
          refreshing={refreshing}
          busy={busy}
          onRefresh={handleRefresh}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onEndGig={() => void handleEndGig()}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.monoBold,
    color: colors.pink,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
