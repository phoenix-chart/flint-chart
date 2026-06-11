import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { useParams } from 'react-router-dom';
import { TEST_GENERATORS } from 'flint-chart/test-data';
import type { TestCase } from 'flint-chart/test-data';
import { SiteShell } from '../components/SiteShell';
import { FlintInputSummary } from '../components/FlintInputSummary';
import { LazyTripleChart } from '../components/LazyTripleChart';
import {
  CHART_CATEGORIES,
  DEFAULT_CHART_ID,
  findChartEntry,
  getAllChartEntries,
  isValidChartId,
  type ChartEntry,
} from '../shared/chart-categories';
import { buildGalleryEditorHref } from '../shared/editor-payload';
import { siteTheme } from '../shared/theme';

const CASES_PER_GENERATOR = 6;
const SCROLL_SPY_ROOT_MARGIN = '-15% 0px -70% 0px';
const NAV_SCROLL_END_MS = 150;
const NAV_SCROLL_MAX_MS = 4000;

type LoadedSection = {
  generator: string;
  tests: TestCase[];
};

function loadSection(generator: string): LoadedSection | null {
  const gen = TEST_GENERATORS[generator];
  if (!gen) return null;
  try {
    const tests = gen().slice(0, CASES_PER_GENERATOR);
    if (tests.length === 0) return null;
    return { generator, tests };
  } catch (err) {
    console.error('test generator failed', generator, err);
    return null;
  }
}

function initialExpandedCategories(chartId: string): Set<string> {
  const categoryId = findChartEntry(chartId)?.category.id ?? 'line';
  return new Set([categoryId]);
}

function galleryHash(chartId: string) {
  return `#/gallery/${chartId}`;
}

function chartIdFromHash(): string | undefined {
  const match = window.location.hash.match(/^#\/gallery\/([^/?#]+)/);
  const id = match?.[1];
  return id && isValidChartId(id) ? id : undefined;
}

function expandCategoryForChart(
  setExpanded: Dispatch<SetStateAction<Set<string>>>,
  chartId: string,
) {
  const categoryId = findChartEntry(chartId)?.category.id;
  if (!categoryId) return;
  setExpanded((prev) => {
    if (prev.has(categoryId)) return prev;
    return new Set([...prev, categoryId]);
  });
}

/**
 * Chart gallery — scrollable catalog with anchor sidebar navigation.
 * Right: all chart sections in order, lazy-loaded on scroll.
 * Left: jump-to-section nav with URL sync (#/gallery/bump-chart).
 */
export function Gallery() {
  const { chartId: chartIdParam } = useParams<{ chartId?: string }>();
  const mainRef = useRef<HTMLElement>(null);
  const navScrollingRef = useRef(false);
  const navScrollCleanupRef = useRef<(() => void) | null>(null);
  const activeChartIdRef = useRef(DEFAULT_CHART_ID);

  const initialChartId =
    chartIdParam && isValidChartId(chartIdParam) ? chartIdParam : DEFAULT_CHART_ID;
  activeChartIdRef.current = initialChartId;

  const [activeChartId, setActiveChartId] = useState(initialChartId);
  const [expandedCategories, setExpandedCategories] = useState(() =>
    initialExpandedCategories(initialChartId),
  );

  /** Update the hash without React Router navigation (avoids re-render storms). */
  const updateUrl = useCallback((chartId: string) => {
    const nextHash = galleryHash(chartId);
    if (window.location.hash === nextHash) return;
    window.history.replaceState(null, '', nextHash);
  }, []);

  const applyActiveChart = useCallback(
    (chartId: string, options?: { updateHash?: boolean }) => {
      if (!isValidChartId(chartId) || chartId === activeChartIdRef.current) return;

      activeChartIdRef.current = chartId;
      setActiveChartId(chartId);
      expandCategoryForChart(setExpandedCategories, chartId);
      if (options?.updateHash !== false) updateUrl(chartId);
    },
    [updateUrl],
  );

  const releaseNavScrollLock = useCallback(() => {
    navScrollingRef.current = false;
    navScrollCleanupRef.current?.();
    navScrollCleanupRef.current = null;
  }, []);

  const scrollToChart = useCallback((chartId: string, behavior: ScrollBehavior = 'smooth') => {
    const root = mainRef.current;
    const target = root?.querySelector<HTMLElement>(`#${CSS.escape(chartId)}`);
    if (!root || !target) return;

    releaseNavScrollLock();
    navScrollingRef.current = true;

    const rootTop = root.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    root.scrollTo({
      top: root.scrollTop + targetTop - rootTop - 8,
      behavior,
    });

    if (behavior === 'instant') {
      const instantTimer = window.setTimeout(releaseNavScrollLock, 50);
      navScrollCleanupRef.current = () => window.clearTimeout(instantTimer);
      return;
    }

    let scrollEndTimer: number | undefined;
    let maxTimer: number | undefined;

    const onScroll = () => {
      if (scrollEndTimer !== undefined) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(releaseNavScrollLock, NAV_SCROLL_END_MS);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    maxTimer = window.setTimeout(releaseNavScrollLock, NAV_SCROLL_MAX_MS);

    navScrollCleanupRef.current = () => {
      root.removeEventListener('scroll', onScroll);
      if (scrollEndTimer !== undefined) window.clearTimeout(scrollEndTimer);
      if (maxTimer !== undefined) window.clearTimeout(maxTimer);
    };
  }, [releaseNavScrollLock]);

  const navigateToChart = useCallback(
    (chartId: string, behavior: ScrollBehavior = 'smooth') => {
      if (!isValidChartId(chartId)) return;

      applyActiveChart(chartId);
      scrollToChart(chartId, behavior);
    },
    [applyActiveChart, scrollToChart],
  );

  // Deep-link on first mount only (e.g. #/gallery/sankey).
  useEffect(() => {
    const deepLinkId = chartIdParam && isValidChartId(chartIdParam) ? chartIdParam : undefined;

    if (deepLinkId) {
      applyActiveChart(deepLinkId, { updateHash: false });
      const timer = window.setTimeout(() => scrollToChart(deepLinkId, 'instant'), 0);
      return () => window.clearTimeout(timer);
    }

    updateUrl(DEFAULT_CHART_ID);
    return undefined;
    // Mount only — scroll/hash reactions are handled by scroll spy & popstate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back/forward after replaceState hash updates.
  useEffect(() => {
    const onPopState = () => {
      const id = chartIdFromHash();
      if (!id || id === activeChartIdRef.current) return;

      activeChartIdRef.current = id;
      setActiveChartId(id);
      expandCategoryForChart(setExpandedCategories, id);
      scrollToChart(id, 'instant');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [scrollToChart]);

  // Scroll spy — highlight sidebar + sync hash while user scrolls.
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const sectionEls = getAllChartEntries()
      .map(({ chart }) => root.querySelector<HTMLElement>(`#${CSS.escape(chart.id)}`))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (navScrollingRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const top = visible[0]?.target;
        if (!top?.id || !isValidChartId(top.id)) return;

        applyActiveChart(top.id);
      },
      { root, rootMargin: SCROLL_SPY_ROOT_MARGIN, threshold: 0 },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [applyActiveChart]);

  useEffect(() => () => releaseNavScrollLock(), [releaseNavScrollLock]);

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  const totalChartTypes = getAllChartEntries().length;

  return (
    <SiteShell>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
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
            padding: '12px 0',
          }}
        >
          <div
            style={{
              padding: '0 16px 8px',
              fontSize: 11,
              fontWeight: 600,
              color: siteTheme.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Chart types
          </div>

          {CHART_CATEGORIES.map((cat) => {
            const expanded = expandedCategories.has(cat.id);
            const firstChartId = cat.charts[0]?.id;
            const hasActiveChild = cat.charts.some((chart) => chart.id === activeChartId);

            return (
              <div key={cat.id} style={{ marginBottom: 4 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    aria-label={expanded ? `Collapse ${cat.label}` : `Expand ${cat.label}`}
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      flexShrink: 0,
                      width: 28,
                      padding: '6px 0 6px 12px',
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: siteTheme.textMuted,
                    }}
                  >
                    {expanded ? '▾' : '▸'}
                  </button>

                  <button
                    type="button"
                    onClick={() => firstChartId && navigateToChart(firstChartId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      padding: '6px 16px 6px 0',
                      border: 0,
                      background: hasActiveChild ? siteTheme.accentBg : 'transparent',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: hasActiveChild ? siteTheme.accent : siteTheme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        textAlign: 'center',
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {cat.glyph}
                    </span>
                    {cat.label}
                  </button>
                </div>

                {expanded &&
                  cat.charts.map((chart) => (
                    <SidebarItem
                      key={chart.id}
                      active={activeChartId === chart.id}
                      label={chart.label}
                      onClick={() => navigateToChart(chart.id)}
                    />
                  ))}
              </div>
            );
          })}
        </aside>

        <main ref={mainRef} style={{ overflowY: 'auto', padding: '20px 24px' }}>
          <header style={{ marginBottom: 28 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: siteTheme.textMuted }}>
              Gallery
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Chart examples</h1>
            <p style={{ margin: '6px 0 0', color: siteTheme.textMuted, fontSize: 14, maxWidth: 640 }}>
              Flint compiles table data + semantic types + a short chart spec into full Vega-Lite,
              ECharts, and Chart.js configs. Scroll to browse all examples, or use the sidebar to
              jump to a chart type.
            </p>
            <p style={{ margin: '4px 0 0', color: siteTheme.textMuted, fontSize: 12 }}>
              {totalChartTypes} chart types · up to {CASES_PER_GENERATOR} examples each
            </p>
          </header>

          {CHART_CATEGORIES.map((cat) => (
            <div key={cat.id} style={{ marginBottom: 36 }}>
              <h2
                id={`category-${cat.id}`}
                style={{
                  margin: '0 0 16px',
                  paddingBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: siteTheme.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: `1px solid ${siteTheme.border}`,
                  scrollMarginTop: 8,
                }}
              >
                <span style={{ marginRight: 8 }}>{cat.glyph}</span>
                {cat.label}
              </h2>

              {cat.charts.map((chart) => (
                <GalleryChartSection
                  key={chart.id}
                  chart={chart}
                  categoryLabel={cat.label}
                  scrollRoot={mainRef}
                />
              ))}
            </div>
          ))}
        </main>
      </div>
    </SiteShell>
  );
}

function GalleryChartSection({
  chart,
  categoryLabel,
  scrollRoot,
}: {
  chart: ChartEntry;
  categoryLabel: string;
  scrollRoot: RefObject<HTMLElement | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [section, setSection] = useState<LoadedSection | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    const el = sectionRef.current;
    const root = scrollRoot.current;
    if (!el || loadState !== 'idle') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setLoadState('loading');
        window.setTimeout(() => {
          setSection(loadSection(chart.generator));
          setLoadState('done');
        }, 0);
        observer.disconnect();
      },
      { root, rootMargin: '240px 0px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [chart.generator, loadState, scrollRoot]);

  return (
    <section
      ref={sectionRef}
      id={chart.id}
      style={{ marginBottom: 32, scrollMarginTop: 12 }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 16,
          fontWeight: 600,
          color: siteTheme.text,
        }}
      >
        {chart.label}
        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: siteTheme.textMuted }}>
          {categoryLabel}
        </span>
      </h3>

      {loadState === 'loading' && (
        <p style={{ color: siteTheme.textMuted, fontSize: 13, margin: '0 0 12px' }}>
          Loading examples…
        </p>
      )}

      {loadState === 'idle' && (
        <div
          style={{
            height: 120,
            marginBottom: 12,
            borderRadius: siteTheme.radius,
            border: `1px dashed ${siteTheme.border}`,
            background: siteTheme.bg,
          }}
        />
      )}

      {section?.tests.map((t, i) => (
        <article
          key={`${section.generator}-${i}`}
          style={{
            marginBottom: 20,
            padding: 16,
            background: siteTheme.surface,
            border: `1px solid ${siteTheme.border}`,
            borderRadius: siteTheme.radius,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '4px 12px',
              marginBottom: 4,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t.title}</h4>
            <a href={buildGalleryEditorHref(section.generator, i)} style={editorLinkStyle}>
              View this example in the online editor
            </a>
          </div>
          <p style={{ margin: '0 0 12px', color: siteTheme.textMuted, fontSize: 13 }}>
            {t.description}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) minmax(0, 1fr)',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            <FlintInputSummary testCase={t} />
            <LazyTripleChart testCase={t} />
          </div>
        </article>
      ))}

      {loadState === 'done' && !section && (
        <p style={{ color: siteTheme.textMuted, fontSize: 13 }}>No examples for this chart yet.</p>
      )}
    </section>
  );
}

function SidebarItem({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '5px 16px 5px 42px',
        border: 0,
        textAlign: 'left',
        background: active ? siteTheme.accentBg : 'transparent',
        color: active ? siteTheme.accent : siteTheme.text,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

const editorLinkStyle = {
  color: siteTheme.accent,
  fontSize: 12,
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
};
