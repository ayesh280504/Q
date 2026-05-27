import type { DeclineReason } from "@q/shared";
import { DECLINE_REASON_LABELS } from "@q/shared";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, type as typeScale } from "../theme";

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
          <Text style={styles.heading}>Decline</Text>
          <Text style={styles.track} numberOfLines={2}>
            {title} · {artist}
          </Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {REASON_ORDER.map((key) => (
              <Pressable
                key={key}
                style={styles.reasonRow}
                onPress={() => onPick(key)}
              >
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
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  heading: { color: colors.text, fontSize: typeScale.title, fontWeight: "700" },
  track: { color: colors.muted, marginTop: 6, marginBottom: 12, fontSize: typeScale.caption },
  list: { maxHeight: 360 },
  reasonRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reasonText: { color: colors.text, fontSize: typeScale.body },
  skip: { borderBottomWidth: 0, marginTop: 8 },
  skipText: { color: colors.dim, fontSize: typeScale.caption, textAlign: "center" },
});
