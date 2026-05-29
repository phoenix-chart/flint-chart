import { Link, Navigate, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import { SiteShell } from '../components/SiteShell';
import type { DocSection } from '../shared/docs-catalog';
import { getDocEntry, getDocsForSection, sectionTitle } from '../shared/docs-catalog';
import { getDocMarkdown } from '../shared/load-docs';
import { siteTheme } from '../shared/theme';

export function DocSectionPage({ section }: { section: DocSection }) {
  const { slug } = useParams<{ slug?: string }>();
  const docs = getDocsForSection(section);
  const activeSlug = slug ?? docs[0]?.slug;
  const entry = activeSlug ? getDocEntry(section, activeSlug) : undefined;

  if (!slug && docs[0]) {
    return <Navigate to={`/${section}/${docs[0].slug}`} replace />;
  }

  const markdown = entry ? getDocMarkdown(entry) : null;

  return (
    <SiteShell>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <aside
          style={{
            borderRight: `1px solid ${siteTheme.border}`,
            overflowY: 'auto',
            background: siteTheme.surface,
            padding: '16px 0',
          }}
        >
          <div style={{ padding: '0 16px 12px' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: siteTheme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {sectionTitle(section)}
            </div>
          </div>
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              to={`/${section}/${doc.slug}`}
              style={{
                display: 'block',
                padding: '8px 16px',
                textDecoration: 'none',
                fontSize: 13,
                color: doc.slug === activeSlug ? siteTheme.accent : siteTheme.text,
                background: doc.slug === activeSlug ? siteTheme.accentBg : 'transparent',
                fontWeight: doc.slug === activeSlug ? 600 : 400,
                borderLeft:
                  doc.slug === activeSlug
                    ? `3px solid ${siteTheme.accent}`
                    : '3px solid transparent',
              }}
            >
              <div>{doc.title}</div>
              <div style={{ fontSize: 11, color: siteTheme.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                {doc.description}
              </div>
            </Link>
          ))}
        </aside>

        <main style={{ overflowY: 'auto', padding: '24px 32px 48px' }}>
          {!entry || !markdown ? (
            <p style={{ color: siteTheme.textMuted }}>Document not found.</p>
          ) : (
            <MarkdownView source={markdown} />
          )}
        </main>
      </div>
    </SiteShell>
  );
}
