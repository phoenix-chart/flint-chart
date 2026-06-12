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
import { CHART_FAMILIES, familyForChart } from '../shared/wall-families';
import type { PreviewBackend } from '../shared/supported-backends';
import { siteTheme } from '../shared/theme';

const MAX_VARIANTS = 4;
const TILE_CHART_HEIGHT = 176;
const TILE_WIDTH = 248;

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

/** One thumbnail = one curated example of a specific chart type. */
interface Tile {
  chart: ChartEntry;
  testCase: TestCase;
  /** Position of this example within its chart's curated variant list. */
  pos: number;
  /** All curated variants of this chart (drives the modal carousel). */
  variants: TestCase[];
  /** Absolute index of each curated variant in the generator output. */
  indices: number[];
}

interface FamilySection {
  id: string;
  label: string;
  tiles: Tile[];
}

/** Bucket every curated example into a coarse, gallery-style family. */
function buildFamilies(charts: ChartEntry[]): FamilySection[] {
  const byFamily = new Map<string, Tile[]>();

  for (const chart of charts) {
    const full = loadTests(chart.generator);
    const variants = selectVariants(full, MAX_VARIANTS);
    if (variants.length === 0) continue;
    const indices = variants.map((v) => full.indexOf(v));
    const familyId = familyForChart(chart);
    const bucket = byFamily.get(familyId) ?? [];
    variants.forEach((testCase, pos) => {
      bucket.push({ chart, testCase, pos, variants, indices });
    });
    byFamily.set(familyId, bucket);
  }

  return CHART_FAMILIES.map((family) => ({
    id: family.id,
    label: family.label,
    tiles: byFamily.get(family.id) ?? [],
  })).filter((section) => section.tiles.length > 0);
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

  const families = useMemo(() => buildFamilies(category.charts), [category]);
  const totalTiles = families.reduce((sum, section) => sum + section.tiles.length, 0);

  return (
    <SiteShell>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: siteTheme.surface }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 32px 96px' }}>
          <header style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: -0.4 }}>
              Example Gallery
            </h1>
            <p
              style={{
                margin: '10px auto 0',
                maxWidth: 620,
                color: siteTheme.textMuted,
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              {totalTiles} {category.label} examples grouped by chart family. Click any example to
              browse its variations and copy the generated code.
            </p>
          </header>

          <BackendTabs activeId={category.id} onSelect={(id) => navigate(`/wall/${id}`)} />

          {families.map((section) => (
            <section key={section.id} style={{ marginTop: 44 }}>
              <h2
                style={{
                  margin: '0 0 18px',
                  paddingBottom: 8,
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  color: siteTheme.text,
                  borderBottom: `1px solid ${siteTheme.border}`,
                }}
              >
                {section.label}
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: siteTheme.textMuted }}>
                  {section.tiles.length}
                </span>
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 20,
                  justifyContent: 'center',
                }}
              >
                {section.tiles.map((tile) => (
                  <VariantCard
                    key={`${tile.chart.id}-${tile.pos}`}
                    tile={tile}
                    onOpen={() =>
                      setActive({
                        chart: tile.chart,
                        tests: tile.variants,
                        editorIndices: tile.indices,
                        index: tile.pos,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
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

function VariantCard({ tile, onOpen }: { tile: Tile; onOpen: () => void }) {
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
      title={tile.testCase.title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        width: TILE_WIDTH,
        padding: 0,
        background: siteTheme.surface,
        border: `1px solid ${hovered ? siteTheme.borderMuted : siteTheme.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: hovered ? '0 4px 12px rgba(15,23,32,0.10)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
      }}
    >
      <div style={{ width: '100%', height: TILE_CHART_HEIGHT, background: siteTheme.surface }}>
        {visible ? (
          <ScaleToFit height={TILE_CHART_HEIGHT} padding={14}>
            <WallChart testCase={tile.testCase} backend={tile.chart.backend} />
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
          padding: '10px 12px 12px',
          fontSize: 12.5,
          lineHeight: 1.4,
          color: siteTheme.text,
          borderTop: `1px solid ${siteTheme.border}`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {tile.testCase.title}
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
    <div
      style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        borderBottom: `1px solid ${siteTheme.border}`,
      }}
    >
      {CHART_CATEGORIES.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            style={{
              padding: '10px 18px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? siteTheme.accent : siteTheme.textMuted,
              borderBottom: isActive ? `2px solid ${siteTheme.accent}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
