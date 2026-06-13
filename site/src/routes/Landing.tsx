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

/**
 * Front page — flat "paper" look inspired by Microsoft data-formulator: a
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
          <h1 style={heroTitleStyle}>Flint</h1>
          <p style={taglineStyle}>
            A Visualization Library for AI Agents and Humans
          </p>
          <p style={leadStyle}>
            Describe what your data means, and Flint draws the chart for you. Flint
            is a small, high-level language for charts: you write a few lines — what
            each field means, and which field goes on which channel — and Flint takes
            care of the rest: scales, axes, legends, colors, and layout. The same
            description renders with <strong>Vega-Lite</strong>,{' '}
            <strong>Apache ECharts</strong>, or <strong>Chart.js</strong>, so you
            never have to touch their low-level settings.
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
    label: 'Line chart',
    caption: 'A line per category: time across the bottom, a value up the side.',
    generator: 'Line Chart',
    index: 1,
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    caption: 'A heatmap. Flint reads the values and picks a color scale that fits.',
    generator: 'Heatmap',
    index: 0,
  },
  {
    id: 'stretch',
    label: 'Dense categories',
    caption: 'Lots of categories — Flint widens the layout so the bars and labels still breathe.',
    generator: 'Bar Chart',
    index: 1,
  },
  {
    id: 'advanced',
    label: 'Sunburst',
    caption: 'A sunburst: a richer, nested chart from the very same short spec.',
    generator: 'ECharts: Sunburst',
    index: 2,
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

  return (
    <section style={{ ...sectionStyle, paddingTop: 8 }}>
      <div style={showcaseCardStyle}>
        <div style={showcasePaneStyle}>
          <div style={paneLabelStyle}>Flint spec</div>
          <FlintSpecCode testCase={testCase} />
        </div>

        <div style={{ ...showcasePaneStyle, borderLeft: `1px solid ${HAIRLINE}` }}>
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
            <ScaleToFit height={300} padding={6}>
              <WallChart testCase={testCase} backend={backend} />
            </ScaleToFit>
          </div>
        </div>
      </div>

      {/* Example pager */}
      <div style={dotsRowStyle} role="tablist" aria-label="Example">
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
      <p style={showcaseCaptionStyle}>{example.caption}</p>
    </section>
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
      'Most libraries guess what your numbers mean from how they look — and they often ' +
      'guess wrong. Flint lets you say it outright: this measure adds up, this one does ' +
      'not; these are real dates, not plain integers. With that in hand, it can pick the ' +
      'right scale, baseline, and number format every time.',
  },
  {
    title: 'Short specs, finished charts',
    body:
      'Name a chart type and map a few fields to channels — that is the whole spec. Flint ' +
      'works out the scales, axes, legends, colors, and spacing for you, following ' +
      'well-worn visualization rules, so your charts come out looking right without fiddling.',
  },
  {
    title: 'Render anywhere',
    body:
      'Flint sits a level above any single charting library. Write a chart once, then render ' +
      'it with Vega-Lite, Apache ECharts, or Chart.js — and switch between them whenever you ' +
      'like, without rewriting a thing.',
  },
  {
    title: 'Easy to write, easy to change',
    body:
      'A Flint spec is short and says what it means, so an AI agent can write one from a ' +
      'question and a table and get a good chart back. Edits stay small, too — a quick tweak ' +
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
  // Faint, flat grid — texture without depth (data-formulator paper look).
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
  fontSize: 80,
  lineHeight: 1.05,
  margin: '0 0 14px',
  fontWeight: 300,
  letterSpacing: '0.04em',
};

const taglineStyle: CSSProperties = {
  fontSize: 24,
  color: siteTheme.textMuted,
  fontWeight: 400,
  margin: '0 auto 16px',
  maxWidth: 680,
  lineHeight: 1.4,
};

const leadStyle: CSSProperties = {
  fontSize: 17,
  color: siteTheme.textMuted,
  lineHeight: 1.65,
  margin: '0 auto',
  maxWidth: 680,
};

const ctaRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 28,
  flexWrap: 'wrap',
  justifyContent: 'center',
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

const dotsRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  marginTop: 16,
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
