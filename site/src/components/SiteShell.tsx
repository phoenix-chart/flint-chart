import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared chrome for non-landing routes: a slim top bar with nav back to
 * landing + cross-links, and the required Microsoft disclosures footer.
 */
export function SiteShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar title={title} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <MicrosoftDisclosures />
    </div>
  );
}

function NavBar({ title }: { title: string }) {
  const linkStyle: CSSProperties = {
    color: '#57606a',
    textDecoration: 'none',
    fontSize: 13,
  };
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 16px',
        background: '#fff',
        borderBottom: '1px solid #e1e4e8',
      }}
    >
      <Link to="/" style={{ ...linkStyle, fontWeight: 600, color: '#1f2328' }}>
        flint-chart
      </Link>
      <span style={{ color: '#d0d7de' }}>·</span>
      <span style={{ fontSize: 13, color: '#1f2328' }}>{title}</span>
      <span style={{ flex: 1 }} />
      <Link to="/gallery" style={linkStyle}>
        Gallery
      </Link>
      <Link to="/editor" style={linkStyle}>
        Editor
      </Link>
      <a
        href="https://github.com/microsoft/flint-chart"
        style={linkStyle}
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
    </header>
  );
}

/**
 * Required Microsoft site disclosures.
 *
 * See https://aka.ms/site-disclosures. "About our ads" is omitted — flint-chart
 * does not display third-party advertising.
 */
export function MicrosoftDisclosures() {
  const linkStyle: CSSProperties = {
    color: '#57606a',
    textDecoration: 'none',
    marginRight: 12,
  };
  return (
    <footer
      style={{
        padding: '6px 12px',
        borderTop: '1px solid #e1e4e8',
        background: '#fff',
        color: '#57606a',
        fontSize: 11,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ marginRight: 12 }}>© 2026 Microsoft</span>
      <a style={linkStyle} href="https://go.microsoft.com/fwlink/?LinkID=206977">
        Terms of Use
      </a>
      <a style={linkStyle} href="https://go.microsoft.com/fwlink/?LinkId=521839">
        Privacy &amp; Cookies
      </a>
      <a style={linkStyle} href="https://go.microsoft.com/fwlink/?linkid=2259814">
        Consumer Health Privacy
      </a>
      <a style={linkStyle} href="https://www.microsoft.com/trademarks">
        Trademarks
      </a>
    </footer>
  );
}
