import { StyleSheet, Text, View } from "react-native";
import type { SessionLiveStatus } from "@q/shared";
import { colors, type as typeScale } from "../theme";

type Props = {
  live: SessionLiveStatus | null;
  pendingCount: number;
  gigCode: string;
};

export default function NowPlayingHeader({ live, pendingCount, gigCode }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Now playing</Text>
        <View style={styles.badges}>
          <Text style={styles.code}>{gigCode}</Text>
          {pendingCount > 0 && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>
      {live ? (
        <>
          <Text style={styles.title} numberOfLines={2}>
            {live.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {live.artist}
          </Text>
          <View style={styles.metaRow}>
            {live.bpm != null && (
              <Text style={styles.bpm}>{Math.round(live.bpm)}</Text>
            )}
            {live.bpm != null && <Text style={styles.bpmUnit}>BPM</Text>}
            {live.key ? <Text style={styles.key}>{live.key}</Text> : null}
          </View>
        </>
      ) : (
        <Text style={styles.wait}>
          Waiting for desktop — keep Q open on the laptop so BPM/key can push here.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    color: colors.muted,
    fontSize: typeScale.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  badges: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: { color: colors.dim, fontSize: typeScale.caption, fontWeight: "600" },
  pill: {
    backgroundColor: colors.accent,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: "700", marginTop: 8 },
  artist: { color: colors.muted, fontSize: typeScale.body, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 10 },
  bpm: { color: colors.text, fontSize: typeScale.bpm, fontWeight: "800", lineHeight: 36 },
  bpmUnit: { color: colors.muted, fontSize: typeScale.caption, marginBottom: 6 },
  key: {
    color: colors.accent,
    fontSize: typeScale.title,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  wait: { color: colors.muted, marginTop: 10, lineHeight: 20, fontSize: typeScale.body },
});
