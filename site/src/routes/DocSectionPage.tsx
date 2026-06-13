import { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import { SiteShell } from '../components/SiteShell';
import type { DocSection } from '../shared/docs-catalog';
import {
  getDocEntry,
  getDocGroups,
  // sectionTitle,
} from '../shared/docs-catalog';
import { getDocMarkdown } from '../shared/load-docs';
import { DOC_SCROLL_TO_KEY, scrollToHeading } from '../shared/scroll-to-heading';
import { siteTheme } from '../shared/theme';

export function DocSectionPage({ section }: { section: DocSection }) {
  const mainRef = useRef<HTMLElement>(null);
  const { slug } = useParams<{ slug?: string }>();
  const groups = getDocGroups(section);
  const docs = groups.flatMap((g) => g.docs);
  const activeSlug = slug ?? docs[0]?.slug;
  const entry = activeSlug ? getDocEntry(section, activeSlug) : undefined;

  if (!slug && docs[0]) {
    return <Navigate to={`/${section}/${docs[0].slug}`} replace />;
  }

  const markdown = entry ? getDocMarkdown(entry) : null;

  useEffect(() => {
    const pending = sessionStorage.getItem(DOC_SCROLL_TO_KEY);
    if (!pending || !markdown) return;
    sessionStorage.removeItem(DOC_SCROLL_TO_KEY);
    const timer = window.setTimeout(() => {
      scrollToHeading(pending, mainRef.current);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [markdown, activeSlug]);

  return (
    <SiteShell>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
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
            padding: '12px 0 16px',
          }}
        >
          

          {groups.map((group) => (
            <div key={group.id} style={{ marginBottom: 12 }}>
              <div
                style={{
                  padding: '4px 16px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: siteTheme.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {group.label}
              </div>

              {group.docs.map((doc) => {
                const active = doc.slug === activeSlug;
                return (
                  <Link
                    key={doc.slug}
                    to={`/${section}/${doc.slug}`}
                    style={{
                      display: 'block',
                      padding: '7px 16px',
                      textDecoration: 'none',
                      fontSize: 13,
                      color: active ? siteTheme.accent : siteTheme.text,
                      background: active ? siteTheme.accentBg : 'transparent',
                      fontWeight: active ? 600 : 400,
                      borderLeft: active
                        ? `3px solid ${siteTheme.accent}`
                        : '3px solid transparent',
                    }}
                  >
                    <div>{doc.title}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: siteTheme.textMuted,
                        marginTop: 2,
                        lineHeight: 1.35,
                        fontWeight: 400,
                      }}
                    >
                      {doc.description}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        <main ref={mainRef} style={{ overflowY: 'auto', padding: '24px 32px 48px' }}>
          {!entry || !markdown ? (
            <p style={{ color: siteTheme.textMuted }}>Document not found.</p>
          ) : (
            <MarkdownView source={markdown} scrollContainerRef={mainRef} />
          )}
        </main>
      </div>
    </SiteShell>
  );
}
