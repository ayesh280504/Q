import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";

const source = require("../../assets/q-logo.png");

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function QLogo({ size = 40, style }: Props) {
  return (
    <Image
      source={source}
      style={[styles.logo, { width: size, height: size }, style]}
      accessibilityLabel="Q"
    />
  );
}

const styles = StyleSheet.create({
  logo: { resizeMode: "contain" },
});
