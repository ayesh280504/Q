import type { CrowdRequest, DeclineReason, SessionLiveStatus, TransitionSuggestion } from "@q/shared";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BoothButton from "../components/BoothButton";
import DeclineSheet from "../components/DeclineSheet";
import NowPlayingHeader from "../components/NowPlayingHeader";
import QLogo from "../components/QLogo";
import SuggestionsStrip from "../components/SuggestionsStrip";
import MixCoachStrip from "../components/MixCoachStrip";
import SwipeRequestCard from "../components/SwipeRequestCard";
import type { BoothGig } from "../storage";
import { colors, fonts, spacing, type } from "../theme";

type Props = {
  gig: BoothGig;
  live: SessionLiveStatus | null;
  requests: CrowdRequest[];
  suggestions: TransitionSuggestion[];
  pendingCount: number;
  refreshing: boolean;
  busy: boolean;
  onRefresh: () => Promise<void>;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string, reason?: DeclineReason) => Promise<void>;
  onEndGig: () => void;
};

export default function LiveScreen({
  gig,
  live,
  requests,
  suggestions,
  pendingCount,
  refreshing,
  busy,
  onRefresh,
  onAccept,
  onDecline,
  onEndGig,
}: Props) {
  const [declineTarget, setDeclineTarget] = useState<CrowdRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    const url = gig.crowdProfileUrl ?? gig.crowdUrl;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [gig]);

  const handleAccept = useCallback(
    async (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onAccept(id);
    },
    [onAccept],
  );

  const handleDeclinePick = useCallback(
    async (reason?: DeclineReason) => {
      if (!declineTarget) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const id = declineTarget.id;
      setDeclineTarget(null);
      await onDecline(id, reason);
    },
    [declineTarget, onDecline],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <QLogo size={28} />
        <View style={styles.topMeta}>
          <Text style={styles.topLabel}>Live · {gig.code}</Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {gig.displayName}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.syncPill}>
            <Text style={styles.syncPillText}>{pendingCount} sync</Text>
          </View>
        )}
      </View>
      <NowPlayingHeader live={live} pendingCount={pendingCount} gigCode={gig.code} />
      <MixCoachStrip sessionId={gig.sessionId} djToken={gig.djToken} live={live} />
      <SuggestionsStrip suggestions={suggestions} />
      <View style={styles.listHeader}>
        <Text style={styles.section}>Requests</Text>
        <Text style={styles.swipeHint}>Swipe → accept · ← decline</Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.pink}
          />
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <Text style={styles.empty}>No pending requests — crowd QR is live.</Text>
        }
        renderItem={({ item }) => (
          <SwipeRequestCard
            item={item}
            onAccept={() => void handleAccept(item.id)}
            onDeclinePress={() => setDeclineTarget(item)}
          />
        )}
      />
      <View style={styles.footer}>
        <BoothButton variant="ghost" onPress={() => void copyLink()}>
          {copied ? "Copied!" : "Copy crowd link"}
        </BoothButton>
        <Pressable style={styles.endBtn} onPress={onEndGig} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <Text style={styles.endText}>End gig</Text>
          )}
        </Pressable>
      </View>
      <DeclineSheet
        visible={declineTarget != null}
        title={declineTarget?.title ?? ""}
        artist={declineTarget?.artist ?? ""}
        onPick={(r) => void handleDeclinePick(r)}
        onClose={() => setDeclineTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.padSm },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingTop: 4,
  },
  topMeta: { flex: 1, minWidth: 0 },
  topLabel: {
    fontFamily: fonts.monoBold,
    fontSize: type.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.pink,
  },
  topSub: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 2,
  },
  syncPill: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  syncPillText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  section: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: type.body,
  },
  swipeHint: {
    fontFamily: fonts.mono,
    color: colors.dim,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: {
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 40,
  },
  footer: { paddingVertical: 12, gap: 8 },
  endBtn: { padding: 12, alignItems: "center" },
  endText: {
    fontFamily: fonts.mono,
    color: colors.muted,
    fontSize: type.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
