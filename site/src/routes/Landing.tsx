import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { TEST_GENERATORS, type TestCase } from 'flint-chart/test-data';
import { SiteNavBar, MicrosoftDisclosures } from '../components/SiteShell';
import { WallChart } from '../components/WallChart';
import { ScaleToFit } from '../components/ScaleToFit';
import { testCaseToFlintSummary } from '../shared/test-case-utils';
import { GITHUB_REPO, siteTheme } from '../shared/theme';

/**
 * Front page — data-formulator/about-style hero with copy learned from the Flint
 * paper and the Vega-Lite homepage advertisement. Flush (borderless) header, no
 * drop shadows, one illustrative example, and a clean text-only feature grid.
 */
export function Landing() {
  const heroCase = useTestCase('Line Chart', 1);

  return (
    <div style={pageStyle}>
      <SiteNavBar flush />

      <main style={mainStyle}>
        {/* ---- Hero ------------------------------------------------------ */}
        <section style={{ ...sectionStyle, textAlign: 'center', paddingTop: 72 }}>
          <div style={eyebrowStyle}>Semantic-driven data visualization</div>
          <h1 style={heroTitleStyle}>Flint</h1>
          <p style={taglineStyle}>
            An intermediate language that turns concise, semantic specifications
            into high-quality charts.
          </p>
          <p style={leadStyle}>
            Flint is a high-level grammar for data visualization. You describe{' '}
            <em>what your data means</em> and a short{' '}
            <code style={codeStyle}>chart_spec</code>; the Flint compiler derives
            the scales, axes, legends, color, and layout from those semantics and
            renders the result with <strong>Vega-Lite</strong>,{' '}
            <strong>Apache ECharts</strong>, or <strong>Chart.js</strong> — no
            hand-tuning of low-level parameters.
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

        {/* ---- Single illustrative example: spec -> chart --------------- */}
        {heroCase && (
          <section style={{ ...sectionStyle, paddingTop: 8 }}>
            <div style={showcaseCardStyle}>
              <div style={showcasePaneStyle}>
                <div style={paneLabelStyle}>Flint spec</div>
                <FlintSpecCode testCase={heroCase} />
              </div>
              <div style={{ ...showcasePaneStyle, borderLeft: `1px solid ${siteTheme.border}` }}>
                <div style={paneLabelStyle}>Compiled chart</div>
                <div style={{ padding: '4px 12px 14px' }}>
                  <ScaleToFit height={300} padding={6}>
                    <WallChart testCase={heroCase} backend="vegalite" />
                  </ScaleToFit>
                </div>
              </div>
            </div>
            <p style={showcaseCaptionStyle}>
              The same spec recompiles automatically as you change chart types,
              encodings, or rendering backend — no full rewrite required.
            </p>
          </section>
        )}

        {/* ---- Feature grid (text only) -------------------------------- */}
        <section style={sectionStyle}>
          <div style={featureGridStyle}>
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <div style={eyebrowStyle}>{feature.eyebrow}</div>
                <h2 style={featureTitleStyle}>{feature.title}</h2>
                <p style={featureBodyStyle}>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Closing CTA ---------------------------------------------- */}
        <section style={{ ...sectionStyle, paddingBottom: 72 }}>
          <div style={closingCardStyle}>
            <h2 style={{ fontSize: 26, margin: '0 0 8px', fontWeight: 700 }}>
              Write less spec. Get clearer charts.
            </h2>
            <p style={{ margin: '0 0 22px', color: siteTheme.textMuted, fontSize: 16, lineHeight: 1.6 }}>
              Explore dozens of chart types in the gallery, or open any example in
              the live editor to see the Flint spec compile across three backends.
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
/* Feature data                                                        */
/* ------------------------------------------------------------------ */

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    eyebrow: 'Semantic data model',
    title: 'Describe what your data means',
    body:
      'Flint makes data semantics first-class. A hierarchical type system captures ' +
      'meaning — additive vs. non-additive measures, sequential vs. diverging values, ' +
      'real dates vs. plain integers — so the compiler picks correct scales, baselines, ' +
      'aggregations, and formatting instead of guessing from raw representations.',
  },
  {
    eyebrow: 'Compiler-resolved defaults',
    title: 'Concise specs, polished charts',
    body:
      'Specify a chart type and a few field-to-channel mappings; Flint resolves the rest. ' +
      'Scales, axes, legends, color schemes, and layout are decided by deterministic ' +
      'compiler passes that encode visualization best practices, so short specs stay robust ' +
      'as you iterate on them.',
  },
  {
    eyebrow: 'Library-agnostic backend',
    title: 'One spec, three renderers',
    body:
      'Flint is an intermediate language, so the same specification compiles to whichever ' +
      'library you choose — Vega-Lite, Apache ECharts, or Chart.js. Switch rendering ' +
      'backends without rewriting your chart.',
  },
  {
    eyebrow: 'For people and AI agents',
    title: 'A friendly target for LLMs',
    body:
      'Semantic types are easy to infer from field names, value patterns, and common sense, ' +
      'so AI agents can emit compact Flint specs and get high-quality charts — far shorter ' +
      'than hand-written library code, and resilient to the small edits that routinely break ' +
      'a low-level specification.',
  },
];

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function FlintSpecCode({ testCase }: { testCase: TestCase }) {
  const text = useMemo(() => JSON.stringify(testCaseToFlintSummary(testCase), null, 2), [testCase]);
  return <pre style={specPreStyle}>{text}</pre>;
}

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
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: siteTheme.fontSans,
  color: siteTheme.text,
  background: siteTheme.bg,
};

const mainStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  // Subtle grid, data-formulator/about style.
  backgroundImage: `
    linear-gradient(90deg, rgba(87,96,106,0.045) 1px, transparent 1px),
    linear-gradient(0deg, rgba(87,96,106,0.045) 1px, transparent 1px)
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

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: siteTheme.accent,
  marginBottom: 10,
};

const heroTitleStyle: CSSProperties = {
  fontSize: 76,
  lineHeight: 1.02,
  margin: '0 0 14px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
};

const taglineStyle: CSSProperties = {
  fontSize: 22,
  color: siteTheme.text,
  fontWeight: 500,
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
  border: `1px solid ${siteTheme.border}`,
  borderRadius: siteTheme.radius,
  background: siteTheme.surface,
  overflow: 'hidden',
};

const showcasePaneStyle: CSSProperties = {
  flex: '1 1 360px',
  minWidth: 300,
  display: 'flex',
  flexDirection: 'column',
};

const paneLabelStyle: CSSProperties = {
  padding: '10px 14px 2px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
};

const showcaseCaptionStyle: CSSProperties = {
  marginTop: 12,
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
  background: siteTheme.surface,
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
  fontWeight: 600,
  margin: '0 0 10px',
  letterSpacing: '-0.01em',
};

const featureBodyStyle: CSSProperties = {
  fontSize: 15.5,
  color: siteTheme.textMuted,
  lineHeight: 1.7,
  margin: 0,
};

const closingCardStyle: CSSProperties = {
  textAlign: 'center',
  border: `1px solid ${siteTheme.border}`,
  borderRadius: siteTheme.radius,
  background: siteTheme.surface,
  padding: '40px 28px',
};

const codeStyle: CSSProperties = {
  background: '#eef1f4',
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
  fontWeight: 600,
  fontSize: 14.5,
};

const secondaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '11px 22px',
  background: siteTheme.surface,
  color: siteTheme.text,
  border: `1px solid ${siteTheme.borderMuted}`,
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14.5,
};
