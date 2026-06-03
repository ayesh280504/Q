import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "../theme";

type Props = {
  label: string;
  tone?: "cyan" | "purple" | "warn";
};

const toneStyles = {
  cyan: {
    wrap: {
      backgroundColor: "rgba(34, 211, 238, 0.12)",
      borderColor: "rgba(34, 211, 238, 0.35)",
    },
    text: { color: colors.cyan },
  },
  purple: {
    wrap: {
      backgroundColor: "rgba(192, 132, 252, 0.12)",
      borderColor: "rgba(192, 132, 252, 0.35)",
    },
    text: { color: colors.purple },
  },
  warn: {
    wrap: {
      backgroundColor: "rgba(251, 191, 36, 0.12)",
      borderColor: "rgba(251, 191, 36, 0.35)",
    },
    text: { color: colors.warn },
  },
} as const;

export default function TrackPill({ label, tone = "cyan" }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.pill, t.wrap]}>
      <Text style={[styles.text, t.text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.monoBold,
    fontSize: type.caption,
    fontWeight: "700",
  },
});
