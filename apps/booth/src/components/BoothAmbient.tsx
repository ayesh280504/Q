import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

/** Soft gradient blobs — matches web auth / marketing glass pages. */
export default function BoothAmbient() {
  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.blob, styles.pink]} />
      <View style={[styles.blob, styles.purple]} />
      <View style={[styles.blob, styles.cyan]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  pink: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: colors.pink,
  },
  purple: {
    width: 220,
    height: 220,
    bottom: "28%",
    left: -70,
    backgroundColor: colors.purple,
    opacity: 0.28,
  },
  cyan: {
    width: 180,
    height: 180,
    bottom: -40,
    right: 20,
    backgroundColor: colors.cyan,
    opacity: 0.22,
  },
});
