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
  accentTint: 'rgba(197, 248, 74, 0.13)', // #C5F84A at 13% — pill/badge fills
  accentDim: '#7F9E3C', // lime mixed ~55% with border — partial progress bars

  text: '#F4F6F4', // primary text
  textMuted: '#8B928B', // secondary text, labels
  textFaint: '#5A625A', // placeholders, disabled, inactive nav
  checkEmpty: '#39413A', // glyph color for an unchecked set

  danger: '#FF6B6B', // destructive actions on dark
} as const;

// Theme knobs the spec wants swappable from one place.
export const Theme = {
  cardTexture: true, // subtle diagonal texture on dark surfaces
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

// Font families. The string values are the names the font packages
// register under (see _layout.tsx where they're loaded). Reference
// these via `fontFamily` in styles instead of hardcoding the names.
//   - Space Grotesk → headlines and numbers (timers, counts)
//   - Hanken Grotesk → UI text and body
export const Fonts = {
  heading: 'SpaceGrotesk_600SemiBold', // headlines, big labels
  headingBold: 'SpaceGrotesk_700Bold', // heaviest titles, key numbers
  number: 'SpaceGrotesk_600SemiBold', // timers / counts (use with tabular-nums)
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemibold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;
