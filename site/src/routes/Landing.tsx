import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { TEST_GENERATORS, type TestCase } from 'flint-chart/test-data';
import { SiteNavBar, MicrosoftDisclosures } from '../components/SiteShell';
import { WallChart } from '../components/WallChart';
import { ScaleToFit } from '../components/ScaleToFit';
import { testCaseToFlintSummary } from '../shared/test-case-utils';
import {
  ALL_BACKENDS,
  BACKEND_LABELS,
  getSupportedBackends,
  type PreviewBackend,
} from '../shared/supported-backends';
import { GITHUB_REPO, siteTheme } from '../shared/theme';
import overviewImg from '../assets/flint-overview.png';

/**
 * Front page: flat "paper" look inspired by Microsoft data-formulator. A
 * paper-white canvas with a faint grid, hairline borders, and no drop shadows.
 * Copy is written to read plainly, with one interactive spec→chart example.
 */
export function Landing() {
  return (
    <div style={pageStyle}>
      <SiteNavBar flush />

      <main style={mainStyle}>
        {/* ---- Hero ------------------------------------------------------ */}
        <section style={{ ...sectionStyle, textAlign: 'center', paddingTop: 72, paddingBottom: 24 }}>
          <h1 style={heroTitleStyle}>Flint: A Visualization Library for AI Agents and Humans</h1>
          <p style={leadStyle}>
            Flint lets you specify high-level visualization intent through a simple
            chart spec, while its compiler automatically infers and optimizes the
            low-level chart parameters for you, producing good-looking charts that are
            easily adaptable. As an intermediate language, Flint lets the user (both
            humans and AI agents) use the same simple visualization spec to compile to
            different rendering engines (currently <strong>Vega-Lite</strong>,{' '}
            <strong>ECharts</strong>, and <strong>Chart.js</strong>).
          </p>

          <div style={ctaRowStyle}>
            <Link to="/wall" style={primaryBtn}>
              Browse the gallery
            </Link>
            <Link to="/editor" style={secondaryBtn}>
              Try online
            </Link>
            <Link to="/documentation/overview" style={secondaryBtn}>
              Documentation
            </Link>
            <a href={GITHUB_REPO} style={secondaryBtn} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>

          <p style={{ marginTop: 18, color: siteTheme.textMuted, fontSize: 13 }}>
            <code style={codeStyle}>npm install flint-chart</code> · MIT licensed
          </p>
        </section>

        {/* ---- Overview figure (paper teaser) -------------------------- */}
        {/* Hidden for now
        <section style={overviewSectionStyle}>
          <figure style={overviewFigureStyle}>
            <img
              src={overviewImg}
              alt="Flint workflow: an agent infers a dataSpec from a raw table, a short chartSpec is written, and Flint compiles it into a faceted line chart, then a grouped bar, waterfall, heatmap, and sunburst as the spec is edited."
              style={overviewImgStyle}
            />
            <figcaption style={overviewCaptionStyle}>
              One workflow, end to end. An agent infers a dataSpec from the raw table
              (what each field means and how it behaves), you write a short chartSpec,
              and Flint compiles it into a polished chart. Change a line of the spec to
              move between a faceted line chart, grouped bar, waterfall, heatmap, or
              sunburst, or switch the rendering engine, all without touching the
              low-level details.
            </figcaption>
          </figure>
        </section>
        */}

        {/* ---- Interactive example: spec -> chart ---------------------- */}
        <HeroShowcase />

        {/* ---- Feature grid (text only) -------------------------------- */}
        <section style={sectionStyle}>
          <div style={featureGridStyle}>
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <h2 style={featureTitleStyle}>{feature.title}</h2>
                <p style={featureBodyStyle}>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Closing CTA ---------------------------------------------- */}
        <section style={{ ...sectionStyle, paddingBottom: 72 }}>
          <div style={closingCardStyle}>
            <h2 style={{ fontSize: 26, margin: '0 0 8px', fontWeight: 500 }}>
              Less spec, clearer charts.
            </h2>
            <p style={{ margin: '0 0 22px', color: siteTheme.textMuted, fontSize: 16, lineHeight: 1.6 }}>
              Browse the gallery for dozens of chart types, or open any example in
              the editor and watch the Flint spec compile across all three backends.
            </p>
            <div style={{ ...ctaRowStyle, marginTop: 0 }}>
              <Link to="/wall" style={primaryBtn}>
                Browse the gallery
              </Link>
              <Link to="/editor" style={secondaryBtn}>
                Try online
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MicrosoftDisclosures />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive showcase                                                */
/* ------------------------------------------------------------------ */

interface ShowcaseExample {
  id: string;
  label: string;
  caption: string;
  generator: string;
  index: number;
}

const SHOWCASE_EXAMPLES: ShowcaseExample[] = [
  {
    id: 'line',
    label: 'Faceted line chart',
    caption:
      'One small multiple per region. From a four-line spec, Flint reads the month field as a ' +
      'date, lays out the panels, and keeps the axes, scales, and colors in sync across them.',
    generator: 'Omni: Line',
    index: 0,
  },
  {
    id: 'heatmap',
    label: 'Diverging heatmap',
    caption:
      'Net new users can be positive or negative, so Flint picks a diverging color scale ' +
      'centered at zero instead of a plain gradient. Same data, read correctly.',
    generator: 'Omni: Heatmap',
    index: 0,
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    caption:
      'A running total that separates gains from losses. Flint works out the baselines and the ' +
      'up and down coloring from the spec, so the monthly steps add up on their own.',
    generator: 'Omni: Waterfall',
    index: 0,
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    caption:
      'The same short spec composes a three-level hierarchy (region, gameType, game). Vega-Lite ' +
      'has no native sunburst, so switch the engine to ECharts and the chart still renders.',
    generator: 'Omni: Sunburst',
    index: 0,
  },
];

function HeroShowcase() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [selectedBackend, setSelectedBackend] = useState<PreviewBackend>('vegalite');

  const example = SHOWCASE_EXAMPLES[exampleIdx];
  const testCase = useTestCase(example.generator, example.index);
  const supported = useMemo(
    () => (testCase ? getSupportedBackends(testCase.chartType) : []),
    [testCase],
  );
  // Keep the chosen backend when the new example supports it; otherwise fall
  // back to that example's first available backend.
  const backend = supported.includes(selectedBackend) ? selectedBackend : supported[0] ?? 'vegalite';

  if (!testCase) return null;

  const count = SHOWCASE_EXAMPLES.length;
  const goPrev = () => setExampleIdx((i) => (i - 1 + count) % count);
  const goNext = () => setExampleIdx((i) => (i + 1) % count);

  return (
    <section style={{ ...sectionStyle, paddingTop: 8 }}>
      <div style={carouselRowStyle}>
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous example"
          title="Previous example"
          style={pagerArrowStyle}
        >
          <ChevronIcon dir="left" />
        </button>

        <div style={{ ...showcaseCardStyle, flex: 1, minWidth: 0 }}>
          <div style={showcasePaneStyle}>
            <div style={paneLabelStyle}>Flint spec</div>
            <FlintSpecCode testCase={testCase} />
          </div>

          <div style={{ ...showcasePaneStyle, ...chartPaneStyle, borderLeft: `1px solid ${HAIRLINE}` }}>
            <div style={paneHeaderRowStyle}>
              <span style={paneLabelStyle}>Compiled chart</span>
              <div style={backendToggleStyle} role="tablist" aria-label="Rendering backend">
                {ALL_BACKENDS.map((b) => {
                  const isSupported = supported.includes(b);
                  const active = b === backend;
                  return (
                    <button
                      key={b}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={!isSupported}
                      onClick={() => setSelectedBackend(b)}
                      title={isSupported ? `Render with ${BACKEND_LABELS[b]}` : `${BACKEND_LABELS[b]} doesn’t support this chart`}
                      style={backendBtnStyle(active, isSupported)}
                    >
                      {BACKEND_LABELS[b]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '4px 12px 14px' }}>
              <ScaleToFit height={360} minHeight={236} padding={6} adaptiveHeight>
                <WallChart testCase={testCase} backend={backend} />
              </ScaleToFit>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next example"
          title="Next example"
          style={pagerArrowStyle}
        >
          <ChevronIcon dir="right" />
        </button>
      </div>

      {/* Example pager dots */}
      <div style={{ ...dotsRowStyle, marginTop: 16 }} role="tablist" aria-label="Example">
        {SHOWCASE_EXAMPLES.map((ex, i) => (
          <button
            key={ex.id}
            type="button"
            role="tab"
            aria-selected={i === exampleIdx}
            aria-label={ex.label}
            title={ex.label}
            onClick={() => setExampleIdx(i)}
            style={dotStyle(i === exampleIdx)}
          />
        ))}
      </div>
      <p style={showcaseCaptionStyle}>
        <strong style={{ color: siteTheme.text, fontWeight: 600 }}>{example.label}.</strong>{' '}
        {example.caption}
      </p>
    </section>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlintSpecCode({ testCase }: { testCase: TestCase }) {
  const text = useMemo(() => JSON.stringify(testCaseToFlintSummary(testCase), null, 2), [testCase]);
  return <pre style={specPreStyle}>{text}</pre>;
}

/* ------------------------------------------------------------------ */
/* Feature data                                                        */
/* ------------------------------------------------------------------ */

interface Feature {
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    title: 'Say what your data means',
    body:
      'Most libraries guess what your numbers mean from how they look, and they often ' +
      'guess wrong. Flint lets you say it outright: this measure adds up, this one does ' +
      'not; these are real dates, not plain integers. With that in hand, it can pick the ' +
      'right scale, baseline, and number format every time.',
  },
  {
    title: 'Short specs, finished charts',
    body:
      'Name a chart type and map a few fields to channels, and that is the whole spec. Flint ' +
      'works out the scales, axes, legends, colors, and spacing for you, following ' +
      'well-worn visualization rules, so your charts come out looking right without fiddling.',
  },
  {
    title: 'Render anywhere',
    body:
      'Flint sits a level above any single charting library. Write a chart once, then render ' +
      'it with Vega-Lite, ECharts, or Chart.js, and switch between them whenever you ' +
      'like, without rewriting a thing.',
  },
  {
    title: 'Easy to write, easy to change',
    body:
      'A Flint spec is short and says what it means, so an AI agent can write one from a ' +
      'question and a table and get a good chart back. Edits stay small, too: a quick tweak ' +
      'instead of untangling a wall of low-level options.',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function useTestCase(generator: string, index = 0): TestCase | null {
  return useMemo(() => {
    const gen = TEST_GENERATORS[generator];
    if (!gen) return null;
    try {
      const all = gen();
      return all[index] ?? all[0] ?? null;
    } catch {
      return null;
    }
  }, [generator, index]);
}

/* ------------------------------------------------------------------ */
/* Flat "paper" tokens (front page)                                    */
/* ------------------------------------------------------------------ */

const PAPER = '#ffffff';
const HAIRLINE = 'rgba(0, 0, 0, 0.10)';
const NEUTRAL_FILL = 'rgba(0, 0, 0, 0.04)';
const GRID_LINE = 'rgba(0, 0, 0, 0.02)';

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: siteTheme.fontSans,
  color: siteTheme.text,
  background: PAPER,
};

const mainStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  // Faint, flat grid for texture without depth (data-formulator paper look).
  backgroundImage: `
    linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px),
    linear-gradient(0deg, ${GRID_LINE} 1px, transparent 1px)
  `,
  backgroundSize: '24px 24px',
};

const sectionStyle: CSSProperties = {
  maxWidth: 1040,
  margin: '0 auto',
  padding: '40px 24px',
  width: '100%',
  boxSizing: 'border-box',
};

const heroTitleStyle: CSSProperties = {
  fontSize: 38,
  lineHeight: 1.18,
  margin: '0 auto 18px',
  maxWidth: 800,
  fontWeight: 300,
  letterSpacing: '0.01em',
};

const leadStyle: CSSProperties = {
  fontSize: 16,
  color: siteTheme.textMuted,
  lineHeight: 1.65,
  margin: '0 auto',
  maxWidth: 800,
};

const ctaRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 28,
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const overviewSectionStyle: CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '16px 24px 8px',
  width: '100%',
  boxSizing: 'border-box',
};

const overviewFigureStyle: CSSProperties = {
  margin: 0,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
  padding: 16,
};

const overviewImgStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
};

const overviewCaptionStyle: CSSProperties = {
  margin: '14px auto 0',
  maxWidth: 760,
  textAlign: 'center',
  color: siteTheme.textMuted,
  fontSize: 13.5,
  lineHeight: 1.6,
};

const showcaseCardStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
  overflow: 'hidden',
};

const showcasePaneStyle: CSSProperties = {
  flex: '1 1 360px',
  minWidth: 300,
  display: 'flex',
  flexDirection: 'column',
};

/** The compiled-chart pane gets extra width so wide charts render larger. */
const chartPaneStyle: CSSProperties = {
  flex: '1.35 1 440px',
};

const paneHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  paddingRight: 10,
};

const paneLabelStyle: CSSProperties = {
  padding: '10px 14px 2px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
};

const backendToggleStyle: CSSProperties = {
  display: 'inline-flex',
  gap: 2,
  padding: 2,
  marginTop: 6,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
};

function backendBtnStyle(active: boolean, supported: boolean): CSSProperties {
  return {
    padding: '4px 10px',
    border: 0,
    borderRadius: 4,
    background: active ? siteTheme.accent : 'transparent',
    color: active ? '#fff' : supported ? siteTheme.text : 'rgba(0,0,0,0.32)',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: supported ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
  };
}

const carouselRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const pagerArrowStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  padding: 0,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 999,
  background: PAPER,
  color: siteTheme.text,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const dotsRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
};

function dotStyle(active: boolean): CSSProperties {
  return {
    width: active ? 22 : 9,
    height: 9,
    padding: 0,
    border: 0,
    borderRadius: 999,
    background: active ? siteTheme.accent : 'rgba(0,0,0,0.18)',
    cursor: 'pointer',
    transition: 'width 0.15s ease, background 0.15s ease',
  };
}

const showcaseCaptionStyle: CSSProperties = {
  marginTop: 10,
  textAlign: 'center',
  color: siteTheme.textMuted,
  fontSize: 13.5,
};

const specPreStyle: CSSProperties = {
  margin: 0,
  padding: '4px 16px 16px',
  fontFamily: siteTheme.fontMono,
  fontSize: 12.5,
  lineHeight: 1.55,
  color: siteTheme.text,
  background: PAPER,
  overflowX: 'auto',
  flex: 1,
};

const featureGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '36px 48px',
};

const featureTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 500,
  margin: '0 0 10px',
};

const featureBodyStyle: CSSProperties = {
  fontSize: 16,
  color: siteTheme.textMuted,
  lineHeight: 1.7,
  margin: 0,
};

const closingCardStyle: CSSProperties = {
  textAlign: 'center',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
  padding: '40px 28px',
};

const codeStyle: CSSProperties = {
  background: NEUTRAL_FILL,
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: '0.9em',
  fontFamily: siteTheme.fontMono,
};

const primaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '11px 22px',
  background: siteTheme.accent,
  color: '#fff',
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14.5,
};

const secondaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '11px 22px',
  background: PAPER,
  color: siteTheme.text,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14.5,
};
