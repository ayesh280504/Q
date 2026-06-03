/**
 * Shared Q booth brand tokens (web CSS, desktop CSS, React Native).
 * Keep in sync with booth-theme.css :root and marketing-home.css.
 */
export const boothTokens = {
  pink: "#f472b6",
  cyan: "#22d3ee",
  purple: "#c084fc",
  bg: "#000000",
  bgElevated: "#0a0a10",
  panel: "rgba(8, 8, 14, 0.78)",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceRaised: "#14141c",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  text: "#f4f4f5",
  muted: "rgba(255, 255, 255, 0.45)",
  dim: "#6b7280",
  primary: "#f4f4f5",
  primaryText: "#000000",
  accept: "#22c55e",
  acceptDim: "rgba(34, 197, 94, 0.12)",
  decline: "#ef4444",
  declineDim: "rgba(239, 68, 68, 0.12)",
  warn: "#fcd34d",
} as const;

export const boothSpacing = {
  pad: 20,
  padSm: 16,
  radius: 8,
  radiusLg: 12,
} as const;

export const boothTypeScale = {
  hero: 28,
  title: 22,
  body: 16,
  caption: 12,
  bpm: 36,
  mono: 11,
} as const;
