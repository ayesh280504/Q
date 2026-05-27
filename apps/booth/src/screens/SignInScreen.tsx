import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, type as typeScale } from "../theme";

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
      <StatusBar style="light" />
      <Text style={styles.brand}>Q Booth</Text>
      <Text style={styles.sub}>Glanceable accept / decline at the mixer.</Text>
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
      <Pressable style={styles.btnPrimary} onPress={onSubmit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Sign in</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        Same account as q-web. Keep Q desktop running on the laptop for now playing BPM/key.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: "center" },
  brand: { fontSize: typeScale.hero, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 24, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    marginBottom: 10,
    fontSize: typeScale.body,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  error: { color: "#fca5a5", marginBottom: 8 },
  hint: { color: colors.dim, fontSize: typeScale.caption, marginTop: 20, lineHeight: 20 },
});
