import { StyleSheet, Text, View } from "react-native";
import type { SessionLiveStatus } from "@q/shared";
import TrackPill from "./TrackPill";
import { colors, fonts, spacing, type } from "../theme";

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
              <>
                <Text style={styles.bpm}>{Math.round(live.bpm)}</Text>
                <Text style={styles.bpmUnit}>BPM</Text>
              </>
            )}
            {live.key ? <TrackPill label={live.key} tone="purple" /> : null}
          </View>
        </>
      ) : (
        <Text style={styles.wait}>
          Waiting for laptop — keep Q desktop open so BPM/key sync over your local network.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: spacing.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    fontFamily: fonts.mono,
    color: colors.pink,
    fontSize: type.mono,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  badges: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: {
    fontFamily: fonts.monoBold,
    color: colors.muted,
    fontSize: type.mono,
    letterSpacing: 1,
  },
  pill: {
    backgroundColor: colors.pink,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pillText: {
    color: colors.primaryText,
    fontSize: 11,
    fontFamily: fonts.monoBold,
    fontWeight: "800",
  },
  title: {
    fontFamily: fonts.displayBold,
    color: colors.text,
    fontSize: type.title,
    marginTop: 10,
  },
  artist: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.body,
    marginTop: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 12 },
  bpm: {
    fontFamily: fonts.displayBlack,
    color: colors.text,
    fontSize: type.bpm,
    lineHeight: 40,
  },
  bpmUnit: {
    fontFamily: fonts.mono,
    color: colors.muted,
    fontSize: type.mono,
    marginBottom: 8,
    letterSpacing: 1,
  },
  wait: {
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 12,
    lineHeight: 20,
    fontSize: type.body,
  },
});
