import type { DjProfile, LibrarySource } from "@q/shared";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BoothAmbient from "../components/BoothAmbient";
import BoothButton from "../components/BoothButton";
import BoothKicker from "../components/BoothKicker";
import LibraryProfilePicker from "../components/LibraryProfilePicker";
import QLogo from "../components/QLogo";
import { crowdProfileUrl } from "../api";
import { colors, fonts, spacing, type } from "../theme";

type Props = {
  profile: DjProfile;
  librarySource: LibrarySource | null;
  desktopHost: string;
  desktopToken: string;
  onDesktopHost: (v: string) => void;
  onDesktopToken: (v: string) => void;
  error: string | null;
  busy: boolean;
  onLibrarySource: (s: LibrarySource) => void;
  onStart: () => void;
  onSignOut: () => void;
};

export default function StartGigScreen({
  profile,
  librarySource,
  desktopHost,
  desktopToken,
  onDesktopHost,
  onDesktopToken,
  error,
  busy,
  onLibrarySource,
  onStart,
  onSignOut,
}: Props) {
  const permanentUrl = crowdProfileUrl(profile.handle);

  return (
    <View style={styles.root}>
      <BoothAmbient />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <QLogo size={36} />
            <Text style={styles.handle}>@{profile.handle}</Text>
          </View>
          <BoothKicker>{`// Tonight's gig`}</BoothKicker>
          <Text style={styles.headlinePrimary}>Start the</Text>
          <Text style={styles.headlineAccent}>set.</Text>
          <Text style={styles.sub}>
            Link your laptop once (same Wi‑Fi or hotspot). Start here — the booth app on your Mac
            picks it up, even without venue internet.
          </Text>
          <View style={styles.linkCard}>
            <Text style={styles.qrLabel}>Laptop link</Text>
            <TextInput
              style={styles.input}
              value={desktopHost}
              onChangeText={onDesktopHost}
              placeholder="Laptop IP (from desktop Settings)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={desktopToken}
              onChangeText={onDesktopToken}
              placeholder="Token (from desktop Settings)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <View style={styles.qrCard}>
            <Text style={styles.qrLabel}>Permanent crowd link</Text>
            <Text style={styles.qrUrl} selectable>
              {permanentUrl}
            </Text>
          </View>
          <LibraryProfilePicker value={librarySource} onChange={onLibrarySource} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <BoothButton
            onPress={onStart}
            disabled={busy || !librarySource}
            busy={busy}
            style={styles.startBtn}
          >
            Start gig →
          </BoothButton>
          <BoothButton variant="ghost" onPress={onSignOut}>
            Sign out
          </BoothButton>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  content: { padding: spacing.pad, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  handle: {
    fontFamily: fonts.monoBold,
    fontSize: type.body,
    color: colors.pink,
    letterSpacing: 0.5,
  },
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
    marginBottom: 10,
  },
  sub: {
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 22,
  },
  qrCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: spacing.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  linkCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: spacing.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: type.caption,
  },
  qrLabel: {
    fontFamily: fonts.mono,
    fontSize: type.mono,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.purple,
  },
  qrUrl: {
    color: colors.cyan,
    marginTop: 8,
    fontSize: type.caption,
    fontFamily: fonts.mono,
    lineHeight: 18,
  },
  startBtn: { marginTop: 8 },
  error: { color: "#fca5a5", marginBottom: 8, fontFamily: fonts.body },
});
