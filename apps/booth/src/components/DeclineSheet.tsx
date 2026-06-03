import type { DeclineReason } from "@q/shared";
import { DECLINE_REASON_LABELS } from "@q/shared";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BoothKicker from "./BoothKicker";
import { colors, fonts, spacing, type } from "../theme";

const REASON_ORDER: DeclineReason[] = [
  "vibe",
  "genre",
  "tempo",
  "explicit",
  "duplicate",
  "already_played",
  "not_now",
  "unavailable",
  "other",
];

type Props = {
  visible: boolean;
  title: string;
  artist: string;
  onPick: (reason?: DeclineReason) => void;
  onClose: () => void;
};

export default function DeclineSheet({ visible, title, artist, onPick, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <BoothKicker>// Decline</BoothKicker>
          <Text style={styles.track} numberOfLines={2}>
            {title} · {artist}
          </Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {REASON_ORDER.map((key) => (
              <Pressable key={key} style={styles.reasonRow} onPress={() => onPick(key)}>
                <Text style={styles.reasonText}>{DECLINE_REASON_LABELS[key]}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.reasonRow, styles.skip]} onPress={() => onPick(undefined)}>
              <Text style={styles.skipText}>Decline without reason</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceGlass,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: spacing.pad,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  track: {
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 12,
    fontSize: type.caption,
  },
  list: { maxHeight: 360 },
  reasonRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reasonText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: type.body,
  },
  skip: { borderBottomWidth: 0, marginTop: 8 },
  skipText: {
    fontFamily: fonts.mono,
    color: colors.dim,
    fontSize: type.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
