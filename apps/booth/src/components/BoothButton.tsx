import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, fonts, spacing, type } from "../theme";

type Variant = "primary" | "ghost" | "danger";

type Props = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export default function BoothButton({
  children,
  onPress,
  disabled,
  busy,
  variant = "primary",
  style,
}: Props) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      style={[
        styles.base,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        (disabled || busy) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || busy}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? colors.primaryText : colors.text} />
      ) : typeof children === "string" ? (
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            variant === "ghost" && styles.labelGhost,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.pad,
    borderRadius: spacing.radius,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: type.caption,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  labelPrimary: { color: colors.primaryText },
  labelGhost: { color: colors.text },
});
