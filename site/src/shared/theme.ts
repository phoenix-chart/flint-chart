/**
 * Shared design tokens — flat "paper" style (à la data-formulator): white
 * surfaces, neutral low-opacity hairlines, no shadows, depth via subtle fills.
 */
export const siteTheme = {
  bg: '#f7f7f8',
  surface: '#ffffff',
  border: 'rgba(0, 0, 0, 0.10)',
  borderMuted: 'rgba(0, 0, 0, 0.16)',
  text: '#1f2328',
  textMuted: '#57606a',
  accent: '#0078d4',
  accentBg: 'rgba(0, 120, 212, 0.08)',
  hover: 'rgba(0, 0, 0, 0.04)',
  grid: 'rgba(0, 0, 0, 0.02)',
  error: '#cf222e',
  radius: 6,
  fontSans: "'Segoe UI', -apple-system, sans-serif",
  fontMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

export const GITHUB_REPO = 'https://github.com/microsoft/flint-chart';
