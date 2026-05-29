import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { TEST_GENERATORS } from 'flint-chart/test-data';
import { Link } from 'react-router-dom';
import { SiteShell } from '../components/SiteShell';
import { LazyTripleChart } from '../components/LazyTripleChart';
import { BACKEND_GENERATORS, CHART_CATEGORIES } from '../shared/chart-categories';
import { buildGalleryEditorHref } from '../shared/editor-payload';
import { siteTheme } from '../shared/theme';

const CASES_PER_GENERATOR = 6;

type GallerySection = {
  name: string;
  tests: ReturnType<(typeof TEST_GENERATORS)[string]>;
};

function loadSections(selectedCategory: string, categoryGenerators: string[] | undefined): GallerySection[] {
  const generators =
    selectedCategory === '__backend__' ? BACKEND_GENERATORS : (categoryGenerators ?? []);

  return generators
    .map((name) => {
      const gen = TEST_GENERATORS[name];
      if (!gen) return null;
      try {
        const tests = gen().slice(0, CASES_PER_GENERATOR);
        if (tests.length === 0) return null;
        return { name, tests };
      } catch (err) {
        console.error('test generator failed', name, err);
        return null;
      }
    })
    .filter(Boolean) as GallerySection[];
}

/**
 * Chart gallery — left sidebar grouped by chart type (ECharts-style),
 * main area keeps title + description + multi-backend preview cards.
 */
export function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState(CHART_CATEGORIES[0]?.id ?? 'line');
  const [showSemantics, setShowSemantics] = useState(false);
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [loading, setLoading] = useState(true);

  const category = useMemo(
    () => CHART_CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory],
  );

  // Defer heavy generator work so the shell paints before test-data runs.
  useEffect(() => {
    setLoading(true);
    setSections([]);

    const timer = window.setTimeout(() => {
      setSections(loadSections(selectedCategory, category?.generators));
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedCategory, category]);

  const totalCases = sections.reduce((n, s) => n + s.tests.length, 0);

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
          {CHART_CATEGORIES.map((cat) => (
            <SidebarItem
              key={cat.id}
              active={selectedCategory === cat.id}
              glyph={cat.glyph}
              label={cat.label}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}

          <div style={{ margin: '12px 0', borderTop: `1px solid ${siteTheme.border}` }} />

          <SidebarItem
            active={selectedCategory === '__backend__'}
            glyph="⚙"
            label="Backend suites"
            onClick={() => setSelectedCategory('__backend__')}
          />

          <div style={{ margin: '12px 0', borderTop: `1px solid ${siteTheme.border}` }} />

          <button
            type="button"
            onClick={() => setShowSemantics((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 16px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: siteTheme.textMuted,
              textAlign: 'left',
            }}
          >
            <span style={{ width: 16, textAlign: 'center' }}>{showSemantics ? '▾' : '▸'}</span>
            Semantic types
          </button>
          {showSemantics && (
            <div
              style={{
                padding: '8px 16px 12px',
                fontSize: 12,
                lineHeight: 1.5,
                color: siteTheme.textMuted,
              }}
            >
              <p style={{ margin: '0 0 8px' }}>
                Field semantic types steer formatting, aggregation, baselines, and color defaults —
                without hand-writing axis, scale, and legend config for each backend.
              </p>
              <p style={{ margin: '0 0 8px' }}>
                <strong style={{ color: siteTheme.text }}>T0 → T1 → T2</strong>: coarse to fine
                types; missing fine-grained labels degrade gracefully instead of failing.
              </p>
              <Link to="/documentation/semantic-types" style={editorLinkStyle}>
                Read semantic types documentation →
              </Link>
            </div>
          )}
        </aside>

        <main style={{ overflowY: 'auto', padding: '20px 24px' }}>
          <header style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: siteTheme.textMuted }}>
              Gallery / {selectedCategory === '__backend__' ? 'Backend suites' : category?.label}
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
              {selectedCategory === '__backend__' ? 'Backend test suites' : category?.label}
            </h1>
            <p style={{ margin: '6px 0 0', color: siteTheme.textMuted, fontSize: 14, maxWidth: 640 }}>
              Flint compiles table data + semantic types + a short chart spec into full Vega-Lite,
              ECharts, and Chart.js configs. Browse by chart type, then open any example in the live
              editor.
            </p>
            <p style={{ margin: '4px 0 0', color: siteTheme.textMuted, fontSize: 12 }}>
              {loading ? 'Loading examples…' : `${totalCases} example${totalCases === 1 ? '' : 's'}`}
            </p>
          </header>

          {loading && (
            <p style={{ color: siteTheme.textMuted, fontSize: 14 }}>Loading examples…</p>
          )}

          {!loading &&
            sections.map(({ name, tests }) => (
              <div key={name} style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    margin: '0 0 12px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: siteTheme.textMuted,
                  }}
                >
                  {name}
                </h2>
                {tests.map((t, i) => (
                  <article
                    key={`${name}-${i}`}
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
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t.title}</h3>
                      <a href={buildGalleryEditorHref(name, i)} style={editorLinkStyle}>
                        View this example in the online editor
                      </a>
                    </div>
                    <p style={{ margin: '0 0 12px', color: siteTheme.textMuted, fontSize: 13 }}>
                      {t.description}
                    </p>
                    <LazyTripleChart testCase={t} />
                  </article>
                ))}
              </div>
            ))}

          {!loading && sections.length === 0 && (
            <p style={{ color: siteTheme.textMuted }}>No examples in this category yet.</p>
          )}
        </main>
      </div>
    </SiteShell>
  );
}

function SidebarItem({
  active,
  glyph,
  label,
  onClick,
}: {
  active: boolean;
  glyph: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '6px 16px',
        border: 0,
        textAlign: 'left',
        background: active ? siteTheme.accentBg : 'transparent',
        color: active ? siteTheme.accent : siteTheme.text,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      <span
        style={{
          width: 18,
          textAlign: 'center',
          fontSize: 12,
          color: active ? siteTheme.accent : siteTheme.textMuted,
        }}
      >
        {glyph}
      </span>
      {label}
    </button>
  );
}

const editorLinkStyle: CSSProperties = {
  color: siteTheme.accent,
  fontSize: 12,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
