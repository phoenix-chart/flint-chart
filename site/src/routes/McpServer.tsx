import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteNavBar, MicrosoftDisclosures } from '../components/SiteShell';
import { GITHUB_REPO, siteTheme } from '../shared/theme';
import chartPreview from '../assets/mcp-chart-preview.svg';

/** Dedicated page for the Flint MCP server, matching the landing page canvas. */
export function McpServer() {
  return (
    <div style={pageStyle}>
      <style>{interactiveStyles}</style>
      <SiteNavBar flush />

      <main style={mainStyle}>
        {/* ---- Hero -------------------------------------------------- */}
        <header style={heroSectionStyle}>
          <h1 style={heroTitleStyle}>Use Flint as a MCP server for your agent</h1>
          <p style={leadStyle}>
            Install <code style={codeInlineStyle}>flint-chart-mcp</code> as a{' '}
            <a href="https://modelcontextprotocol.io" style={linkStyle} target="_blank" rel="noreferrer">
              Model Context Protocol
            </a>{' '}
            server and your agent can create charts from the same conversation
            where the question starts. By default it opens an interactive Flint
            chart view; when you need artifacts, it can also return static images
            or backend-native specs.
          </p>

          <div style={installRowStyle}>
            <code style={installCodeStyle}>
              <span style={promptMarkStyle}>$</span> npx -y flint-chart-mcp
            </code>
            <a href={`${GITHUB_REPO}/tree/main/packages/flint-mcp`} style={ghLinkStyle} target="_blank" rel="noreferrer">
              View on GitHub →
            </a>
          </div>
        </header>

        {/* ---- Article body ----------------------------------------- */}
        <article style={articleStyle}>
          {/* ---- The experience --------------------------------------- */}
          <Prose>
            <h2 style={firstH2Style}>The experience</h2>
            <p style={pStyle}>
              Using Flint through MCP is a simple loop: connect the server, ask
              for the chart you want, and work with the rendered result in the
              same chat.
            </p>
            <ol style={stepListStyle}>
              <li style={stepItemStyle}>
                <strong>Connect Flint once.</strong> Add the stdio server to your
                MCP client. If the agent should chart local CSV, TSV, or JSON
                files, grant a data root explicitly.
              </li>
              <li style={stepItemStyle}>
                <strong>Ask for a chart.</strong> The agent turns your request
                into one Flint spec, chooses the chart type and fields, then
                calls the MCP server to validate and render it.
              </li>
              <li style={stepItemStyle}>
                <strong>Review the result.</strong> In hosts with MCP Apps, the
                preferred tool opens a live SVG preview with chart options. When
                an artifact is needed, Flint can return a PNG, SVG, or compiled
                backend spec instead.
              </li>
            </ol>
          </Prose>

          <ChatMockup />

          <Prose>
            <p style={captionStyle}>
              The embedded chart is genuinely Flint-rendered, using the same path
              as the MCP App. The frame and toolbar mirror the real{' '}
              <code style={codeInlineStyle}>create_chart_view</code> UI: a live
              preview with chart options and a <em>Copy spec to chat</em> action.
            </p>
          </Prose>

          {/* ---- What it provides ------------------------------------- */}
          <Prose>
            <h2 style={h2Style}>What it provides</h2>
            <p style={pStyle}>
              The server keeps the tool surface small: one preferred interactive
              tool, supporting tools for static render and validation, plus
              resources that teach the agent Flint's chart vocabulary.
            </p>
          </Prose>

          <div style={cardGridStyle}>
            <SurfaceCard
              tag="tool · preferred"
              name="create_chart_view"
              desc="Opens the interactive MCP App: live SVG preview plus chart options. Use this whenever the user wants to see a chart."
              highlight
            />
            <SurfaceCard
              tag="tool"
              name="render_chart"
              desc="Returns a static PNG or SVG. Use it when the host has no App UI, or when the user asks for an image artifact."
            />
            <SurfaceCard
              tag="tool"
              name="compile_chart"
              desc="Returns the backend-native spec JSON for Vega-Lite, ECharts, or Chart.js, along with assembly warnings."
            />
            <SurfaceCard
              tag="tool"
              name="validate_chart"
              desc="Checks whether a spec is valid, reports warnings or errors, and returns the computed chart size."
            />
            <SurfaceCard
              tag="tool"
              name="list_chart_types"
              desc="Lists chart types and encoding channels, optionally scoped to one backend."
            />
            <SurfaceCard
              tag="resource"
              name="flint://agent-skill"
              desc="Bundled authoring instructions for producing valid ChartAssemblyInput specs."
            />
            <SurfaceCard
              tag="resource"
              name="flint://chart-types"
              desc="A browsable catalog of chart types and encoding channels across all backends."
            />
            <SurfaceCard
              tag="prompt"
              name="author_flint_chart"
              desc="Loads the Flint authoring skill in prompt-aware clients before chart tool calls."
            />
          </div>

          {/* ---- Install ---------------------------------------------- */}
          <Prose>
            <h2 style={h2Style}>Install &amp; configure</h2>
            <p style={pStyle}>
              The server speaks <strong>stdio</strong> and runs zero-install with{' '}
              <code style={codeInlineStyle}>npx</code>. If your MCP client can
              edit its own configuration, you can ask your agent to set it up:
            </p>
          </Prose>

          <CodeBlock>{setupPrompt}</CodeBlock>

          <Prose>
            <p style={pStyle}>Or point your MCP client at the package manually:</p>
          </Prose>

          <CodeBlock>{clientConfig}</CodeBlock>

          <Prose>
            <p style={pStyle}>
              Tool calls can embed rows directly with{' '}
              <code style={codeInlineStyle}>data.values</code>. If you want the
              agent to chart a local CSV, TSV, or JSON file instead, grant an
              explicit data root. Remote URLs are never fetched:
            </p>
          </Prose>

          <CodeBlock>{dataRootsConfig}</CodeBlock>

          {/* ---- Next ------------------------------------------------- */}
          <Prose>
            <h2 style={h2Style}>Reference</h2>
            <p style={pStyle}>
              The docs cover the full MCP workflow. The package README is the
              shortest reference for tool inputs, CLI flags, and client config.
            </p>
          </Prose>

          <div style={nextRowStyle}>
            <Link to="/documentation/agent-workflows#mcp-server-execution" style={primaryBtn}>
              Read the MCP docs
            </Link>
            <a href={`${GITHUB_REPO}/tree/main/packages/flint-mcp`} style={secondaryBtn} target="_blank" rel="noreferrer">
              GitHub README
            </a>
          </div>
        </article>
      </main>

      <MicrosoftDisclosures />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mockup chat showing the interactive MCP App in context.            */
/* ------------------------------------------------------------------ */

function ChatMockup() {
  return (
    <div style={chatFrameStyle}>
      <div style={chatTitleBarStyle}>
        <span style={{ ...trafficDot, background: '#ec6a5e' }} />
        <span style={{ ...trafficDot, background: '#f4bf4f' }} />
        <span style={{ ...trafficDot, background: '#61c554' }} />
        <span style={chatTitleTextStyle}>Agent chat</span>
      </div>

      <div style={chatBodyStyle}>
        {/* user turn */}
        <div style={userRowStyle}>
          <div style={userBubbleStyle}>
            Show me quarterly revenue by region as a grouped bar chart.
          </div>
        </div>

        {/* assistant turn */}
        <div style={assistantRowStyle}>
          <div style={avatarStyle}>AI</div>
          <div style={assistantColStyle}>
            <div style={assistantTextStyle}>
              Here's an interactive Flint chart view — tweak it and send the spec
              back when it looks right.
            </div>

            <div style={toolPillStyle}>
              <span style={toolDotStyle} /> called{' '}
              <code style={toolPillCodeStyle}>create_chart_view</code>
            </div>

            {/* embedded MCP App card */}
            <div style={appCardStyle}>
              <div style={appBarStyle}>
                <span style={appBarTitleStyle}>Flint Chart</span>
                <span style={appBarTagStyle}>MCP App</span>
              </div>

              <div style={appBodyStyle}>
                <div style={chartBoxStyle}>
                  <img src={chartPreview} alt="Grouped bar chart: quarterly revenue by region" style={chartImgStyle} />
                </div>

                <div style={optionsBarStyle}>
                  <MockSlider label="Corner radius" fill={0.25} readout="2" />
                  <MockSelect label="Sort" value="None" />
                  <MockToggle label="Show values" on={false} />
                  <span style={{ flex: 1 }} />
                  <span style={copyBtnStyle}>Copy spec to chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSlider({ label, fill, readout }: { label: string; fill: number; readout: string }) {
  return (
    <span style={optStyle}>
      <span style={optLabelStyle}>{label}</span>
      <span style={sliderTrackStyle}>
        <span style={{ ...sliderFillStyle, width: `${Math.round(fill * 100)}%` }} />
        <span style={{ ...sliderKnobStyle, left: `calc(${Math.round(fill * 100)}% - 6px)` }} />
      </span>
      <span style={readoutStyle}>{readout}</span>
    </span>
  );
}

function MockSelect({ label, value }: { label: string; value: string }) {
  return (
    <span style={optStyle}>
      <span style={optLabelStyle}>{label}</span>
      <span style={selectBoxStyle}>
        {value} <span style={caretStyle}>▾</span>
      </span>
    </span>
  );
}

function MockToggle({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={optStyle}>
      <span style={optLabelStyle}>{label}</span>
      <span style={{ ...toggleTrackStyle, background: on ? siteTheme.text : 'rgba(0,0,0,0.18)' }}>
        <span style={{ ...toggleThumbStyle, transform: on ? 'translateX(14px)' : 'none' }} />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers.                                      */
/* ------------------------------------------------------------------ */

function Prose({ children }: { children: ReactNode }) {
  return <div style={proseStyle}>{children}</div>;
}

function SurfaceCard(props: { tag: string; name: string; desc: string; highlight?: boolean }) {
  const { tag, name, desc, highlight } = props;
  return (
    <div style={{ ...cardStyle, ...(highlight ? cardHighlightStyle : null) }}>
      <div style={{ ...cardTagStyle, ...(highlight ? cardTagHighlightStyle : null) }}>{tag}</div>
      <code style={cardNameStyle}>{name}</code>
      <p style={cardDescStyle}>{desc}</p>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div style={codeBlockWrapStyle}>
      <pre style={codeBlockStyle}>{children}</pre>
    </div>
  );
}

const setupPrompt = `Set up Flint as an MCP server for this project.

Use the package flint-chart-mcp through npx:
  npx -y flint-chart-mcp

Add it to the MCP client config as a stdio server named "flint". If this workspace has a ./data folder, allow it with --data-roots ./data. After setup, verify the server by listing the available Flint chart types.`;

const clientConfig = `{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}`;

const dataRootsConfig = `{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp", "--data-roots", "./data"]
    }
  }
}`;

/* ------------------------------------------------------------------ */
/* Styles — flat "paper" tokens, matching the landing page.           */
/* ------------------------------------------------------------------ */

const PAPER = '#ffffff';
const HAIRLINE = 'rgba(0, 0, 0, 0.10)';
const GRID_LINE = 'rgba(0, 0, 0, 0.02)';
const READING_WIDTH = 880;

const interactiveStyles = `
  .mcp-link:hover { color: #005a9e !important; }
`;

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
  backgroundImage: `
    linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px),
    linear-gradient(0deg, ${GRID_LINE} 1px, transparent 1px)
  `,
  backgroundSize: '24px 24px',
};

const heroSectionStyle: CSSProperties = {
  maxWidth: READING_WIDTH,
  margin: '0 auto',
  padding: '42px 24px 0',
  width: '100%',
  boxSizing: 'border-box',
};

const heroTitleStyle: CSSProperties = {
  fontSize: 36,
  lineHeight: 1.2,
  margin: '0 0 28px',
  fontWeight: 700,
  letterSpacing: 0,
};

const leadStyle: CSSProperties = {
  fontSize: 16.5,
  color: siteTheme.text,
  lineHeight: 1.65,
  margin: 0,
  fontWeight: 400,
};

const installRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  marginTop: 22,
  flexWrap: 'wrap',
};

const installCodeStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  fontSize: 14,
  color: siteTheme.text,
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  padding: '9px 14px',
};

const promptMarkStyle: CSSProperties = {
  color: siteTheme.textMuted,
  userSelect: 'none',
  marginRight: 8,
};

const ghLinkStyle: CSSProperties = {
  color: siteTheme.accent,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
};

const articleStyle: CSSProperties = {
  maxWidth: READING_WIDTH,
  margin: '0 auto',
  padding: '0 24px 56px',
  width: '100%',
  boxSizing: 'border-box',
};

const proseStyle: CSSProperties = {
  margin: '0 auto',
};

const h2Style: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 0,
  margin: '36px 0 12px',
};

const firstH2Style: CSSProperties = {
  ...h2Style,
  marginTop: 24,
};

const pStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: siteTheme.text,
  margin: '0 0 16px',
};

const captionStyle: CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.6,
  color: siteTheme.textMuted,
  margin: '14px 0 0',
};

const stepListStyle: CSSProperties = {
  margin: '10px 0 0',
  padding: '0 0 0 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const stepItemStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.65,
  color: siteTheme.text,
};

const codeInlineStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  fontSize: '0.88em',
  background: 'rgba(0,0,0,0.05)',
  borderRadius: 4,
  padding: '1px 5px',
};

const linkStyle: CSSProperties = {
  color: siteTheme.accent,
  textDecoration: 'none',
  fontWeight: 500,
};

/* ---- chat mockup ---- */

const chatFrameStyle: CSSProperties = {
  margin: '24px 0 0',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 12,
  overflow: 'hidden',
  background: PAPER,
};

const chatTitleBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  padding: '10px 14px',
  borderBottom: `1px solid ${HAIRLINE}`,
  background: 'rgba(0,0,0,0.02)',
};

const trafficDot: CSSProperties = {
  width: 11,
  height: 11,
  borderRadius: '50%',
  display: 'inline-block',
};

const chatTitleTextStyle: CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  fontWeight: 500,
  color: siteTheme.textMuted,
  letterSpacing: '0.02em',
};

const chatBodyStyle: CSSProperties = {
  padding: '18px 18px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  background: 'rgba(0,0,0,0.012)',
};

const userRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const userBubbleStyle: CSSProperties = {
  maxWidth: '78%',
  background: siteTheme.accent,
  color: '#fff',
  fontSize: 14.5,
  lineHeight: 1.5,
  padding: '10px 14px',
  borderRadius: '14px 14px 4px 14px',
};

const assistantRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const avatarStyle: CSSProperties = {
  flex: '0 0 auto',
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: '#1f2328',
  color: '#fff',
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '0.02em',
};

const assistantColStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const assistantTextStyle: CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.55,
  color: siteTheme.text,
};

const toolPillStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 12,
  color: siteTheme.textMuted,
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 999,
  padding: '3px 10px',
};

const toolDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#61c554',
};

const toolPillCodeStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  fontSize: 11.5,
  color: siteTheme.text,
};

/* ---- embedded app card ---- */

const appCardStyle: CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 10,
  overflow: 'hidden',
  background: PAPER,
  maxWidth: 520,
};

const appBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderBottom: `1px solid ${HAIRLINE}`,
};

const appBarTitleStyle: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: siteTheme.text,
};

const appBarTagStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 4,
  padding: '1px 6px',
};

const appBodyStyle: CSSProperties = {
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const chartBoxStyle: CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  background: PAPER,
  padding: 8,
  display: 'flex',
  justifyContent: 'center',
};

const chartImgStyle: CSSProperties = {
  maxWidth: '100%',
  height: 'auto',
};

const optionsBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '10px 18px',
  padding: '10px 14px',
  background: 'rgba(0,0,0,0.035)',
  borderRadius: 10,
  color: siteTheme.textMuted,
};

const optStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const optLabelStyle: CSSProperties = {
  fontSize: 12,
  color: siteTheme.textMuted,
  whiteSpace: 'nowrap',
};

const sliderTrackStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: 80,
  height: 4,
  borderRadius: 999,
  background: 'rgba(0,0,0,0.18)',
};

const sliderFillStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  borderRadius: 999,
  background: siteTheme.text,
};

const sliderKnobStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: siteTheme.text,
  transform: 'translateY(-50%)',
};

const readoutStyle: CSSProperties = {
  fontSize: 12,
  color: siteTheme.textMuted,
  fontVariantNumeric: 'tabular-nums',
};

const selectBoxStyle: CSSProperties = {
  fontSize: 12,
  color: siteTheme.text,
  background: PAPER,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 4,
  padding: '3px 8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const caretStyle: CSSProperties = {
  fontSize: 9,
  color: siteTheme.textMuted,
};

const toggleTrackStyle: CSSProperties = {
  position: 'relative',
  width: 30,
  height: 16,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  padding: 2,
};

const toggleThumbStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: PAPER,
  transition: 'transform 120ms ease',
};

const copyBtnStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: siteTheme.accent,
  whiteSpace: 'nowrap',
};

/* ---- surface cards ---- */

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 12,
  margin: '20px 0 0',
};

const cardStyle: CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 8,
  padding: '14px 16px',
  background: PAPER,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const cardHighlightStyle: CSSProperties = {
  borderColor: 'rgba(0, 120, 212, 0.40)',
  background: 'rgba(0, 120, 212, 0.04)',
};

const cardTagStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: siteTheme.textMuted,
};

const cardTagHighlightStyle: CSSProperties = {
  color: siteTheme.accent,
};

const cardNameStyle: CSSProperties = {
  fontFamily: siteTheme.fontMono,
  fontSize: 13.5,
  fontWeight: 600,
  color: siteTheme.text,
};

const cardDescStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: siteTheme.textMuted,
  margin: 0,
};

/* ---- code blocks ---- */

const codeBlockWrapStyle: CSSProperties = {
  margin: '4px 0 8px',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 8,
  background: 'rgba(0,0,0,0.025)',
  overflow: 'auto',
};

const codeBlockStyle: CSSProperties = {
  margin: 0,
  padding: '14px 16px',
  fontFamily: siteTheme.fontMono,
  fontSize: 13,
  lineHeight: 1.6,
  color: siteTheme.text,
};

/* ---- next actions ---- */

const nextRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  margin: '20px 0 0',
  flexWrap: 'wrap',
};

const primaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  background: siteTheme.accent,
  color: '#fff',
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14,
};

const secondaryBtn: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  background: PAPER,
  color: siteTheme.text,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: siteTheme.radius,
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14,
};
