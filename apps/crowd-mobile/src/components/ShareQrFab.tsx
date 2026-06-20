import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { crowdRequestUrl } from "../ble/nearbyScan";
import { colors, fonts } from "../theme";

type Props = {
  sessionCode: string;
  displayName?: string;
};

/** Floating QR — connected guest shows DJ booth link for a friend to scan. */
export default function ShareQrFab({ sessionCode, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const url = crowdRequestUrl(sessionCode);
  const label = displayName?.trim() || "this booth";

  async function shareLink() {
    try {
      await Share.share({
        message: `Request a track at ${label}'s set — ${url}`,
        url,
        title: `${label} — Q booth`,
      });
    } catch {
      /* user dismissed */
    }
  }

  return (
    <>
      <Pressable
        style={styles.fab}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Show QR code for a friend to scan"
      >
        <MaterialCommunityIcons name="qrcode" size={22} color="#000" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.kicker}>// Spread the gig</Text>
            <Text style={styles.title}>Friend can scan this</Text>
            <Text style={styles.sub}>
              Same booth you&apos;re on — no trip to the DJ laptop. They can request in the browser or get the app.
            </Text>

            <View style={styles.qrCard}>
              <QRCode value={url} size={200} backgroundColor="#ffffff" color="#0a0a0f" />
              <Text style={styles.code}>{sessionCode}</Text>
            </View>

            <Pressable style={styles.shareBtn} onPress={() => void shareLink()}>
              <Text style={styles.shareBtnText}>Share link</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  kicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.pink,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: "#fff",
    marginBottom: 8,
  },
  sub: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 24,
  },
  qrCard: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  code: {
    marginTop: 12,
    fontFamily: fonts.monoBold,
    fontSize: 18,
    letterSpacing: 4,
    color: "#0a0a0f",
  },
  shareBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  shareBtnText: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: "#000",
    textTransform: "uppercase",
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: "uppercase",
  },
});
