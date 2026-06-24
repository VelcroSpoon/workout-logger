// ─── Design tokens ─────────────────────────────────────────────
// One source of truth for the app's look, lifted from the "rise"
// mockup: near-black greens, a single lime accent, generous radii.
// Every screen should pull from here instead of hardcoding values,
// so a palette change is a one-file edit.

export const Colors = {
  bg: '#0C0E0C', // app background — near-black, faint green tint
  surface: '#161A16', // cards / raised panels
  surfaceAlt: '#1E241E', // inputs, pills, pressed states
  border: '#2A312A', // hairlines, input borders

  accent: '#C5F84A', // the lime — CTAs, highlights, "done"
  accentText: '#0C0E0C', // text/icon sitting ON the accent (dark)

  text: '#F4F6F4', // primary text
  textMuted: '#8B928B', // secondary text, labels
  textFaint: '#5A615A', // placeholders, disabled

  danger: '#FF6B6B', // destructive actions on dark
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
