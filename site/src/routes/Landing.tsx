import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteNavBar, MicrosoftDisclosures } from '../components/SiteShell';
import { siteTheme } from '../shared/theme';

/**
 * Landing page — one-line positioning + Gallery / Editor CTAs (Observable-style).
 */
export function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: siteTheme.fontSans,
        color: siteTheme.text,
        background: siteTheme.bg,
      }}
    >
      <SiteNavBar />

      <main
        style={{
          flex: 1,
          maxWidth: 760,
          margin: '0 auto',
          padding: '72px 24px 48px',
          width: '100%',
        }}
      >
        <h1 style={{ fontSize: 36, margin: '0 0 12px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Write less spec. Get clearer charts.
        </h1>
        <p style={{ color: siteTheme.textMuted, fontSize: 18, marginTop: 0, lineHeight: 1.5, maxWidth: 620 }}>
          Flint Chart compiles table data, field semantic types, and a short{' '}
          <code style={codeStyle}>chart_spec</code> into full configs for Vega-Lite, ECharts, and
          Chart.js — without hand-writing encodings, scales, axes, and legends.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link to="/gallery" style={primaryBtn}>
            Browse Gallery
          </Link>
          <Link to="/editor" style={secondaryBtn}>
            Try online
          </Link>
        </div>

        <div style={{ marginTop: 48, display: 'grid', gap: 12 }}>
          <Card to="/gallery" title="Gallery">
            Examples grouped by chart type — bar, line, scatter, facet, and more. Each case opens
            in the live editor with one click.
          </Card>
          <Card to="/editor" title="Live editor">
            Edit a single <code style={codeStyle}>ChartAssemblyInput</code> and see the compiled
            Vega-Lite output side-by-side with multi-engine preview.
          </Card>
        </div>

        <p style={{ marginTop: 40, color: siteTheme.textMuted, fontSize: 13 }}>
          <code style={codeStyle}>npm install flint-chart</code> · MIT licensed
        </p>
      </main>

      <MicrosoftDisclosures />
    </div>
  );
}

function Card({ to, title, children }: { to: string; title: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '16px 20px',
        border: `1px solid ${siteTheme.borderMuted}`,
        borderRadius: siteTheme.radius,
        textDecoration: 'none',
        color: 'inherit',
        background: siteTheme.surface,
      }}
    >
      <strong style={{ color: siteTheme.accent, fontSize: 15 }}>{title}</strong>
      <div style={{ marginTop: 4, fontSize: 14, color: siteTheme.textMuted, lineHeight: 1.5 }}>
        {children}
      </div>
    </Link>
  );
}

const codeStyle: CSSProperties = {
  background: '#eef1f4',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: '0.92em',
  fontFamily: siteTheme.fontMono,
};

const primaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '10px 20px',
  background: siteTheme.accent,
  color: '#fff',
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 14,
};

const secondaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '10px 20px',
  background: siteTheme.surface,
  color: siteTheme.text,
  border: `1px solid ${siteTheme.borderMuted}`,
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14,
};
