import type { LibrarySource } from "@q/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LIBRARY_PROFILES } from "../lib/libraryProfile";
import { colors, fonts, spacing, type } from "../theme";

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
  heading: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: type.body,
  },
  sub: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 4,
    marginBottom: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  optionActive: {
    borderColor: colors.pink,
    backgroundColor: "rgba(244, 114, 182, 0.1)",
  },
  optionTitle: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: type.body,
  },
  optionTitleActive: { color: colors.pink },
  optionSummary: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 4,
    lineHeight: 18,
  },
});
