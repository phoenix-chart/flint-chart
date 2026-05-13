import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { MicrosoftDisclosures } from '../components/SiteShell';

/**
 * Landing page — replaces the old static docs/landing.html. Lives at `/`.
 */
export function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main
        style={{
          flex: 1,
          maxWidth: 720,
          margin: '0 auto',
          padding: '80px 24px 48px',
        }}
      >
        <h1 style={{ fontSize: 32, margin: '0 0 8px' }}>flint-chart</h1>
        <p style={{ color: '#57606a', fontSize: 17, marginTop: 0 }}>
          Semantic-level visualization library. Compiles data + semantic types
          into chart specs for Vega-Lite, ECharts, Chart.js, and GoFish.
        </p>

        <Card to="/gallery" title="→ Gallery">
          Every chart template across all backends, side-by-side.
        </Card>
        <Card to="/editor" title="→ Live editor">
          Edit a <code>ChartAssemblyInput</code> JSON and watch it render in each
          backend.
        </Card>
        <Card href="https://github.com/microsoft/flint-chart" title="→ Source on GitHub">
          Docs, contributing guide, and changelog.
        </Card>

        <p style={{ marginTop: 48, color: '#57606a', fontSize: 13 }}>
          <code style={codeStyle}>npm install flint-chart</code> · MIT licensed
        </p>
      </main>
      <MicrosoftDisclosures />
    </div>
  );
}

function Card({
  to,
  href,
  title,
  children,
}: {
  to?: string;
  href?: string;
  title: string;
  children: React.ReactNode;
}) {
  const style: CSSProperties = {
    display: 'block',
    padding: '16px 20px',
    margin: '12px 0',
    border: '1px solid #d0d7de',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'inherit',
  };
  const body = (
    <>
      <strong style={{ color: '#0969da', fontSize: 16 }}>{title}</strong>
      <div>{children}</div>
    </>
  );
  if (to) {
    return (
      <Link to={to} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} style={style} target="_blank" rel="noreferrer">
      {body}
    </a>
  );
}

const codeStyle: CSSProperties = {
  background: '#f6f8fa',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 13,
};
