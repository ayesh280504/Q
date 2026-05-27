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
import DeclineSheet from "../components/DeclineSheet";
import NowPlayingHeader from "../components/NowPlayingHeader";
import SuggestionsStrip from "../components/SuggestionsStrip";
import SwipeRequestCard from "../components/SwipeRequestCard";
import type { BoothGig } from "../storage";
import { colors, type as typeScale } from "../theme";

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
      <NowPlayingHeader live={live} pendingCount={pendingCount} gigCode={gig.code} />
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
            tintColor={colors.accent}
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
        <Pressable style={styles.linkBtn} onPress={() => void copyLink()}>
          <Text style={styles.linkBtnText}>{copied ? "Copied!" : "Copy crowd link"}</Text>
        </Pressable>
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
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  section: { color: colors.text, fontWeight: "700", fontSize: typeScale.body },
  swipeHint: { color: colors.dim, fontSize: 11 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 40 },
  footer: { paddingVertical: 12, gap: 8 },
  linkBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  linkBtnText: { color: colors.accent, fontWeight: "600" },
  endBtn: {
    padding: 12,
    alignItems: "center",
  },
  endText: { color: colors.muted, fontSize: typeScale.caption },
});
