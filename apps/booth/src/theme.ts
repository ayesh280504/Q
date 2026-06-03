import { boothTokens, boothSpacing, boothTypeScale } from "@q/theme/tokens";

/** Re-export shared tokens — same palette as web + desktop. */
export const colors = {
  bg: boothTokens.bg,
  surface: boothTokens.surfaceRaised,
  surfaceRaised: boothTokens.surfaceRaised,
  surfaceGlass: "rgba(8, 8, 14, 0.92)",
  border: boothTokens.borderStrong,
  text: boothTokens.text,
  muted: boothTokens.muted,
  dim: boothTokens.dim,
  pink: boothTokens.pink,
  cyan: boothTokens.cyan,
  purple: boothTokens.purple,
  accent: boothTokens.pink,
  primary: boothTokens.primary,
  primaryText: boothTokens.primaryText,
  accept: boothTokens.accept,
  acceptDim: boothTokens.acceptDim,
  decline: boothTokens.decline,
  declineDim: boothTokens.declineDim,
  warn: boothTokens.warn,
};

export const spacing = boothSpacing;
export const type = boothTypeScale;

/** Set after useBoothFonts() loads @expo-google-fonts. */
export const fonts = {
  displayBlack: "Inter_900Black",
  displayBold: "Inter_800ExtraBold",
  display: "Inter_700Bold",
  body: "Inter_400Regular",
  mono: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export function kickerStyle() {
  return {
    fontFamily: fonts.mono,
    fontSize: type.mono,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.pink,
  };
}

export function headlinePrimaryStyle() {
  return {
    fontFamily: fonts.displayBlack,
    fontSize: type.hero,
    letterSpacing: -0.5,
    color: colors.text,
  };
}

export function headlineGradientStyle() {
  return {
    fontFamily: fonts.displayBlack,
    fontSize: type.hero,
    letterSpacing: -0.5,
    color: colors.pink,
    fontStyle: "italic" as const,
  };
}
