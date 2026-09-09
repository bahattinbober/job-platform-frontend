// Mirrors the CSS custom properties in globals.css. Three.js materials need
// hex numbers, not `var(--x)`, so these are kept in sync by hand — this file
// is the second place to update if the palette in globals.css changes.
export const THEME = {
  paper: 0xe9eae4,
  surface: 0xf6f6f2,
  edge: 0xd3d5cd,
  ink: 0x17181a,
  muted: 0x6e7169,
  signal: 0x1f5c4c,
} as const;
