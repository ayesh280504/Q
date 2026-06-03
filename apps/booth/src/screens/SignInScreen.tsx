import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BoothAmbient from "../components/BoothAmbient";
import BoothButton from "../components/BoothButton";
import BoothKicker from "../components/BoothKicker";
import QLogo from "../components/QLogo";
import { colors, fonts, spacing, type } from "../theme";

type Props = {
  email: string;
  password: string;
  error: string | null;
  busy: boolean;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
};

export default function SignInScreen({
  email,
  password,
  error,
  busy,
  onEmail,
  onPassword,
  onSubmit,
}: Props) {
  return (
    <View style={styles.root}>
      <BoothAmbient />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <QLogo size={44} />
        </View>
        <BoothKicker>// Booth mobile · sync</BoothKicker>
        <Text style={styles.headlinePrimary}>Run the</Text>
        <Text style={styles.headlineAccent}>booth.</Text>
        <Text style={styles.sub}>
          Glanceable accept / decline at the mixer. Works with Q on your laptop — no venue Wi‑Fi
          required for decisions.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.dim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={onEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.dim}
          secureTextEntry
          value={password}
          onChangeText={onPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <BoothButton onPress={onSubmit} disabled={busy} busy={busy}>
          Sign in →
        </BoothButton>
        <Text style={styles.hint}>
          Same account as q-web. Keep Q desktop open on the laptop so now playing BPM/key push
          here over LAN.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, padding: spacing.pad, justifyContent: "center" },
  header: { marginBottom: 20 },
  headlinePrimary: {
    fontFamily: fonts.displayBlack,
    fontSize: type.hero,
    color: colors.text,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    fontFamily: fonts.displayBlack,
    fontSize: type.hero,
    color: colors.pink,
    fontStyle: "italic",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: {
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 22,
    fontSize: type.body,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    padding: 14,
    color: colors.text,
    marginBottom: 10,
    fontSize: type.body,
    fontFamily: fonts.body,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  error: { color: "#fca5a5", marginBottom: 8, fontFamily: fonts.body },
  hint: {
    color: colors.dim,
    fontSize: type.caption,
    marginTop: 20,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
});
