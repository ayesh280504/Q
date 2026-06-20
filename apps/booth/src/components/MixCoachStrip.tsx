import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { MixSuggestionHit, SessionLiveStatus } from "@q/shared";
import { fetchMixSuggestions } from "../api";
import { colors, fonts, spacing, type } from "../theme";

type Props = {
  sessionId: string;
  djToken: string;
  live: SessionLiveStatus | null;
};

export default function MixCoachStrip({ sessionId, djToken, live }: Props) {
  const [hits, setHits] = useState<MixSuggestionHit[]>([]);

  useEffect(() => {
    if (!live) {
      setHits([]);
      return;
    }
    let cancelled = false;
    void fetchMixSuggestions(sessionId, djToken, {
      fromLive: true,
      title: live.title,
      artist: live.artist,
      bpm: live.bpm,
      key: live.key,
      limit: 3,
    })
      .then((data) => {
        if (!cancelled) setHits(data.suggestions);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, djToken, live?.title, live?.artist, live?.bpm, live?.key]);

  if (!live || hits.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Mix coach</Text>
      <Text style={styles.sub}>Harmonic picks from your synced library (drag on desktop)</Text>
      {hits.slice(0, 3).map((h) => (
        <View key={h.id} style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {h.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {h.matchLabel} · {h.score}
            {h.bpm ? ` · ${h.bpm} BPM` : ""}
            {h.key ? ` · ${h.key}` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(34, 211, 238, 0.06)",
    borderRadius: spacing.radius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.cyan,
  },
  label: {
    fontFamily: fonts.mono,
    color: colors.cyan,
    fontSize: type.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sub: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    marginTop: 6,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: type.body,
  },
  meta: {
    fontFamily: fonts.mono,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 2,
  },
});
