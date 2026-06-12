import type { CSSProperties, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GITHUB_REPO, siteTheme } from '../shared/theme';

/**
 * Shared chrome: Vega-Lite-style top nav + page body + Microsoft disclosures.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: siteTheme.fontSans,
        color: siteTheme.text,
        background: siteTheme.bg,
      }}
    >
      <SiteNavBar />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <MicrosoftDisclosures />
    </div>
  );
}

export function SiteNavBar() {
  const { pathname } = useLocation();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 20px',
        height: 48,
        background: siteTheme.surface,
        borderBottom: `1px solid ${siteTheme.border}`,
        flexShrink: 0,
      }}
    >
      <Link to="/" style={brandStyle}>
        flint-chart
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <NavLink to="/gallery" active={pathname.startsWith('/gallery')}>
          Gallery
        </NavLink>
        <NavLink to="/wall" active={pathname.startsWith('/wall')}>
          Wall
        </NavLink>
        <NavLink to="/tutorials/quick-start" active={pathname.startsWith('/tutorials')}>
          Tutorials
        </NavLink>
        <NavLink to="/documentation/overview" active={pathname.startsWith('/documentation')}>
          Documentation
        </NavLink>
        {/* <NavLink to="/tutorials/quick-start" active={pathname === '/tutorials/quick-start'}>
          Usage
        </NavLink>
        <NavLinkExternal href={`${GITHUB_REPO}#ecosystem`} label="Ecosystem" /> */}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={GITHUB_REPO} style={navLinkStyle} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <Link
          to="/editor"
          style={{
            ...navLinkStyle,
            padding: '4px 12px',
            background: siteTheme.accent,
            color: '#fff',
            borderRadius: siteTheme.radius,
            fontWeight: 500,
          }}
        >
          Try online
        </Link>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        ...navLinkStyle,
        color: active ? siteTheme.accent : siteTheme.textMuted,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </Link>
  );
}

function NavLinkExternal({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={navLinkStyle} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

const brandStyle: CSSProperties = {
  color: siteTheme.text,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: '-0.01em',
};

const navLinkStyle: CSSProperties = {
  color: siteTheme.textMuted,
  textDecoration: 'none',
  fontSize: 13,
};

/**
 * Required Microsoft site disclosures.
 *
 * See https://aka.ms/site-disclosures. "About our ads" is omitted — flint-chart
 * does not display third-party advertising.
 */
export function MicrosoftDisclosures() {
  const linkStyle: CSSProperties = {
    color: siteTheme.textMuted,
    textDecoration: 'none',
    marginRight: 12,
  };
  return (
    <footer
      style={{
        padding: '6px 12px',
        borderTop: `1px solid ${siteTheme.border}`,
        background: siteTheme.surface,
        color: siteTheme.textMuted,
        fontSize: 11,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
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
