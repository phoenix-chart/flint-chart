import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import { SiteShell } from '../components/SiteShell';
import type { DocSection } from '../shared/docs-catalog';
import {
  getDocEntry,
  getDocGroups,
  // sectionTitle,
} from '../shared/docs-catalog';
import { extractHeadingsFromMarkdown } from '../shared/slugify-heading';
import { getDocMarkdown } from '../shared/load-docs';
import {
  DOC_SCROLL_TO_KEY,
  resolveActiveHeadingId,
  scrollToHeading,
} from '../shared/scroll-to-heading';
import { siteTheme } from '../shared/theme';

export function DocSectionPage({ section }: { section: DocSection }) {
  const mainRef = useRef<HTMLElement>(null);
  const { slug } = useParams<{ slug?: string }>();
  const groups = getDocGroups(section);
  const docs = groups.flatMap((g) => g.docs);
  const activeSlug = slug ?? docs[0]?.slug;
  const entry = activeSlug ? getDocEntry(section, activeSlug) : undefined;
  const markdown = entry ? getDocMarkdown(entry) : null;
  const outlineMode = section === 'documentation' ? 'documentation' : 'tutorial';
  const pageHeadings = useMemo(
    () => (markdown ? extractHeadingsFromMarkdown(markdown, outlineMode) : []),
    [markdown, outlineMode],
  );
  const headingIds = useMemo(() => pageHeadings.map((h) => h.id), [pageHeadings]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem(DOC_SCROLL_TO_KEY);
    if (!pending || !markdown) return;
    sessionStorage.removeItem(DOC_SCROLL_TO_KEY);
    const timer = window.setTimeout(() => {
      scrollToHeading(pending, mainRef.current);
      setActiveHeadingId(pending);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [markdown, activeSlug]);

  useEffect(() => {
    setActiveHeadingId(headingIds[0] ?? null);
  }, [headingIds, activeSlug]);

  useEffect(() => {
    const container = mainRef.current;
    if (!container || headingIds.length === 0) return;

    const update = () => {
      const next = resolveActiveHeadingId(headingIds, container);
      setActiveHeadingId((prev) => (prev === next ? prev : next));
    };

    update();
    const readyTimer = window.setTimeout(update, 150);

    container.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.clearTimeout(readyTimer);
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [headingIds, markdown]);

  if (!slug && docs[0]) {
    return <Navigate to={`/${section}/${docs[0].slug}`} replace />;
  }

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
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
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
                const showOutline = active && pageHeadings.length > 0;

                return (
                  <div key={doc.slug}>
                    <Link
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

                    {showOutline && (
                      <nav
                        aria-label={outlineMode === 'documentation' ? 'Sections' : 'On this page'}
                        style={{
                          padding: '4px 0 8px 22px',
                          borderLeft: active
                            ? `3px solid ${siteTheme.accent}`
                            : '3px solid transparent',
                          background: active ? siteTheme.accentBg : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            padding: '2px 14px 6px 0',
                            fontSize: 10,
                            fontWeight: 600,
                            color: siteTheme.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {outlineMode === 'documentation' ? 'Sections' : 'On this page'}
                        </div>
                        {pageHeadings.map((heading) => {
                          const isActive = heading.id === activeHeadingId;
                          return (
                            <button
                              key={heading.id}
                              type="button"
                              aria-current={isActive ? 'location' : undefined}
                              onClick={() => {
                                setActiveHeadingId(heading.id);
                                scrollToHeading(heading.id, mainRef.current);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                cursor: 'pointer',
                                padding:
                                  heading.level === 3
                                    ? '3px 14px 3px 22px'
                                    : '4px 14px 4px 0',
                                fontSize: heading.level === 3 ? 11 : 12,
                                lineHeight: 1.35,
                                color: isActive ? siteTheme.accent : siteTheme.textMuted,
                                fontWeight: isActive ? 600 : heading.level === 2 ? 500 : 400,
                                background: isActive ? siteTheme.accentBg : 'transparent',
                                borderRadius: 4,
                              }}
                            >
                              {heading.text}
                            </button>
                          );
                        })}
                      </nav>
                    )}
                  </div>
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
