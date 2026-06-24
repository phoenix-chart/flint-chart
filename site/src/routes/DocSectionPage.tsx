import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import {
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
  SIDEBAR_NAV_WIDTH,
} from '../components/SidebarNav';
import { SiteShell } from '../components/SiteShell';
import type { DocSection } from '../shared/docs-catalog';
import {
  getDocEntry,
  getDocGroups,
  // sectionTitle,
} from '../shared/docs-catalog';
import { getDocMarkdown } from '../shared/load-docs';
import { DOC_SCROLL_TO_KEY, scrollToHeading, scrollNavItemIntoView } from '../shared/scroll-to-heading';
import { CONTENT_MAX_WIDTH, siteTheme } from '../shared/theme';

export function DocSectionPage({ section }: { section: DocSection }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const groups = getDocGroups(section);
  const docs = groups.flatMap((g) => g.docs);
  const firstSlug = docs[0]?.slug;
  const activeSlug = slug ?? firstSlug;
  const entry = activeSlug ? getDocEntry(section, activeSlug) : undefined;
  const markdown = entry ? getDocMarkdown(entry) : null;

  // Canonicalize a slug-less URL (/documentation) to the first doc WITHOUT a
  // redirect render. We render the default doc immediately and only replace the
  // URL in place, so the shell never unmounts — avoiding the blank flash a
  // returned <Navigate> caused. Keeping every hook unconditional also prevents
  // the "rendered more hooks" crash when moving between the /documentation and
  // /documentation/:slug routes (they share this component instance).
  useEffect(() => {
    if (!slug && firstSlug) {
      navigate(`/${section}/${firstSlug}`, { replace: true });
    }
  }, [slug, section, firstSlug, navigate]);

  useEffect(() => {
    const stored = sessionStorage.getItem(DOC_SCROLL_TO_KEY);
    const hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    const pending = stored ?? hash;
    if (!pending || !markdown) return;
    if (stored) sessionStorage.removeItem(DOC_SCROLL_TO_KEY);
    const timer = window.setTimeout(() => {
      scrollToHeading(pending, mainRef.current);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [markdown, activeSlug, location.hash]);

  // Bring the active doc into view in the sidebar, but only when it has
  // scrolled out of view. Discrete (on active-doc change), so it never forms a
  // scroll feedback loop or fights the user.
  useEffect(() => {
    if (!activeSlug) return;
    const sidebar = sidebarRef.current;
    const item = sidebar?.querySelector<HTMLElement>(
      `[data-doc-nav="${CSS.escape(activeSlug)}"]`,
    );
    scrollNavItemIntoView(sidebar, item ?? null);
  }, [activeSlug]);

  return (
    <SiteShell>
      <div
        ref={mainRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${SIDEBAR_NAV_WIDTH}px 1fr`,
            alignItems: 'start',
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            margin: '0 auto',
          }}
        >
          <SidebarNav sidebarRef={sidebarRef}>
            {groups.map((group, gi) => (
              <SidebarNavSection key={group.id} label={group.label} first={gi === 0}>
                {group.docs.map((doc) => {
                  const active = doc.slug === activeSlug;
                  return (
                    <SidebarNavItem
                      key={doc.slug}
                      as="link"
                      active={active}
                      to={`/${section}/${doc.slug}`}
                      dataAttr={{ 'data-doc-nav': doc.slug }}
                    >
                      {doc.title}
                    </SidebarNavItem>
                  );
                })}
              </SidebarNavSection>
            ))}
          </SidebarNav>

          <main style={{ minWidth: 0, padding: '24px 32px 48px' }}>
            {!entry || !markdown ? (
              <p style={{ color: siteTheme.textMuted }}>Document not found.</p>
            ) : (
              <MarkdownView source={markdown} scrollContainerRef={mainRef} />
            )}
          </main>
        </div>
      </div>
    </SiteShell>
  );
}
