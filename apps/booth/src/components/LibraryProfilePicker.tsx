import type { LibrarySource } from "@q/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LIBRARY_PROFILES } from "../lib/libraryProfile";
import { colors, type as typeScale } from "../theme";

type Props = {
  value: LibrarySource | null;
  onChange: (source: LibrarySource) => void;
};

export default function LibraryProfilePicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Tonight&apos;s library</Text>
      <Text style={styles.sub}>Controls what guests can search on the crowd page.</Text>
      {LIBRARY_PROFILES.map((p) => {
        const active = value === p.id;
        return (
          <Pressable
            key={p.id}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onChange(p.id)}
          >
            <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{p.title}</Text>
            <Text style={styles.optionSummary}>{p.summary}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12 },
  heading: { color: colors.text, fontSize: typeScale.body, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: typeScale.caption, marginTop: 4, marginBottom: 10 },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(124, 92, 255, 0.12)",
  },
  optionTitle: { color: colors.text, fontWeight: "600", fontSize: typeScale.body },
  optionTitleActive: { color: colors.accent },
  optionSummary: { color: colors.muted, fontSize: typeScale.caption, marginTop: 4, lineHeight: 18 },
});
