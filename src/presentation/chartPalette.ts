// SVG presentation attributes do not consistently resolve CSS custom properties.
// Keep these values in sync with the matching :root tokens in styles.css.
export const chartPalette = {
  primary: '#6366f1',
  surface: '#ffffff',
  surfaceMuted: '#f4f4f5',
  textPrimary: '#0a0a0a',
  textSecondary: '#6b6b6b',
  textMuted: '#8a8a91',
  border: '#e8e8ec',
  borderStrong: '#d4d4dc',
  up: '#d9284c',
  down: '#3574d4',
  chartTeal: '#1f9aa8',
  chartOrange: '#d66d51',
  chartBlue: '#6d9fbd',
  chartGold: '#c58b24',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  fearExtreme: '#d43d3d',
  fear: '#e27b36',
  neutral: '#d5b33f',
  greed: '#7fb95b',
  greedExtreme: '#2c9a5b',
} as const;

export const movingAveragePalette = [
  chartPalette.chartTeal,
  chartPalette.chartOrange,
  chartPalette.chartBlue,
  chartPalette.chartGold,
] as const;
