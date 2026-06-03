import { useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CrowdRequest } from "@q/shared";
import TrackPill from "./TrackPill";
import { colors, fonts, spacing, type } from "../theme";

const SWIPE_THRESHOLD = 72;

type Props = {
  item: CrowdRequest;
  onAccept: () => void;
  onDeclinePress: () => void;
};

export default function SwipeRequestCard({ item, onAccept, onDeclinePress }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          onAccept();
        } else if (g.dx < -SWIPE_THRESHOLD) {
          onDeclinePress();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.shell}>
      <View style={styles.underlay}>
        <View style={[styles.hintSide, styles.hintAccept]}>
          <Text style={styles.hintText}>Accept →</Text>
        </View>
        <View style={[styles.hintSide, styles.hintDecline]}>
          <Text style={styles.hintText}>← Decline</Text>
        </View>
      </View>
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artist}
        </Text>
        {item.message ? (
          <Text style={styles.message} numberOfLines={2}>
            &ldquo;{item.message}&rdquo;
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.bpm != null && <TrackPill label={`${Math.round(item.bpm)} BPM`} tone="cyan" />}
          {item.key ? <TrackPill label={item.key} tone="purple" /> : null}
          {item.inStock && <Text style={styles.inStock}>In library</Text>}
          {item.playedEarlierTonight && <TrackPill label="Played tonight" tone="warn" />}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptLabel}>Accept</Text>
          </Pressable>
          <Pressable style={styles.declineBtn} onPress={onDeclinePress}>
            <Text style={styles.declineLabel}>Decline</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: 12, borderRadius: spacing.radiusLg, overflow: "hidden" },
  underlay: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  hintSide: { flex: 1, justifyContent: "center", paddingHorizontal: 12 },
  hintAccept: { backgroundColor: "rgba(244, 244, 245, 0.08)", alignItems: "flex-start" },
  hintDecline: { backgroundColor: colors.declineDim, alignItems: "flex-end" },
  hintText: {
    fontFamily: fonts.monoBold,
    color: colors.muted,
    fontSize: type.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: spacing.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: colors.text,
    fontSize: 18,
  },
  artist: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.body,
    marginTop: 4,
  },
  message: {
    fontFamily: fonts.body,
    color: colors.dim,
    fontSize: type.caption,
    marginTop: 8,
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    alignItems: "center",
  },
  inStock: {
    fontFamily: fonts.mono,
    color: colors.accept,
    fontSize: type.mono,
    letterSpacing: 0.5,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.radius,
    alignItems: "center",
  },
  acceptLabel: {
    fontFamily: fonts.monoBold,
    color: colors.primaryText,
    fontSize: type.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  declineBtn: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
    paddingVertical: 12,
    borderRadius: spacing.radius,
    alignItems: "center",
  },
  declineLabel: {
    fontFamily: fonts.monoBold,
    color: colors.text,
    fontSize: type.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
