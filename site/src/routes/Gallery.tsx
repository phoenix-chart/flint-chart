import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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
  type ChartCategory,
  type ChartEntry,
} from '../shared/chart-categories';
import { buildGalleryEditorHref } from '../shared/editor-payload';
import { siteTheme } from '../shared/theme';
import type { PreviewBackend } from '../shared/supported-backends';

const CASES_PER_GENERATOR = 3;
const SCROLL_SPY_ROOT_MARGIN = '-15% 0px -70% 0px';
const NAV_SCROLL_END_MS = 150;
const NAV_SCROLL_MAX_MS = 4000;
const SIDEBAR_HOVER_BG = '#f4f7fb';

const BACKEND_BADGE_STYLES: Record<PreviewBackend, CSSProperties> = {
  vegalite: {
    background: '#eef6fc',
    border: '1px solid #c7e0f4',
    color: '#0f5ea6',
  },
  echarts: {
    background: '#f5eff9',
    border: '1px solid #e0d1ee',
    color: '#7a3e9d',
  },
  chartjs: {
    background: '#fdf1f2',
    border: '1px solid #f3ccd3',
    color: '#b4233c',
  },
};

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
  const categoryId = findChartEntry(chartId)?.category.id ?? CHART_CATEGORIES[0]?.id ?? 'vegalite';
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

  const scrollToChart = useCallback(
    (chartId: string, behavior: ScrollBehavior = 'smooth') => {
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
    },
    [releaseNavScrollLock],
  );

  const navigateToChart = useCallback(
    (chartId: string, behavior: ScrollBehavior = 'smooth') => {
      if (!isValidChartId(chartId)) return;

      applyActiveChart(chartId);
      scrollToChart(chartId, behavior);
    },
    [applyActiveChart, scrollToChart],
  );

  useEffect(() => {
    const deepLinkId = chartIdParam && isValidChartId(chartIdParam) ? chartIdParam : undefined;

    if (deepLinkId) {
      applyActiveChart(deepLinkId, { updateHash: false });
      const timer = window.setTimeout(() => scrollToChart(deepLinkId, 'instant'), 0);
      return () => window.clearTimeout(timer);
    }

    updateUrl(DEFAULT_CHART_ID);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          .filter((entry) => entry.isIntersecting)
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
            padding: '12px 0 18px',
          }}
        >
          <div
            style={{
              padding: '0 16px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: siteTheme.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Chart backends
          </div>

          {CHART_CATEGORIES.map((category, index) => {
            const expanded = expandedCategories.has(category.id);
            const firstChartId = category.charts[0]?.id;
            const hasActiveChild = category.charts.some((chart) => chart.id === activeChartId);

            return (
              <div key={category.id}>
                <SidebarSectionHeader
                  category={category}
                  expanded={expanded}
                  hasActiveChild={hasActiveChild}
                  showDivider={index > 0}
                  onNavigate={() => firstChartId && navigateToChart(firstChartId)}
                  onToggle={() => toggleCategory(category.id)}
                />

                {expanded &&
                  category.charts.map((chart) => (
                    <SidebarItem
                      key={chart.id}
                      active={activeChartId === chart.id}
                      chart={chart}
                      onClick={() => navigateToChart(chart.id)}
                    />
                  ))}
              </div>
            );
          })}
        </aside>

        <main ref={mainRef} style={{ overflowY: 'auto', padding: '24px 28px 40px' }}>
          <header style={{ marginBottom: 32, maxWidth: 760 }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: siteTheme.textMuted }}>Gallery</p>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Backend-specific chart examples</h1>
            <p style={{ margin: '8px 0 0', color: siteTheme.textMuted, fontSize: 14, lineHeight: 1.6 }}>
              Browse curated examples inspired by clean visualization galleries. Each section is
              organized by rendering backend and shows only the relevant chart implementation.
            </p>
            <p style={{ margin: '6px 0 0', color: siteTheme.textMuted, fontSize: 12 }}>
              {totalChartTypes} chart sections · {CASES_PER_GENERATOR} curated examples each
            </p>
          </header>

          {CHART_CATEGORIES.map((category) => (
            <div key={category.id} style={{ marginBottom: 44 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 18,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${siteTheme.border}`,
                }}
              >
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: siteTheme.textMuted }}>Backend</p>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: siteTheme.text }}>
                    {category.label}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: siteTheme.textMuted }}>
                  {category.description}
                </p>
              </div>

              {category.charts.map((chart) => (
                <GalleryChartSection key={chart.id} chart={chart} scrollRoot={mainRef} />
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
  scrollRoot,
}: {
  chart: ChartEntry;
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
    <section ref={sectionRef} id={chart.id} style={{ marginBottom: 34, scrollMarginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src={chart.icon} alt="" aria-hidden="true" style={{ width: 20, height: 20, flexShrink: 0 }} />
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            color: siteTheme.text,
          }}
        >
          {chart.label}
        </h3>
        <span style={{ ...backendBadgeBaseStyle, ...BACKEND_BADGE_STYLES[chart.backend] }}>
          {chart.backendLabel}
        </span>
      </div>

      {loadState === 'loading' && (
        <p style={{ color: siteTheme.textMuted, fontSize: 13, margin: '0 0 12px' }}>
          Loading curated examples…
        </p>
      )}

      {loadState === 'idle' && (
        <div
          style={{
            height: 132,
            marginBottom: 12,
            borderRadius: siteTheme.radius,
            border: `1px dashed ${siteTheme.border}`,
            background: siteTheme.bg,
          }}
        />
      )}

      {section?.tests.map((testCase, index) => (
        <article
          key={`${section.generator}-${index}`}
          style={{
            marginBottom: 18,
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
              gap: '6px 12px',
              marginBottom: 4,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{testCase.title}</h4>
            <a href={buildGalleryEditorHref(section.generator, index)} style={editorLinkStyle}>
              Open in editor
            </a>
          </div>
          <p style={{ margin: '0 0 12px', color: siteTheme.textMuted, fontSize: 13, lineHeight: 1.55 }}>
            {testCase.description}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) minmax(0, 1fr)',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            <FlintInputSummary testCase={testCase} />
            <LazyTripleChart testCase={testCase} backend={chart.backend} />
          </div>
        </article>
      ))}

      {loadState === 'done' && !section && (
        <p style={{ color: siteTheme.textMuted, fontSize: 13 }}>No examples for this chart yet.</p>
      )}
    </section>
  );
}

function SidebarSectionHeader({
  category,
  expanded,
  hasActiveChild,
  showDivider,
  onNavigate,
  onToggle,
}: {
  category: ChartCategory;
  expanded: boolean;
  hasActiveChild: boolean;
  showDivider: boolean;
  onNavigate: () => void;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        marginTop: showDivider ? 8 : 0,
        paddingTop: showDivider ? 8 : 0,
        borderTop: showDivider ? `1px solid ${siteTheme.border}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 0 10px' }}>
        <button
          type="button"
          aria-label={expanded ? `Collapse ${category.label}` : `Expand ${category.label}`}
          onClick={onToggle}
          style={{
            flexShrink: 0,
            width: 28,
            padding: '7px 0',
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
          onClick={onNavigate}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            flex: 1,
            padding: '7px 10px',
            border: 0,
            borderRadius: 6,
            background: hasActiveChild ? siteTheme.accentBg : hovered ? SIDEBAR_HOVER_BG : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            color: hasActiveChild ? siteTheme.accent : siteTheme.text,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {category.label}
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  active,
  chart,
  onClick,
}: {
  active: boolean;
  chart: ChartEntry;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '6px 16px 6px 42px',
        border: 0,
        textAlign: 'left',
        background: active ? siteTheme.accentBg : hovered ? SIDEBAR_HOVER_BG : 'transparent',
        color: active ? siteTheme.accent : siteTheme.text,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      <img src={chart.icon} alt="" aria-hidden="true" style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span>{chart.label}</span>
    </button>
  );
}

const backendBadgeBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.01em',
};

const editorLinkStyle: CSSProperties = {
  color: siteTheme.accent,
  fontSize: 12,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
