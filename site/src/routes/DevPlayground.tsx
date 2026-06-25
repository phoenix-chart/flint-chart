import { useMemo } from 'react';
import { assembleVegaLite } from 'flint-chart';
import { TEST_GENERATORS, type TestCase } from 'flint-chart/test-data';
import { ScaleToFit } from '../components/ScaleToFit';
import { WallChart } from '../components/WallChart';
import { siteTheme } from '../shared/theme';
import { testCaseToAssemblyInput, testCaseToFlintSummary } from '../shared/test-case-utils';
import { ChatMockup } from './McpServer';

const PAPER = '#ffffff';
const GRID_LINE = 'rgba(0, 0, 0, 0.035)';
const HAIRLINE = 'rgba(0, 0, 0, 0.12)';
const FIGURE_CANVAS = { width: 720, height: 500 } as const;
const OMITTED = '__omitted__';
const MAX_COMPILED_SPEC_LINES = 38;

export function DevPlayground() {
  const testCase = useMemo(() => TEST_GENERATORS['Omni: Heatmap']()[0], []);
  const specText = useMemo(() => {
    const summary = testCaseToFlintSummary(testCase);
    const body = JSON.stringify({ data: '{...}', ...summary }, null, 2);
    return body.replace('"{...}"', '{...}');
  }, [testCase]);
  const compiledSpecText = useMemo(() => buildCompiledSpecExcerpt(testCase), [testCase]);

  return (
    <main style={pageStyle}>
      <section className="dev-playground-spec-figure" style={figureStyle}>
        <div style={paneStyle}>
          <div style={paneHeaderStyle}>
            <span style={paneTitleStyle}>Flint spec</span>
          </div>
          <pre style={specPreStyle}>{specText}</pre>
        </div>

        <ArrowColumn />

        <div style={borderedPaneStyle}>
          <div style={chartHeaderStyle}>
            <span style={paneTitleStyle}>Compiled spec <span style={backendLabelStyle}>(Vega-Lite)</span></span>
          </div>
          <pre style={compiledPreStyle}>{compiledSpecText}</pre>
        </div>

        <ArrowColumn />

        <div style={borderedVisualPaneStyle}>
          <div style={paneHeaderStyle}>
            <span style={paneTitleStyle}>Visualization</span>
          </div>
          <div style={chartBodyStyle}>
            <ScaleToFit height={560} minHeight={520} padding={0} adaptiveHeight>
              <WallChart testCase={testCase} backend="vegalite" canvasSize={FIGURE_CANVAS} />
            </ScaleToFit>
          </div>
        </div>
      </section>

      <section className="dev-playground-dialog-figure" style={dialogFigureStyle}>
        <ChatMockup />
      </section>
    </main>
  );
}

function buildCompiledSpecExcerpt(testCase: TestCase): string {
  const spec = assembleVegaLite(testCaseToAssemblyInput(testCase, FIGURE_CANVAS));
  const excerpt = {
    data: spec.data ? OMITTED : undefined,
    mark: spec.mark,
    ...(spec.width != null ? { width: spec.width } : {}),
    ...(spec.height != null ? { height: spec.height } : {}),
    encoding: spec.encoding,
    ...(spec.config ? { config: compactConfig(spec.config) } : {}),
  };
  const text = JSON.stringify(excerpt, null, 2).split(`"${OMITTED}"`).join('{...}');
  return cropCompiledSpec(text);
}

function cropCompiledSpec(text: string): string {
  const lines = text.split('\n');
  if (lines.length <= MAX_COMPILED_SPEC_LINES) return text;
  const visibleLineCount = MAX_COMPILED_SPEC_LINES - 1;
  const hiddenLines = lines.slice(visibleLineCount);
  return [
    ...lines.slice(0, visibleLineCount),
    `  ... // ${hiddenLines.length} more lines`,
  ].join('\n');
}

function compactConfig(config: Record<string, unknown>): Record<string, unknown> {
  const compact: Record<string, unknown> = {};
  for (const key of ['view', 'axisX', 'axisY']) {
    if (key in config) compact[key] = config[key];
  }
  return compact;
}

function ArrowColumn() {
  return (
    <div style={arrowColumnStyle} aria-hidden="true">
      <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
        <path d="M1 10H27" stroke={siteTheme.accent} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 3L27 10L20 17" stroke={siteTheme.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 36,
  boxSizing: 'border-box',
  padding: 18,
  fontFamily: siteTheme.fontSans,
  color: siteTheme.text,
  backgroundColor: PAPER,
  backgroundImage: `
    linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px),
    linear-gradient(0deg, ${GRID_LINE} 1px, transparent 1px)
  `,
  backgroundSize: '24px 24px',
};

const figureStyle: React.CSSProperties = {
  width: 1400,
  minHeight: 680,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 34px minmax(0, 1.1fr) 34px minmax(0, 1.55fr)',
  columnGap: 14,
  padding: '0 18px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  background: PAPER,
};

const dialogFigureStyle: React.CSSProperties = {
  width: 960,
  boxSizing: 'border-box',
};

const paneStyle: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
};

const visualPaneStyle: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
};

const borderedPaneStyle: React.CSSProperties = {
  ...paneStyle,
  borderLeft: `1px solid ${HAIRLINE}`,
};

const borderedVisualPaneStyle: React.CSSProperties = {
  ...visualPaneStyle,
  borderLeft: `1px solid ${HAIRLINE}`,
};

const arrowColumnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: PAPER,
};

const paneHeaderStyle: React.CSSProperties = {
  minHeight: 60,
  display: 'flex',
  alignItems: 'center',
  padding: '0 18px',
  boxSizing: 'border-box',
};

const chartHeaderStyle: React.CSSProperties = {
  ...paneHeaderStyle,
  justifyContent: 'flex-start',
  gap: 8,
};

const paneTitleStyle: React.CSSProperties = {
  fontSize: 18.5,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
};

const backendLabelStyle: React.CSSProperties = {
  color: siteTheme.accent,
  letterSpacing: '0.02em',
};

const specPreStyle: React.CSSProperties = {
  margin: 0,
  padding: '0 18px 20px',
  fontFamily: siteTheme.fontMono,
  fontSize: 17.8,
  lineHeight: 1.33,
  color: siteTheme.text,
  whiteSpace: 'pre-wrap',
  overflow: 'hidden',
  background: PAPER,
};

const compiledPreStyle: React.CSSProperties = {
  ...specPreStyle,
  fontSize: 13.4,
  lineHeight: 1.18,
};

const chartBodyStyle: React.CSSProperties = {
  flex: 1,
  padding: '2px 6px 18px',
  boxSizing: 'border-box',
  background: PAPER,
};