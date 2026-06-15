import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  TEST_GENERATORS,
  makeField,
  makeEncodingItem,
  buildMetadata,
  type TestCase,
} from 'flint-chart/test-data';
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
        <section style={{ ...sectionStyle, paddingTop: 72, paddingBottom: 24 }}>
          <h1 style={heroTitleStyle}>Flint: A Visualization Library for AI Agents and Humans</h1>

          <div style={leadColumnsStyle}>
            <div style={leadTextColStyle}>
              <p style={leadStyle}>{LEAD_INTRO}</p>

              <p style={installLineStyle}>
                <code style={codeStyle}>npm install flint-chart</code> · MIT licensed
              </p>
            </div>

            <div style={leadButtonsColStyle}>
              <div style={actionBoxStyle}>
                <span style={actionBoxLabelStyle}>Get started</span>
                <Link to="/wall" style={heroPrimaryBtn}>
                  Browse the gallery
                </Link>
                <Link to="/editor" style={heroSecondaryBtn}>
                  Try online
                </Link>
                <Link to="/documentation/overview" style={heroSecondaryBtn}>
                  Documentation
                </Link>
                <a href={GITHUB_REPO} style={heroSecondaryBtn} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </div>
            </div>
          </div>
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

        {/* ---- Feature cards (alternating text / visual) -------------- */}
        <section style={sectionStyle}>
          <div style={featureRowsStyle}>
            {FEATURES.map((feature, i) => (
              <article key={feature.title} style={featureRowStyle(i % 2 === 1)}>
                <div style={featureTextColStyle}>
                  <h2 style={featureTitleStyle}>{feature.title}</h2>
                  <p style={featureBodyStyle}>{feature.body}</p>
                  {feature.example && (
                    <p style={featureExampleStyle}>
                      <span style={featureExampleLabelStyle}>e.g.</span> {feature.example}
                    </p>
                  )}
                </div>
                {feature.demo && (
                  <div style={featureVisualColStyle}>
                    <FeatureDemoView build={feature.demo} />
                  </div>
                )}
              </article>
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
/* Feature section copy                                                */
/*                                                                     */
/* Edit the plain-text strings below to rewrite the landing copy. The  */
/* intro paragraph and each feature's title/body are kept here as      */
/* simple strings so they can be reworded without touching any JSX.    */
/* ------------------------------------------------------------------ */

// Lead paragraph shown in the hero (the single intro to Flint).
const LEAD_INTRO =
  'Flint helps AI agents and humans create good-looking, adaptable visualizations from simple specifications. ' +
  'Instead of asking the user to provide verbose low-level parameters such as scales, axes, steps, and layout, ' +
  'the Flint compiler automatically derives optimized low-level settings from the semantic types and physical ' +
  'characteristics of the data, guided by the desired chart type and encodings. ' +
  'This way, users get a clear, informative chart from a concise specification.';

interface Feature {
  title: string;
  body: string;
  // Optional concrete example rendered as a callout beneath the body.
  example?: string;
  // Before/after demo shown alongside the text, illustrating the feature.
  demo?: () => FeatureDemoConfig;
}

const FEATURES: Feature[] = [
  {
    title: 'Specify with semantic types',
    body:
      'Flint employs semantic types to that capture what each data field means ' +
      '(e.g., Revenue, Rank, YearMonth, Temperature) to guide the chart configuration. ' +
      'Flint automatically derives the right parsing, scale, axes, formatting (e.g., temporal granularity), and color (e.g., diverging vs. sequential schemes) to produce a well-formed chart.',
    example:
      'Flint automatically configures the x-axis axes temporal granularity as Year-Month with temporal axis and diverging color scheme centered at 0 to optimize the visualization ofa heatmap representing month x week x profit based on data sematnic types',
    demo: demoSemanticTypes,
  },
  {
    title: 'Automatic layout optimization',
    body:
      'Flint optimizes the chart layout based on the chart speficiation and data characteristics based on an elastic layout model and banking principles.' + 
      'Given the desired chart dimensions and allowed canvas sizes, the compiler dynamically manages sizing, spacing, and arrangement so the chart nicely fits into the canvas with principled layout decisions.',
    example:
      'A desnse bar chart with 80 items trades stretches the canvas size and reduces it\'s band width so it fits the canvas nicely, similar to how springs fit into expandable containers.',
    demo: demoLayout,
  },
  {
    title: 'Easy to generate and adapt',
    body:
      'Without fragile low-level parameters in the chart specification, Flint specs can be easily ' +
      'generated by AI agents and adapted by users. Changing a chart design requires only switching ' +
      'the chart type and rebinding visual encodings, and the compiler automatically cascades the new ' +
      'encoding choices to the low-level settings.',
    example:
      'When switching from a faceted line chart to a waterfall chart, the user only needs to update the visual encodings and the compiler automatically derives the new low-level paramters, despite the compiled chart spec are radically different.',
    demo: demoAdapt,
  },
  {
    title: 'Render with different backends',
    body:
      'Write a chart once and render it with different backends. Flint currently supports 34 chart types across Vega-Lite, ECharts, and Chart.js. Despite their different APIs and ' +
      'programming models, Flint hides them behind a unified interface. The user can easily choose the desirable ' +
      'backend and leverage its unique features.',
    example:
      'Vega-Lite has no native sunburst support, but it\'s easy to turn a grouped bar chart into sunburst using Flint and render it with ECharts.',
    demo: demoBackends,
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
/* Feature before/after demos                                          */
/* ------------------------------------------------------------------ */

type DemoStage =
  | { kind: 'spec'; label: string; testCase: TestCase }
  | { kind: 'chart'; label: string; testCase: TestCase; backend: PreviewBackend };

interface FeatureDemoConfig {
  before: DemoStage;
  after: DemoStage;
}

/** First test case for an Omni generator key. */
function omni(key: string): TestCase {
  return TEST_GENERATORS[key]!()[0];
}

/** Clone a test case, changing only its chart type (encodings preserved). */
function asChartType(base: TestCase, chartType: string): TestCase {
  return { ...base, chartType };
}

/** A synthetic grouped bar chart with `nCats` categories × `nGroups` series (for layout demos). */
function synthGroupedBar(nCats: number, nGroups: number, title: string): TestCase {
  const series = Array.from({ length: nGroups }, (_, g) => 'Series ' + String.fromCharCode(65 + g));
  const data: Array<Record<string, unknown>> = [];
  for (let i = 0; i < nCats; i++) {
    const item = 'G' + String(i + 1).padStart(2, '0');
    for (let g = 0; g < nGroups; g++) {
      data.push({
        item,
        series: series[g],
        value: Math.round(20 + 55 * Math.abs(Math.sin(i * 0.9 + g * 1.7 + 0.5))),
      });
    }
  }
  return {
    title,
    description: '',
    tags: [],
    chartType: 'Grouped Bar Chart',
    data,
    fields: [makeField('item'), makeField('series'), makeField('value')],
    metadata: buildMetadata(data),
    encodingMap: {
      x: makeEncodingItem('item'),
      y: makeEncodingItem('value'),
      color: makeEncodingItem('series'),
      group: makeEncodingItem('series'),
    },
  };
}

// Card 1: the same spec compiles to a chart (data spec / semantic types highlighted).
function demoSemanticTypes(): FeatureDemoConfig {
  const tc = omni('Omni: Heatmap');
  return {
    before: { kind: 'spec', label: 'Flint spec', testCase: tc },
    after: { kind: 'chart', label: 'Compiled chart', testCase: tc, backend: 'vegalite' },
  };
}

// Card 2: same grouped-bar spec, more categories — the layout adapts from sparse to dense.
function demoLayout(): FeatureDemoConfig {
  return {
    before: { kind: 'chart', label: 'Sparse · 5 × 3', testCase: synthGroupedBar(5, 3, 'Sparse grouped bar'), backend: 'vegalite' },
    after: { kind: 'chart', label: 'Dense · 22 × 3', testCase: synthGroupedBar(22, 3, 'Dense grouped bar'), backend: 'vegalite' },
  };
}

// Card 3: same encoding, different chart type — a bar chart becomes a waterfall.
function demoAdapt(): FeatureDemoConfig {
  const wf = omni('Omni: Waterfall');
  return {
    before: { kind: 'chart', label: 'Bar chart', testCase: asChartType(wf, 'Bar Chart'), backend: 'vegalite' },
    after: { kind: 'chart', label: 'Waterfall', testCase: wf, backend: 'vegalite' },
  };
}

// Card 4: a Vega-Lite faceted bar and an ECharts sunburst of the same story.
function demoBackends(): FeatureDemoConfig {
  const line = omni('Omni: Line');
  const sun = omni('Omni: Sunburst');
  return {
    before: { kind: 'chart', label: 'Vega-Lite faceted bar', testCase: asChartType(line, 'Bar Chart'), backend: 'vegalite' },
    after: { kind: 'chart', label: 'ECharts sunburst', testCase: sun, backend: 'echarts' },
  };
}

/** Pick the requested backend, or the first one that supports the chart type. */
function pickBackend(t: TestCase, want: PreviewBackend): PreviewBackend {
  const supported = getSupportedBackends(t.chartType);
  return supported.includes(want) ? want : supported[0] ?? 'vegalite';
}

/** A Flint spec with the data spec (semantic types) block color-highlighted. */
function HighlightedFlintSpec({ testCase }: { testCase: TestCase }) {
  const lines = useMemo(() => {
    const json = JSON.stringify(testCaseToFlintSummary(testCase), null, 2);
    const all = json.split('\n');
    // Mark the lines that make up the "semantic_types" (data spec) block.
    let start = -1;
    let end = all.length - 1;
    let depth = 0;
    let opened = false;
    for (let i = 0; i < all.length; i++) {
      if (start === -1 && all[i].includes('"semantic_types"')) start = i;
      if (start !== -1 && i >= start) {
        for (const ch of all[i]) {
          if (ch === '{') {
            depth++;
            opened = true;
          } else if (ch === '}') depth--;
        }
        if (opened && depth === 0) {
          end = i;
          break;
        }
      }
    }
    return all.map((text, i) => ({ text, hot: start !== -1 && i >= start && i <= end }));
  }, [testCase]);

  return (
    <pre style={demoSpecPreStyle}>
      {lines.map((ln, i) => (
        <div key={i} style={ln.hot ? demoSpecHotLineStyle : undefined}>
          {ln.text || ' '}
        </div>
      ))}
    </pre>
  );
}

/** The visual content of a single demo stage (a highlighted spec or a chart). */
function DemoStageContent({ stage }: { stage: DemoStage }) {
  if (stage.kind === 'spec') {
    return <HighlightedFlintSpec testCase={stage.testCase} />;
  }
  return (
    <ScaleToFit height={250} padding={6}>
      <WallChart testCase={stage.testCase} backend={pickBackend(stage.testCase, stage.backend)} />
    </ScaleToFit>
  );
}

/**
 * Two overlapping cards in fixed positions. The "before" state sits at the
 * top-left, the "after" state sits at the bottom-right and is shown in front
 * by default. Hovering (or focusing / tapping) a card raises that card in
 * front of the other one, without moving either card; with nothing hovered
 * the "after" card stays in front.
 */
function FeatureDemoView({ build }: { build: () => FeatureDemoConfig }) {
  const demo = useMemo(() => build(), [build]);
  const [hovered, setHovered] = useState<'top' | 'bottom' | null>(null);

  // Slot in front: the hovered card, or the "after" (bottom) card by default.
  const frontSlot: 'top' | 'bottom' = hovered ?? 'bottom';

  const cardHandlers = (slot: 'top' | 'bottom') => ({
    tabIndex: 0,
    onMouseEnter: () => setHovered(slot),
    onMouseLeave: () => setHovered((h) => (h === slot ? null : h)),
    onFocus: () => setHovered(slot),
    onBlur: () => setHovered((h) => (h === slot ? null : h)),
    onClick: () => setHovered(slot),
  });

  return (
    <div style={featureStackStyle} role="group" aria-label={`Compare ${demo.after.label} with ${demo.before.label}`}>
      <div
        style={{ ...featureStackCardStyle, ...stackCardPos('bottom'), ...stackCardEmphasis(frontSlot === 'bottom') }}
        aria-hidden={frontSlot !== 'bottom'}
        title={demo.after.label}
        {...cardHandlers('bottom')}
      >
        <span style={stackBadgeStyle}>{demo.after.label}</span>
        <DemoStageContent stage={demo.after} />
      </div>
      <div
        style={{ ...featureStackCardStyle, ...stackCardPos('top'), ...stackCardEmphasis(frontSlot === 'top') }}
        aria-hidden={frontSlot !== 'top'}
        title={demo.before.label}
        {...cardHandlers('top')}
      >
        <span style={stackBadgeStyle}>{demo.before.label}</span>
        <DemoStageContent stage={demo.before} />
      </div>
    </div>
  );
}

/** Fixed resting position for a stacked card. The position never changes on hover. */
function stackCardPos(slot: 'top' | 'bottom'): CSSProperties {
  return slot === 'top'
    ? { transform: 'translate(0px, 0px) rotate(0deg)' }
    : { transform: `translate(${PEEK}px, ${PEEK}px) rotate(1.4deg)` };
}

/** Emphasis for the active (front) vs. inactive (behind) card. Position is unchanged. */
function stackCardEmphasis(active: boolean): CSSProperties {
  return active
    ? { opacity: 1, filter: 'none', zIndex: 3, boxShadow: SOFT_SHADOW }
    : { opacity: 0.9, filter: 'brightness(0.97) saturate(0.95)', zIndex: 1, boxShadow: FLAT_SHADOW };
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
  margin: '0 0 22px',
  maxWidth: 760,
  fontWeight: 300,
  letterSpacing: '0.01em',
};

const leadColumnsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 56,
  flexWrap: 'wrap',
};

const leadTextColStyle: CSSProperties = {
  flex: '1 1 420px',
  minWidth: 0,
};

const leadButtonsColStyle: CSSProperties = {
  flex: '0 0 auto',
  width: 240,
  display: 'flex',
  flexDirection: 'column',
};

// A clear, bordered "action box" grouping the four CTAs (Vega-Lite-style
// sidebar feel). The buttons inside are intentionally muted so the box, not any
// single button, reads as the action area.
const actionBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 14,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: NEUTRAL_FILL,
};

const actionBoxLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
  margin: '0 0 2px 2px',
};

const leadStyle: CSSProperties = {
  fontSize: 17,
  color: siteTheme.textMuted,
  lineHeight: 1.65,
  margin: 0,
  fontWeight: 300,
};

const installLineStyle: CSSProperties = {
  margin: '18px 0 0',
  color: siteTheme.textMuted,
  fontSize: 13,
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

const showcaseIntroStyle: CSSProperties = {
  maxWidth: 720,
  margin: '0 0 20px',
};

const showcaseHeadingStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 500,
  margin: '0 0 10px',
  letterSpacing: '0.01em',
};

const showcaseIntroTextStyle: CSSProperties = {
  fontSize: 15.5,
  color: siteTheme.textMuted,
  lineHeight: 1.65,
  margin: 0,
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

const featureRowsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 64,
};

// Alternating two-column rows (data-formulator style): text on one side, a live
// chart on the other, flipping each row. Wraps to a single column on narrow
// viewports.
function featureRowStyle(reverse: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: reverse ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 48,
    flexWrap: 'wrap',
  };
}

const featureTextColStyle: CSSProperties = {
  flex: '1 1 320px',
  minWidth: 280,
};

const featureVisualColStyle: CSSProperties = {
  flex: '1 1 380px',
  minWidth: 300,
};

// Overlapping before/after cards (Halden-style fan on hover).
const PEEK = 64;
const SOFT_SHADOW = '0 10px 30px rgba(0, 0, 0, 0.13)';
const FLAT_SHADOW = '0 1px 2px rgba(0, 0, 0, 0.05)';
const cardTransition = 'opacity 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease';

const featureStackStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr',
  cursor: 'pointer',
  outline: 'none',
  // Reserve room for the peeking corner and the slight hover rotation.
  padding: 10,
  paddingRight: PEEK + 12,
  paddingBottom: PEEK + 12,
};

const featureStackCardStyle: CSSProperties = {
  gridArea: '1 / 1',
  position: 'relative',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
  padding: '12px 14px',
  overflow: 'hidden',
  transition: cardTransition,
  willChange: 'opacity',
};

const stackBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 10,
  zIndex: 2,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: siteTheme.textMuted,
  background: 'rgba(255, 255, 255, 0.86)',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 999,
  padding: '2px 8px',
  pointerEvents: 'none',
};

// Flint spec shown in a demo viewport, with the data spec block highlighted.
const demoSpecPreStyle: CSSProperties = {
  margin: 0,
  padding: '2px 4px',
  fontFamily: siteTheme.fontMono,
  fontSize: 12,
  lineHeight: 1.5,
  color: siteTheme.text,
  background: PAPER,
  maxHeight: 300,
  overflow: 'auto',
};

const demoSpecHotLineStyle: CSSProperties = {
  background: siteTheme.accentBg,
  boxShadow: `inset 2px 0 0 ${siteTheme.accent}`,
  color: siteTheme.text,
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

const featureExampleStyle: CSSProperties = {
  margin: '12px 0 0',
  paddingLeft: 12,
  borderLeft: `2px solid ${HAIRLINE}`,
  fontSize: 14,
  lineHeight: 1.6,
  color: siteTheme.textMuted,
};

const featureExampleLabelStyle: CSSProperties = {
  fontStyle: 'italic',
  fontWeight: 600,
  color: siteTheme.text,
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

// Hero CTA buttons stack inside the action box (Vega-Lite-style sidebar): block,
// full-width, centred label, and intentionally muted so the box reads as one
// clear action area rather than a row of loud buttons.
const heroBtnBlock: CSSProperties = {
  display: 'block',
  width: '100%',
  margin: 0,
  textAlign: 'center',
  boxSizing: 'border-box',
  padding: '9px 16px',
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
};

const heroPrimaryBtn: CSSProperties = {
  ...heroBtnBlock,
  background: siteTheme.accentBg,
  color: siteTheme.accent,
  border: `1px solid rgba(0, 120, 212, 0.4)`,
  fontWeight: 600,
};

const heroSecondaryBtn: CSSProperties = {
  ...heroBtnBlock,
  background: PAPER,
  color: siteTheme.textMuted,
  border: `1px solid ${HAIRLINE}`,
};
