import { useEffect, useMemo, useState } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { JsonCodeMirror } from './JsonCodeMirror';
import { ScaleToFit } from './ScaleToFit';
import { WallChart } from './WallChart';
import { testCaseToAssemblyInput } from '../shared/test-case-utils';
import { buildGalleryEditorHref } from '../shared/editor-payload';
import { humanizeVariants } from '../shared/wall-title';
import { BACKEND_LABELS } from '../shared/supported-backends';
import type { ChartEntry } from '../shared/chart-categories';
import { siteTheme } from '../shared/theme';

type CodeTab = 'input' | 'output';

/**
 * Lightbox opened from a photo-wall card. A carousel flips through every
 * example for the chart type; for each example it shows the rendered chart
 * alongside the Flint input and the backend-specific compiled spec.
 */
export function ChartCodeModal({
  chart,
  tests,
  initialIndex = 0,
  editorIndices,
  onClose,
}: {
  chart: ChartEntry;
  tests: TestCase[];
  initialIndex?: number;
  /**
   * Absolute generator index for each entry in `tests` (when `tests` is a
   * curated subset). Used so the "Open in editor" deep-link resolves the right
   * case. Falls back to the carousel position when omitted.
   */
  editorIndices?: number[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(tests.length - 1, 0)),
  );
  const [tab, setTab] = useState<CodeTab>('input');
  const [copied, setCopied] = useState(false);

  const testCase = tests[index];

  const titles = useMemo(() => humanizeVariants(tests), [tests]);

  const inputText = useMemo(
    () => (testCase ? JSON.stringify(testCaseToAssemblyInput(testCase), null, 2) : ''),
    [testCase],
  );

  const outputText = useMemo(() => {
    if (!testCase) return '';
    try {
      const input = testCaseToAssemblyInput(testCase);
      const spec =
        chart.backend === 'vegalite'
          ? assembleVegaLite(input)
          : chart.backend === 'echarts'
            ? assembleECharts(input)
            : assembleChartjs(input);
      return JSON.stringify(spec, null, 2);
    } catch (err) {
      return `// ${BACKEND_LABELS[chart.backend]} compile error:\n// ${String(
        (err as Error)?.message ?? err,
      )}`;
    }
  }, [testCase, chart.backend]);

  const codeText = tab === 'input' ? inputText : outputText;

  useEffect(() => setCopied(false), [codeText]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : i));
      else if (e.key === 'ArrowRight') setIndex((i) => (i < tests.length - 1 ? i + 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, tests.length]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const multiple = tests.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${chart.label} examples`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 32, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: siteTheme.surface,
          borderRadius: 10,
          border: `1px solid ${siteTheme.border}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
          width: 'min(1120px, 94vw)',
          height: 'min(740px, 88vh)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: `1px solid ${siteTheme.border}`,
            flexShrink: 0,
          }}
        >
          <img src={chart.icon} alt="" aria-hidden="true" style={{ width: 20, height: 20 }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{chart.label}</h2>
          <span style={{ fontSize: 12, color: siteTheme.textMuted }}>{chart.backendLabel}</span>
          <div style={{ flex: 1 }} />
          {testCase && (
            <a
              href={buildGalleryEditorHref(chart.generator, editorIndices?.[index] ?? index)}
              style={{
                fontSize: 12,
                color: siteTheme.accent,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Open in editor →
            </a>
          )}
          <button type="button" onClick={onClose} aria-label="Close" style={closeBtnStyle}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Chart preview + carousel */}
          <div
            style={{
              flex: '1 1 52%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${siteTheme.border}`,
              padding: 16,
              gap: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{titles[index] ?? 'No example'}</div>
            {testCase?.description && (
              <div style={{ fontSize: 12, color: siteTheme.textMuted, lineHeight: 1.5 }}>
                {testCase.description}
              </div>
            )}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                border: `1px solid ${siteTheme.border}`,
                borderRadius: siteTheme.radius,
                background: siteTheme.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {testCase && (
                <ScaleToFit key={`${chart.id}-${index}`} height={420} padding={16}>
                  <WallChart testCase={testCase} backend={chart.backend} />
                </ScaleToFit>
              )}

              {multiple && (
                <>
                  <button
                    type="button"
                    aria-label="Previous example"
                    onClick={() => setIndex((i) => (i > 0 ? i - 1 : i))}
                    disabled={index === 0}
                    style={{ ...arrowBtnStyle, left: 8 }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next example"
                    onClick={() => setIndex((i) => (i < tests.length - 1 ? i + 1 : i))}
                    disabled={index === tests.length - 1}
                    style={{ ...arrowBtnStyle, right: 8 }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {multiple && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {tests.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Example ${i + 1}`}
                    onClick={() => setIndex(i)}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      background: i === index ? siteTheme.accent : siteTheme.borderMuted,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Code panel */}
          <div
            style={{
              flex: '1 1 48%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#f6f8fa',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderBottom: `1px solid ${siteTheme.border}`,
                flexShrink: 0,
              }}
            >
              <CodeTabButton active={tab === 'input'} onClick={() => setTab('input')}>
                Flint spec
              </CodeTabButton>
              <CodeTabButton active={tab === 'output'} onClick={() => setTab('output')}>
                {chart.backendLabel} spec
              </CodeTabButton>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={copy} style={copyBtnStyle}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
              <JsonCodeMirror
                key={`${tab}-${chart.id}-${index}`}
                value={codeText}
                readOnly
                foldKey={`${tab}-${chart.id}-${index}`}
                foldKeys={['data', 'values', 'source']}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: 0,
        borderRadius: 4,
        cursor: 'pointer',
        background: active ? siteTheme.accentBg : 'transparent',
        color: active ? siteTheme.accent : siteTheme.textMuted,
      }}
    >
      {children}
    </button>
  );
}

const closeBtnStyle = {
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  color: siteTheme.textMuted,
  padding: 4,
} as const;

const copyBtnStyle = {
  padding: '3px 10px',
  fontSize: 11,
  border: `1px solid ${siteTheme.borderMuted}`,
  borderRadius: 4,
  background: siteTheme.surface,
  color: siteTheme.textMuted,
  cursor: 'pointer',
} as const;

const arrowBtnStyle = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 32,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${siteTheme.border}`,
  background: 'rgba(255,255,255,0.92)',
  color: siteTheme.text,
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
};
