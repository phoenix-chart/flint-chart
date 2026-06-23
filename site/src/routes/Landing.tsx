import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react';
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
import { testCaseToFlintSummary, testCaseToAssemblyInput } from '../shared/test-case-utils';
import { buildGalleryEditorHref, openEditorWithPayload } from '../shared/editor-payload';
import { MOVIE_RATINGS } from './movie-ratings-data';
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
      <style>{landingInteractiveStyles}</style>
      <SiteNavBar flush />

      <main style={mainStyle}>
        {/* ---- Hero ------------------------------------------------------ */}
        <section style={{ ...sectionStyle, paddingTop: 72, paddingBottom: 24 }}>
          <h1 style={heroTitleStyle}>Flint: A Visualization Language for the AI Era</h1>

          <div style={leadColumnsStyle}>
            <div style={leadTextColStyle}>
              <p style={leadStyle}>{LEAD_INTRO}</p>

              <div style={installLinesStyle}>
                <div style={installLineStyle}>
                  <span style={promptMarkStyle}>&gt;</span> Install Flint with{' '}
                  <Link
                    to="/documentation/getting-started#javascript-typescript"
                    className="landing-skill-link"
                    style={installLineLinkStyle}
                  >
                    npm
                  </Link>{' '}
                  (TypeScript / JavaScript) or{' '}
                  <Link
                    to="/documentation/getting-started#python"
                    className="landing-skill-link"
                    style={installLineLinkStyle}
                  >
                    pip
                  </Link>{' '}
                  (Python).
                </div>
                <div style={installLineStyle}>
                  <span style={promptMarkStyle}>&gt;</span> To use Flint in agent workflows, check the{' '}
                  <Link
                    to="/documentation/agent-workflows#agent-skill-authoring"
                    className="landing-skill-link"
                    style={installLineLinkStyle}
                  >
                    agent skill
                  </Link>{' '}
                  or{' '}
                  <Link
                    to="/documentation/agent-workflows#mcp-server-execution"
                    className="landing-skill-link"
                    style={installLineLinkStyle}
                  >
                    MCP server
                  </Link>
                  .
                </div>
              </div>
            </div>

            <div style={leadButtonsColStyle}>
              <div style={actionBoxStyle}>
                <HeroActionLink href={GITHUB_REPO} label="GitHub" />
                <HeroActionLink to="/wall" label="Gallery" />
                <HeroActionLink to="/documentation/overview" label="Documentation" />
                <HeroActionLink href={`${GITHUB_REPO}/blob/main/agent-skills/flint-chart-author/SKILL.md`} label="Skill.md" />
                <HeroActionLink to="/editor" label="Editor" />
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

        {/* ---- Feature cards (alternating text / visual) -------------- */}
        <section style={sectionStyle}>
          <SectionDivider label="How it works" />
          <div style={featureRowsStyle}>
            {FEATURES.map((feature, i) => (
              <article key={feature.title} style={featureRowStyle(i % 2 === 1)}>
                <div style={featureTextColStyle}>
                  <h2 style={featureTitleStyle}>{feature.title}</h2>
                  <p style={featureBodyStyle}>{feature.body}</p>
                  {feature.example && (
                    <p style={featureExampleStyle} aria-label={`Example: ${feature.example}`}>
                      {feature.example}
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

        {/* ---- Interactive example: spec -> chart (below the demos) ---- */}
        <HeroShowcase />

        {/* ---- Closing CTA -------------------------------------------- */}
        <section style={{ ...sectionStyle, paddingBottom: 72, textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, margin: '0 0 8px', fontWeight: 500 }}>
            Start building with Flint.
          </h2>
          <p style={{ margin: '0 0 22px', color: siteTheme.textMuted, fontSize: 16, lineHeight: 1.6 }}>
            Open source and ready to use. Explore the gallery or jump straight into the editor.
          </p>
          <div style={{ ...ctaRowStyle, marginTop: 0, justifyContent: 'center' }}>
            <Link to="/editor" style={primaryBtn}>
              Open the editor
            </Link>
            <Link to="/wall" style={secondaryBtn}>
              Browse the gallery
            </Link>
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
  generator?: string;
  index?: number;
  /** Pre-built test case (for examples not backed by a gallery generator). */
  testCase?: TestCase;
  /** Optional canvas override; narrower widths force facet panels to wrap. */
  canvasSize?: { width: number; height: number };
}

/* ---- Chart-property examples (real data-formulator "movies" dataset) ---- */

// Film counts by MPAA rating across the full 3,201-row Vega movies corpus.
const MOVIE_MPAA: Array<[rating: string, films: number]> = [
  ['R', 1194],
  ['PG-13', 865],
  ['PG', 354],
  ['Not Rated', 94],
  ['G', 79],
  ['NC-17', 8],
];

/** Pie made into a donut purely by an `innerRadius` chart property. */
function moviesDonut(): TestCase {
  const data = MOVIE_MPAA.map(([Rating, Films]) => ({ Rating, Films }));
  return {
    title: 'Films by MPAA rating',
    description: '',
    tags: [],
    chartType: 'Pie Chart',
    data,
    fields: [makeField('Rating'), makeField('Films')],
    metadata: buildMetadata(data),
    encodingMap: { color: makeEncodingItem('Rating'), size: makeEncodingItem('Films') },
    chartProperties: { innerRadius: 50 },
  };
}

/** Scatter + fitted trend line via the `Regression` chart type. */
function moviesRegression(): TestCase {
  const data = MOVIE_RATINGS.map(([rt, imdb]) => ({
    'Rotten Tomatoes': rt,
    'IMDB Rating': imdb,
  }));
  return {
    title: 'Critic vs audience scores',
    description: '',
    tags: [],
    chartType: 'Regression',
    data,
    fields: [makeField('Rotten Tomatoes'), makeField('IMDB Rating')],
    metadata: buildMetadata(data),
    encodingMap: {
      x: makeEncodingItem('Rotten Tomatoes'),
      y: makeEncodingItem('IMDB Rating'),
    },
  };
}

// Film counts by major genre.
const MOVIE_GENRE: Array<[genre: string, films: number]> = [
  ['Drama', 789],
  ['Comedy', 675],
  ['Action', 420],
  ['Adventure', 274],
  ['Thriller/Suspense', 239],
  ['Horror', 219],
  ['Romantic Comedy', 137],
  ['Musical', 53],
  ['Documentary', 43],
  ['Black Comedy', 36],
  ['Western', 36],
];

/** Bars ordered by descending film count via a sort-by-measure (`-y`) override. */
function moviesSortedBar(): TestCase {
  const data = MOVIE_GENRE.map(([Genre, Films]) => ({ Genre, Films }));
  return {
    title: 'Films by genre (most to fewest)',
    description: '',
    tags: [],
    chartType: 'Bar Chart',
    data,
    fields: [makeField('Genre'), makeField('Films')],
    metadata: buildMetadata(data),
    encodingMap: {
      x: makeEncodingItem('Genre', { sortBy: 'y', sortOrder: 'descending' }),
      y: makeEncodingItem('Films'),
    },
  };
}

const SHOWCASE_EXAMPLES: ShowcaseExample[] = [
  {
    id: 'line',
    label: 'Faceted line chart',
    caption: 'Monthly active users over the year, with one small-multiple panel per region.',
    generator: 'Omni: Line',
    index: 0,
    canvasSize: { width: 300, height: 600 },
  },
  {
    id: 'heatmap',
    label: 'Diverging heatmap',
    caption: 'Net new users by region and month, colored from losses to gains around zero.',
    generator: 'Omni: Heatmap',
    index: 0,
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    caption: 'How monthly gains and losses build up to the running user total over the year.',
    generator: 'Omni: Waterfall',
    index: 0,
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    caption: 'Users broken down across a three-level hierarchy of region, game type, and game.',
    generator: 'Omni: Sunburst',
    index: 0,
  },
  {
    id: 'donut',
    label: 'Donut chart',
    caption:
      'Share of films by MPAA rating. The pie becomes a donut just by setting an ' +
      '\u201CinnerRadius\u201D chart property \u2014 no change to the data or encodings.',
    testCase: moviesDonut(),
  },
  {
    id: 'regression',
    label: 'Regression scatter',
    caption:
      'Critic vs. audience scores for every rated film in the dataset. The Regression chart type ' +
      'fits a trend line over the points to show how strongly the two ratings correlate.',
    testCase: moviesRegression(),
  },
  {
    id: 'sorted-bar',
    label: 'Sorted bar chart',
    caption:
      'Film counts by genre. A sort override on the category axis (sortBy: \u201Cy\u201D, ' +
      'sortOrder: \u201Cdescending\u201D) orders the bars from the most to the fewest films.',
    testCase: moviesSortedBar(),
  },
];


/** A small labeled hairline divider that marks the start of a subsection. */
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={sectionDividerStyle}>
      <span style={sectionDividerLabelStyle}>{label}</span>
      <span style={sectionDividerLineStyle} />
    </div>
  );
}

function HeroActionLink({ label, to, href }: { label: string; to?: string; href?: string }) {
  const [active, setActive] = useState(false);
  const handlers = {
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };

  if (href) {
    return (
      <a href={href} style={heroActionLinkStyle(active)} target="_blank" rel="noreferrer" {...handlers}>
        {label}
      </a>
    );
  }

  return (
    <Link to={to ?? '/'} style={heroActionLinkStyle(active)} {...handlers}>
      {label}
    </Link>
  );
}

function HeroShowcase() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [selectedBackend, setSelectedBackend] = useState<PreviewBackend>('vegalite');

  const example = SHOWCASE_EXAMPLES[exampleIdx];
  const galleryTestCase = useTestCase(example.generator ?? '', example.index ?? 0);
  const testCase = example.testCase ?? galleryTestCase;
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
    <section style={sectionStyle}>
      <SectionDivider label="Examples" />
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
            <div style={paneHeaderRowStyle}>
              <span style={paneLabelStyle}>Flint spec</span>
              <OpenEditorButton
                href={
                  example.generator
                    ? buildGalleryEditorHref(example.generator, example.index ?? 0)
                    : undefined
                }
                onActivate={
                  example.generator
                    ? undefined
                    : () => openEditorWithPayload(testCaseToAssemblyInput(testCase))
                }
              />
            </div>
            <FlintSpecCode testCase={testCase} canvasSize={example.canvasSize} />
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
                <WallChart testCase={testCase} backend={backend} canvasSize={example.canvasSize} />
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
      <p style={showcaseCaptionStyle}>
        <strong style={{ color: siteTheme.text, fontWeight: 600 }}> {example.label}.</strong>{' '}
        {example.caption}
      </p>

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

function OpenEditorButton({
  href,
  onActivate,
}: {
  href?: string;
  onActivate?: () => string;
}) {
  const [active, setActive] = useState(false);
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onActivate) {
      e.preventDefault();
      window.location.hash = onActivate();
    }
  };
  return (
    <a
      href={href ?? '#/editor'}
      style={openEditorBtnStyle(active)}
      title="Open this example in the editor"
      onClick={handleClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      Open in editor →
    </a>
  );
}

function FlintSpecCode({ testCase, canvasSize }: { testCase: TestCase; canvasSize?: { width: number; height: number } }) {
  const text = useMemo(() => {
    const summary = testCaseToFlintSummary(testCase);
    const withCanvas = canvasSize
      ? { ...summary, chart_spec: { ...summary.chart_spec, baseSize: canvasSize } }
      : summary;
    const body = JSON.stringify(withCanvas, null, 2);
    return body.replace(/^{\n/, '{\n  "data": {...},\n');
  }, [testCase, canvasSize]);
  return <pre style={specPreStyle}>{text}</pre>;
}

/* ------------------------------------------------------------------ */
/* Feature section copy                                                */
/*                                                                     */
/* Edit the copy below to rewrite the landing copy. The intro uses     */
/* small inline highlights; feature title/body/example strings stay    */
/* plain so they can be reworded without touching JSX.                 */
/* ------------------------------------------------------------------ */

function LeadHighlight({ children }: { children: string }) {
  return <span style={leadHighlightStyle}>{children}</span>;
}

// Lead paragraph shown in the hero (the single intro to Flint).
const LEAD_INTRO = (
  <>
    Flint is a visualization intermediate language that allows{' '}
    <LeadHighlight>AI agents to create expressive, good-looking visualizations from simple, human-editable chart specs</LeadHighlight>. Instead of requiring verbose
    low-level parameters such as scales, axes, spacing, and layout, the Flint compiler derives
    optimized chart settings from the data, semantic types, chart type, and encodings. The result is a
    compact chart specification that is easy for agents to create, easy for people to edit, and{' '}
    <LeadHighlight>it can be rendered in different backends (Vega-Lite, ECharts, Chart.js)</LeadHighlight>.
  </>
);

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
      'Flint uses semantic types to capture meanings of data fields ' +
      '(e.g., Rank, YearMonth, Delta, Temperature), and uses them to infer the low-level chart configuration like parsing, scale, axes, formatting and color schemes. ',
    example:
      'For this heatmap of net new users gains by game and month, Flint determines the temporal value parser, axis formatting, and diverging color scheme and midpoint based on the semantic types of the fields.',
    demo: demoSemanticTypes,
  },
  {
    title: 'Automatic layout optimization',
    body:
      'Flint optimizes the chart layout based on the chart speficiation and data characteristics based on an elastic layout model and banking principles. ' + 
      'Given the desired chart dimensions and allowed canvas sizes, the compiler dynamically manages sizing, spacing, and arrangement so the chart nicely fits into the canvas with principled layout decisions. ',
    example:
      'As the same grouped bar chart grows from 5 categories to 22, Flint stretches the canvas and reduces the band width so the dense version still fits the canvas nicely, similar to how springs settle into an expandable container.',
    demo: demoLayout,
  },
  {
    title: 'Easy to generate and adapt',
    body:
      'Without fragile low-level parameters, Flint specs can be easily ' +
      'generated and adapted by users. Changing a chart design requires only switching ' +
      'the chart type and rebinding visual encodings, and the compiler cascades the new ' +
      'encoding choices to the low-level settings.',
    example:
      'To turn a faceted bar showing the population distribution by gender and age (the 2000 U.S. Census) into a pyramid chart, the user can simply switch the chart type. The compiler adapts low-level settings based on new layout requirements automatically.',
    demo: demoAdapt,
  },
  {
    title: 'Render with different backends',
    body:
      'Flint specs can be compiled to 34 different chart types in different backends (Vega-Lite, ECharts, and Chart.js). Despite their different APIs and ' +
      'programming models, Flint hides them behind a unified interface. The user can easily switch to different backends and leverage their unique features.',
    example:
      'Vega-Lite has no native sunburst, but the user can easily convert Vega-Lite bar chart that shows region \u00d7 gameType \u00d7 game to a sunburst chart in ECharts by simply switching the chart type and the rendering backend.',
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

// Card 3: same encoding, different chart type — a faceted bar becomes a pyramid.
//
// Real data: U.S. resident population by 5-year age band and sex, 2000 census
// (the same source Vega-Lite's own population-pyramid example draws from).
const US_POP_2000: Array<[band: string, male: number, female: number]> = [
  ['0–4', 9735380, 9310714],
  ['5–9', 10552146, 10069564],
  ['10–14', 10563233, 10022524],
  ['15–19', 10237419, 9692669],
  ['20–24', 9731315, 9324244],
  ['25–29', 9659493, 9518507],
  ['30–34', 10205879, 10119296],
  ['35–39', 11475182, 11635647],
  ['40–44', 11320252, 11488578],
  ['45–49', 9925006, 10261253],
  ['50–54', 8507934, 8911133],
  ['55–59', 6459082, 6921268],
  ['60–64', 5123399, 5668961],
  ['65–69', 4453623, 4804784],
  ['70–74', 3792145, 5184855],
  ['75–79', 2912655, 4355644],
  ['80–84', 1902638, 3221898],
  ['85–89', 970357, 1981156],
  ['90+', 336303, 1064581],
];

/** Long-format population table built from the real 2000 census slice (millions). */
function usPopulationPyramid(): TestCase {
  const data: Array<Record<string, unknown>> = [];
  for (const [band, male, female] of US_POP_2000) {
    data.push({ 'Age Band': band, Sex: 'Male', People: Math.round(male / 1e5) / 10 });
    data.push({ 'Age Band': band, Sex: 'Female', People: Math.round(female / 1e5) / 10 });
  }
  return {
    title: 'U.S. population by age and sex (2000)',
    description: '',
    tags: [],
    chartType: 'Pyramid Chart',
    data,
    fields: [makeField('Age Band'), makeField('People'), makeField('Sex')],
    metadata: buildMetadata(data),
    encodingMap: {
      y: makeEncodingItem('Age Band'),
      x: makeEncodingItem('People'),
      color: makeEncodingItem('Sex'),
    },
  };
}

function demoAdapt(): FeatureDemoConfig {
  const pyr = usPopulationPyramid();
  const facetedBar: TestCase = {
    ...pyr,
    chartType: 'Bar Chart',
    encodingMap: {
      x: makeEncodingItem('Age Band'),
      y: makeEncodingItem('People'),
      column: makeEncodingItem('Sex'),
    },
  };
  return {
    before: { kind: 'chart', label: 'Faceted bar', testCase: facetedBar, backend: 'vegalite' },
    after: { kind: 'chart', label: 'Pyramid', testCase: pyr, backend: 'vegalite' },
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

const sectionDividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  margin: '0 0 28px',
};

const sectionDividerLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
  whiteSpace: 'nowrap',
};

const sectionDividerLineStyle: CSSProperties = {
  flex: 1,
  height: 1,
  background: HAIRLINE,
};

const heroTitleStyle: CSSProperties = {
  fontSize: 42,
  lineHeight: 1.18,
  margin: '0 0 32px',
  maxWidth: 960,
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
  width: 164,
  display: 'flex',
  flexDirection: 'column',
  borderLeft: `1px solid ${HAIRLINE}`,
  paddingLeft: 20,
};

// Right-side quick actions kept flat to avoid competing with the hero copy.
const actionBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 3,
  paddingTop: 2,
};

const leadStyle: CSSProperties = {
  fontSize: 17,
  color: siteTheme.textMuted,
  lineHeight: 1.65,
  margin: 0,
  fontWeight: 300,
};

const leadHighlightStyle: CSSProperties = {
  fontWeight: 600,
  color: '#005a9e',
};

const installLinesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  margin: '20px 0 0',
};

const installLineStyle: CSSProperties = {
  color: siteTheme.textMuted,
  fontSize: 15.5,
  lineHeight: 1.65,
};

const promptMarkStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  color: '#9aa3ad',
  userSelect: 'none',
};

const installLineLinkStyle: CSSProperties = {
  color: '#005a9e',
  fontWeight: 500,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  transition: 'color 120ms ease, box-shadow 120ms ease',
};

const landingInteractiveStyles = `
  .landing-skill-link:hover {
    color: #0078d4 !important;
  }
`;

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

function openEditorBtnStyle(active: boolean): CSSProperties {
  return {
    margin: '6px 10px 0 0',
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: active ? siteTheme.text : siteTheme.textMuted,
    background: active ? NEUTRAL_FILL : 'transparent',
    border: `1px solid ${HAIRLINE}`,
    borderRadius: siteTheme.radius,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, color 0.15s',
  };
}

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
  margin: '14px auto 0',
  textAlign: 'center',
  color: siteTheme.textMuted,
  fontSize: 13.5,
};

const specPreStyle: CSSProperties = {
  margin: 0,
  padding: '4px 16px 16px',
  fontFamily: siteTheme.fontMono,
  fontSize: 11,
  lineHeight: 1.5,
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
// The surrounding card clips overflow, so the pre itself never scrolls — it
// renders the (short) summary spec in full without an unintended scrollbar.
const demoSpecPreStyle: CSSProperties = {
  margin: 0,
  padding: '2px 4px',
  fontFamily: siteTheme.fontMono,
  fontSize: 12,
  lineHeight: 1.5,
  color: siteTheme.text,
  background: PAPER,
  overflow: 'hidden',
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

function featureExampleRowStyle(): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: '12px 0 0',
    // Paragraph stays first so its left border lines up with the text above;
    // the arrow trails on the right.
    flexDirection: 'row',
  };
}

const featureExampleStyle: CSSProperties = {
  margin: '12px 0 0',
  paddingLeft: 12,
  borderLeft: `2px solid ${HAIRLINE}`,
  fontSize: 14,
  lineHeight: 1.6,
  color: siteTheme.textMuted,
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

function heroActionLinkStyle(active: boolean): CSSProperties {
  return {
    display: 'block',
    margin: 0,
    textAlign: 'left',
    boxSizing: 'border-box',
    padding: '3px 8px',
    borderRadius: 4,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: active ? siteTheme.text : siteTheme.accent,
    background: active ? siteTheme.hover : 'transparent',
    transform: active ? 'translateX(2px)' : 'translateX(0)',
    transition: 'background 0.12s ease, color 0.12s ease, transform 0.12s ease',
  };
}
