import type { CSSProperties } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { resolveMarkdownHref } from '../shared/load-docs';
import { siteTheme } from '../shared/theme';

export function MarkdownView({ source }: { source: string }) {
  const components: Components = {
    a: ({ href, children }) => {
      const internal = href ? resolveMarkdownHref(href) : null;
      if (internal) {
        const [to, hash] = internal.split('#');
        return (
          <Link to={hash ? `${to}#${hash}` : to} style={linkStyle}>
            {children}
          </Link>
        );
      }
      const external = href?.startsWith('http') || href?.startsWith('//');
      return (
        <a
          href={href}
          style={linkStyle}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {children}
        </a>
      );
    },
    h1: ({ children }) => <h1 style={h1Style}>{children}</h1>,
    h2: ({ children }) => <h2 style={h2Style}>{children}</h2>,
    h3: ({ children }) => <h3 style={h3Style}>{children}</h3>,
    p: ({ children }) => <p style={pStyle}>{children}</p>,
    ul: ({ children }) => <ul style={ulStyle}>{children}</ul>,
    ol: ({ children }) => <ol style={olStyle}>{children}</ol>,
    li: ({ children }) => <li style={liStyle}>{children}</li>,
    blockquote: ({ children }) => <blockquote style={quoteStyle}>{children}</blockquote>,
    hr: () => <hr style={hrStyle} />,
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '16px 0' }}>
        <table style={tableStyle}>{children}</table>
      </div>
    ),
    th: ({ children }) => <th style={thStyle}>{children}</th>,
    td: ({ children }) => <td style={tdStyle}>{children}</td>,
    code: ({ className, children }) => {
      const isBlock = className?.startsWith('language-');
      if (isBlock) {
        return (
          <pre style={preStyle}>
            <code style={codeBlockStyle}>{children}</code>
          </pre>
        );
      }
      return <code style={inlineCodeStyle}>{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
  };

  return (
    <article style={articleStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </article>
  );
}

const articleStyle: CSSProperties = {
  maxWidth: 820,
  lineHeight: 1.65,
  fontSize: 15,
  color: siteTheme.text,
};

const linkStyle: CSSProperties = { color: siteTheme.accent, textDecoration: 'none' };
const h1Style: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
};
const h2Style: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  margin: '32px 0 12px',
  paddingBottom: 6,
  borderBottom: `1px solid ${siteTheme.border}`,
};
const h3Style: CSSProperties = { fontSize: 16, fontWeight: 600, margin: '24px 0 8px' };
const pStyle: CSSProperties = { margin: '0 0 12px' };
const ulStyle: CSSProperties = { margin: '0 0 12px', paddingLeft: 24 };
const olStyle: CSSProperties = { margin: '0 0 12px', paddingLeft: 24 };
const liStyle: CSSProperties = { marginBottom: 4 };
const quoteStyle: CSSProperties = {
  margin: '12px 0',
  padding: '8px 16px',
  borderLeft: `3px solid ${siteTheme.borderMuted}`,
  color: siteTheme.textMuted,
};
const hrStyle: CSSProperties = {
  border: 0,
  borderTop: `1px solid ${siteTheme.border}`,
  margin: '24px 0',
};
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};
const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: `1px solid ${siteTheme.borderMuted}`,
};
const tdStyle: CSSProperties = {
  padding: '8px 10px',
  borderBottom: `1px solid ${siteTheme.border}`,
  verticalAlign: 'top',
};
const preStyle: CSSProperties = {
  margin: '12px 0',
  padding: 14,
  background: '#0d1117',
  color: '#e6edf3',
  borderRadius: siteTheme.radius,
  overflow: 'auto',
  fontSize: 13,
  lineHeight: 1.5,
};
const codeBlockStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  whiteSpace: 'pre',
};
const inlineCodeStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  fontSize: '0.9em',
  background: siteTheme.hover,
  padding: '2px 5px',
  borderRadius: 4,
};
