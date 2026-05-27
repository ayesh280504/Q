import type { DjProfile, LibrarySource } from "@q/shared";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import LibraryProfilePicker from "../components/LibraryProfilePicker";
import { crowdProfileUrl } from "../api";
import { colors, type as typeScale } from "../theme";

type Props = {
  profile: DjProfile;
  librarySource: LibrarySource | null;
  error: string | null;
  busy: boolean;
  onLibrarySource: (s: LibrarySource) => void;
  onStart: () => void;
  onSignOut: () => void;
};

export default function StartGigScreen({
  profile,
  librarySource,
  error,
  busy,
  onLibrarySource,
  onStart,
  onSignOut,
}: Props) {
  const permanentUrl = crowdProfileUrl(profile.handle);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <Text style={styles.brand}>@{profile.handle}</Text>
      <Text style={styles.sub}>Start tonight&apos;s gig — unlocks your permanent QR.</Text>
      <View style={styles.qrCard}>
        <Text style={styles.qrLabel}>Print-once link</Text>
        <Text style={styles.qrUrl} selectable>
          {permanentUrl}
        </Text>
      </View>
      <LibraryProfilePicker value={librarySource} onChange={onLibrarySource} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.btnPrimary, !librarySource && styles.btnDisabled]}
        onPress={onStart}
        disabled={busy || !librarySource}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Start gig</Text>
        )}
      </Pressable>
      <Pressable style={styles.btnGhost} onPress={onSignOut}>
        <Text style={styles.btnGhostText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  brand: { fontSize: typeScale.hero, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 22 },
  qrCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrLabel: { color: colors.dim, fontSize: typeScale.caption, textTransform: "uppercase" },
  qrUrl: { color: colors.accent, marginTop: 6, fontSize: typeScale.caption },
  btnPrimary: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: typeScale.body },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnGhostText: { color: colors.muted },
  error: { color: "#fca5a5", marginBottom: 8 },
});
