import { siteTheme } from '../shared/theme';
import { SpecPipelineFigure } from '../components/SpecPipelineFigure';
import { ChatMockup } from './McpServer';

const PAPER = '#ffffff';
const GRID_LINE = 'rgba(0, 0, 0, 0.035)';

export function DevPlayground() {
  return (
    <main style={pageStyle}>
      <SpecPipelineFigure />

      <section className="dev-playground-dialog-figure" style={dialogFigureStyle}>
        <ChatMockup />
      </section>
    </main>
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

const dialogFigureStyle: React.CSSProperties = {
  width: 960,
  boxSizing: 'border-box',
};
