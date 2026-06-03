import { StyleSheet, Text, View } from "react-native";
import type { TransitionSuggestion } from "@q/shared";
import { colors, fonts, spacing, type } from "../theme";

type Props = { suggestions: TransitionSuggestion[] };

export default function SuggestionsStrip({ suggestions }: Props) {
  if (suggestions.length === 0) return null;
  const top = suggestions[0]!;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Up next hint</Text>
      <Text style={styles.title}>{top.label}</Text>
      <Text style={styles.detail}>{top.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(192, 132, 252, 0.08)",
    borderRadius: spacing.radius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.purple,
  },
  label: {
    fontFamily: fonts.mono,
    color: colors.purple,
    fontSize: type.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: type.body,
    marginTop: 6,
  },
  detail: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: type.caption,
    marginTop: 4,
  },
});
