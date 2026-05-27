import { StyleSheet, Text, View } from "react-native";
import type { TransitionSuggestion } from "@q/shared";
import { colors, type as typeScale } from "../theme";

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
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  label: { color: colors.dim, fontSize: typeScale.caption, textTransform: "uppercase" },
  title: { color: colors.text, fontWeight: "600", fontSize: typeScale.body, marginTop: 4 },
  detail: { color: colors.muted, fontSize: typeScale.caption, marginTop: 2 },
});
