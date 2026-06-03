import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, kickerStyle, type } from "../theme";

type Props = {
  children: string;
};

export default function BoothKicker({ children }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pink,
  },
  text: {
    ...kickerStyle(),
    fontFamily: fonts.mono,
    marginBottom: 0,
  },
});
