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
import { colors, type as typeScale } from "../theme";

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
          {item.bpm != null && <Text style={styles.meta}>{Math.round(item.bpm)} BPM</Text>}
          {item.key ? <Text style={styles.meta}>{item.key}</Text> : null}
          {item.inStock && <Text style={styles.inStock}>In library</Text>}
          {item.playedEarlierTonight && (
            <Text style={styles.warn}>Played tonight</Text>
          )}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.btnLabel}>Accept</Text>
          </Pressable>
          <Pressable style={styles.declineBtn} onPress={onDeclinePress}>
            <Text style={styles.btnLabel}>Decline</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: 12, borderRadius: 12, overflow: "hidden" },
  underlay: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  hintSide: { flex: 1, justifyContent: "center", paddingHorizontal: 12 },
  hintAccept: { backgroundColor: colors.acceptDim, alignItems: "flex-start" },
  hintDecline: { backgroundColor: colors.declineDim, alignItems: "flex-end" },
  hintText: { color: colors.muted, fontWeight: "600", fontSize: typeScale.caption },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  artist: { color: colors.muted, fontSize: typeScale.body, marginTop: 2 },
  message: { color: colors.dim, fontSize: typeScale.caption, marginTop: 8, fontStyle: "italic" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  meta: { color: colors.accent, fontSize: typeScale.caption, fontWeight: "600" },
  inStock: { color: colors.accept, fontSize: typeScale.caption },
  warn: { color: colors.warn, fontSize: typeScale.caption },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.accept,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnLabel: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
});
