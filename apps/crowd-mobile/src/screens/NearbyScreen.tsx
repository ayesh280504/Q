import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NearbyBoothHit } from "@q/shared";
import { startNearbyScan } from "../ble/nearbyScan";
import { colors, fonts } from "../theme";

type Props = {
  onJoin: (code: string) => void;
  onBack: () => void;
};

export default function NearbyScreen({ onJoin, onBack }: Props) {
  const [scanning, setScanning] = useState(false);
  const [hits, setHits] = useState<NearbyBoothHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => handleRef.current?.stop();
  }, []);

  async function startScan() {
    setError(null);
    setHits([]);
    handleRef.current?.stop();
    setScanning(true);
    try {
      handleRef.current = await startNearbyScan((hit) => {
        setHits((prev) => {
          if (prev.some((h) => h.code === hit.code)) return prev;
          return [...prev, hit].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
        });
      });
    } catch (e) {
      setScanning(false);
      setError(e instanceof Error ? e.message : "Bluetooth scan failed");
    }
  }

  function stopScan() {
    handleRef.current?.stop();
    handleRef.current = null;
    setScanning(false);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>// Proximity</Text>
      <Text style={styles.title}>Booths nearby</Text>
      <Text style={styles.sub}>
        Stand near the DJ. Q listens for Bluetooth beacons from the desktop app while a gig is live.
      </Text>

      <Pressable
        style={[styles.btn, scanning && styles.btnGhost]}
        onPress={() => (scanning ? stopScan() : void startScan())}
      >
        <Text style={scanning ? styles.btnTextGhost : styles.btnText}>
          {scanning ? "Stop scanning" : "Scan for booths"}
        </Text>
      </Pressable>

      {scanning ? (
        <View style={styles.scanRow}>
          <ActivityIndicator color={colors.cyan} />
          <Text style={styles.scanText}>Listening…</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={hits}
        keyExtractor={(item) => item.code}
        style={styles.list}
        ListEmptyComponent={
          scanning ? (
            <Text style={styles.empty}>No booths yet — move closer to the laptop.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.hit} onPress={() => onJoin(item.code)}>
            <Text style={styles.hitCode}>{item.code}</Text>
            <Text style={styles.hitName}>{item.localName ?? `Q booth · ${item.code}`}</Text>
            {item.rssi != null ? <Text style={styles.hitRssi}>{item.rssi} dBm</Text> : null}
          </Pressable>
        )}
      />

      <Pressable onPress={onBack}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 56 },
  kicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.pink,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: "#fff", marginBottom: 8 },
  sub: { fontFamily: fonts.display, fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 20 },
  btn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  btnText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, color: "#000", textTransform: "uppercase" },
  btnTextGhost: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" },
  scanRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  scanText: { fontFamily: fonts.mono, fontSize: 12, color: colors.cyan },
  error: { color: "#fca5a5", marginBottom: 12, fontSize: 14 },
  list: { flex: 1, marginTop: 8 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24, fontSize: 14 },
  hit: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    backgroundColor: "rgba(8,8,14,0.9)",
  },
  hitCode: { fontFamily: fonts.monoBold, fontSize: 16, color: colors.pink, letterSpacing: 2 },
  hitName: { fontFamily: fonts.display, fontSize: 14, color: "#e4e4e7", marginTop: 4 },
  hitRssi: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 4 },
  back: { fontFamily: fonts.mono, fontSize: 12, color: colors.cyan, textAlign: "center", marginTop: 16 },
});
