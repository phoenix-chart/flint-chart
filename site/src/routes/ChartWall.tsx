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
import type { PreviewBackend } from '../shared/supported-backends';
import { siteTheme } from '../shared/theme';

const CASES_PER_CHART = 3;
const CARD_CHART_HEIGHT = 210;

function loadTests(generator: string): TestCase[] {
  const gen = TEST_GENERATORS[generator];
  if (!gen) return [];
  try {
    return gen().slice(0, CASES_PER_CHART);
  } catch (err) {
    console.error('test generator failed', generator, err);
    return [];
  }
}

function resolveCategory(backendParam?: string): ChartCategory {
  return (
    CHART_CATEGORIES.find((c) => c.id === backendParam) ?? CHART_CATEGORIES[0]
  );
}

export function ChartWall() {
  const { backend: backendParam } = useParams<{ backend?: string }>();
  const navigate = useNavigate();
  const category = resolveCategory(backendParam);

  const [active, setActive] = useState<{ chart: ChartEntry; tests: TestCase[] } | null>(null);

  // Keep the URL canonical (e.g. /wall -> /wall/vegalite) without adding history.
  useEffect(() => {
    if (backendParam !== category.id) {
      navigate(`/wall/${category.id}`, { replace: true });
    }
  }, [backendParam, category.id, navigate]);

  const openChart = (chart: ChartEntry) => {
    const tests = loadTests(chart.generator);
    if (tests.length > 0) setActive({ chart, tests });
  };

  return (
    <SiteShell>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 28px 48px' }}>
        <header style={{ marginBottom: 18, maxWidth: 820 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: siteTheme.textMuted }}>
            Gallery · photo wall (beta)
          </p>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{category.label} examples</h1>
          <p style={{ margin: '8px 0 0', color: siteTheme.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            {category.description} Every chart is laid out at a glance and scaled to fit its tile —
            click a card to browse its examples and copy the generated code.
          </p>
        </header>

        <BackendTabs activeId={category.id} onSelect={(id) => navigate(`/wall/${id}`)} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            marginTop: 20,
          }}
        >
          {category.charts.map((chart) => (
            <WallCard key={chart.id} chart={chart} onOpen={() => openChart(chart)} />
          ))}
        </div>
      </main>

      {active && (
        <ChartCodeModal
          chart={active.chart}
          tests={active.tests}
          onClose={() => setActive(null)}
        />
      )}
    </SiteShell>
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
    <div
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: `1px solid ${siteTheme.border}`,
      }}
    >
      {CHART_CATEGORIES.map((category) => {
        const active = category.id === activeId;
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
              fontWeight: active ? 600 : 400,
              color: active ? siteTheme.accent : siteTheme.textMuted,
              borderBottom: active
                ? `2px solid ${siteTheme.accent}`
                : '2px solid transparent',
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

function WallCard({ chart, onOpen }: { chart: ChartEntry; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Render the preview chart only once the card scrolls near the viewport.
  const firstTest = useMemo(() => (visible ? loadTests(chart.generator)[0] : undefined), [
    visible,
    chart.generator,
  ]);

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
      { rootMargin: '300px' },
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: 0,
        background: siteTheme.surface,
        border: `1px solid ${hovered ? siteTheme.borderMuted : siteTheme.border}`,
        borderRadius: siteTheme.radius,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: hovered ? '0 4px 14px rgba(0,0,0,0.10)' : 'none',
        transition: 'box-shadow 120ms ease, border-color 120ms ease',
      }}
    >
      <div
        style={{
          width: '100%',
          height: CARD_CHART_HEIGHT,
          background: siteTheme.bg,
          borderBottom: `1px solid ${siteTheme.border}`,
        }}
      >
        {firstTest ? (
          <ScaleToFit height={CARD_CHART_HEIGHT} padding={12}>
            <WallChart testCase={firstTest} backend={chart.backend} />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
        <img src={chart.icon} alt="" aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: siteTheme.text, lineHeight: 1.3 }}>
          {chart.label}
        </span>
      </div>
    </button>
  );
}
