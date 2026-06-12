import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TEST_GENERATORS, type TestCase } from 'flint-chart/test-data';
import { SiteShell } from '../components/SiteShell';
import { ScaleToFit } from '../components/ScaleToFit';
import { WallChart } from '../components/WallChart';
import { ChartCodeModal } from '../components/ChartCodeModal';
import {
  CHART_CATEGORIES,
  type ChartCategory,
  type ChartEntry,
} from '../shared/chart-categories';
import { selectVariants } from '../shared/wall-variants';
import type { PreviewBackend } from '../shared/supported-backends';
import { siteTheme } from '../shared/theme';

const MAX_VARIANTS = 4;
const TILE_CHART_HEIGHT = 188;

function loadTests(generator: string): TestCase[] {
  const gen = TEST_GENERATORS[generator];
  if (!gen) return [];
  try {
    return gen();
  } catch (err) {
    console.error('test generator failed', generator, err);
    return [];
  }
}

interface ChartSection {
  chart: ChartEntry;
  /** Curated examples (drive both the tiles and the modal carousel). */
  variants: TestCase[];
  /** Absolute index of each curated example in the generator output. */
  indices: number[];
}

function buildSections(charts: ChartEntry[]): ChartSection[] {
  return charts
    .map((chart) => {
      const full = loadTests(chart.generator);
      const variants = selectVariants(full, MAX_VARIANTS);
      return { chart, variants, indices: variants.map((v) => full.indexOf(v)) };
    })
    .filter((section) => section.variants.length > 0);
}

function resolveCategory(backendParam?: string): ChartCategory {
  return CHART_CATEGORIES.find((c) => c.id === backendParam) ?? CHART_CATEGORIES[0];
}

interface ActiveModal {
  chart: ChartEntry;
  tests: TestCase[];
  editorIndices: number[];
  index: number;
}

export function ChartWall() {
  const { backend: backendParam } = useParams<{ backend?: string }>();
  const navigate = useNavigate();
  const category = resolveCategory(backendParam);

  const [active, setActive] = useState<ActiveModal | null>(null);

  // Keep the URL canonical (e.g. /wall -> /wall/vegalite) without adding history.
  useEffect(() => {
    if (backendParam !== category.id) {
      navigate(`/wall/${category.id}`, { replace: true });
    }
  }, [backendParam, category.id, navigate]);

  // One section per chart type (so every line chart sits together, etc.).
  const sections = useMemo(() => buildSections(category.charts), [category]);
  const totalTiles = sections.reduce((sum, section) => sum + section.variants.length, 0);

  return (
    <SiteShell>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 28px 64px' }}>
        <header style={{ marginBottom: 16, maxWidth: 820 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: siteTheme.textMuted, letterSpacing: 0.3 }}>
            Gallery · photo wall (beta)
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.2 }}>
            {category.label}
          </h1>
          <p style={{ margin: '8px 0 0', color: siteTheme.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            {totalTiles} examples across {sections.length} chart types — click any example to browse
            its variations and copy the generated code.
          </p>
        </header>

        <BackendTabs activeId={category.id} onSelect={(id) => navigate(`/wall/${id}`)} />

        {sections.map((section) => (
          <section key={section.chart.id} style={{ marginTop: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img
                src={section.chart.icon}
                alt=""
                aria-hidden="true"
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: siteTheme.text }}>
                {section.chart.label}
              </h2>
              <span style={{ fontSize: 12, color: siteTheme.textMuted }}>
                {section.variants.length}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 14,
              }}
            >
              {section.variants.map((testCase, pos) => (
                <VariantCard
                  key={`${section.chart.id}-${pos}`}
                  chart={section.chart}
                  testCase={testCase}
                  onOpen={() =>
                    setActive({
                      chart: section.chart,
                      tests: section.variants,
                      editorIndices: section.indices,
                      index: pos,
                    })
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {active && (
        <ChartCodeModal
          chart={active.chart}
          tests={active.tests}
          initialIndex={active.index}
          editorIndices={active.editorIndices}
          onClose={() => setActive(null)}
        />
      )}
    </SiteShell>
  );
}

function VariantCard({
  chart,
  testCase,
  onOpen,
}: {
  chart: ChartEntry;
  testCase: TestCase;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Render the preview only once the card scrolls near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={testCase.title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: 0,
        background: siteTheme.surface,
        border: `1px solid ${hovered ? siteTheme.borderMuted : siteTheme.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: hovered ? '0 6px 18px rgba(15,23,32,0.10)' : '0 1px 2px rgba(15,23,32,0.04)',
        transition: 'box-shadow 140ms ease, border-color 140ms ease',
      }}
    >
      <div style={{ width: '100%', height: TILE_CHART_HEIGHT, background: siteTheme.bg }}>
        {visible ? (
          <ScaleToFit height={TILE_CHART_HEIGHT} padding={12}>
            <WallChart testCase={testCase} backend={chart.backend} />
          </ScaleToFit>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: siteTheme.textMuted,
              fontSize: 12,
            }}
          >
            Loading…
          </div>
        )}
      </div>

      <div
        style={{
          padding: '9px 12px',
          fontSize: 12.5,
          color: siteTheme.text,
          borderTop: `1px solid ${siteTheme.border}`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {testCase.title}
      </div>
    </button>
  );
}

function BackendTabs({
  activeId,
  onSelect,
}: {
  activeId: PreviewBackend;
  onSelect: (id: PreviewBackend) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${siteTheme.border}` }}>
      {CHART_CATEGORIES.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            style={{
              padding: '8px 14px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? siteTheme.accent : siteTheme.textMuted,
              borderBottom: isActive ? `2px solid ${siteTheme.accent}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {category.label}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: siteTheme.textMuted,
                fontWeight: 400,
              }}
            >
              {category.charts.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
