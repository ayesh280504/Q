import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../theme";

type Props = {
  code: string;
  onCode: (code: string) => void;
  onNearby: () => void;
  onJoin: () => void;
};

export default function HomeScreen({ code, onCode, onNearby, onJoin }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>// Crowd</Text>
      <Text style={styles.title}>
        Request a <Text style={styles.accent}>track.</Text>
      </Text>
      <Text style={styles.sub}>
        Find a booth nearby over Bluetooth, or enter the code from the DJ&apos;s sticker.
      </Text>

      <Pressable style={styles.primary} onPress={onNearby}>
        <Text style={styles.primaryText}>Find booth nearby</Text>
      </Pressable>

      <Text style={styles.or}>or enter code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(t) => onCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
        placeholder="ABC123"
        placeholderTextColor="rgba(255,255,255,0.35)"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />
      <Pressable style={[styles.secondary, code.length < 6 && styles.disabled]} onPress={onJoin} disabled={code.length < 6}>
        <Text style={styles.secondaryText}>Join booth</Text>
      </Pressable>

      <Text style={styles.hint}>No account needed during the set. Uses your phone data, not venue Wi‑Fi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72, justifyContent: "center" },
  kicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.pink,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 36, color: "#fff", lineHeight: 40, marginBottom: 12 },
  accent: { color: colors.cyan },
  sub: { fontFamily: fonts.display, fontSize: 16, color: colors.muted, lineHeight: 24, marginBottom: 28 },
  primary: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  primaryText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, color: "#000", textTransform: "uppercase" },
  or: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 16,
    fontFamily: fonts.monoBold,
    fontSize: 22,
    letterSpacing: 6,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  secondary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  disabled: { opacity: 0.4 },
  secondaryText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" },
  hint: { fontFamily: fonts.display, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 20, textAlign: "center" },
});
