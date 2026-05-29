import { useMemo, useState } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { VegaLiteView } from './VegaLiteView';
import { EChartsView } from './EChartsView';
import { ChartjsView } from './ChartjsView';
import { testCaseToAssemblyInput } from '../shared/test-case-utils';
import { siteTheme } from '../shared/theme';

type Backend = 'vegalite' | 'echarts' | 'chartjs';

const BACKEND_LABELS: Record<Backend, string> = {
  vegalite: 'Vega-Lite',
  echarts: 'ECharts',
  chartjs: 'Chart.js',
};

/**
 * Renders one TestCase with Vega-Lite as the primary preview; other backends
 * available via tabs (P2 — avoids three-column "test bench" look).
 */
export function TripleChart({ testCase }: { testCase: TestCase }) {
  const [backend, setBackend] = useState<Backend>('vegalite');
  const input = useMemo(() => testCaseToAssemblyInput(testCase), [testCase]);

  const compiled = useMemo(() => {
    try {
      if (backend === 'vegalite') return { ok: true as const, value: assembleVegaLite(input) };
      if (backend === 'echarts') return { ok: true as const, value: assembleECharts(input) };
      return { ok: true as const, value: assembleChartjs(input) };
    } catch (err) {
      return { ok: false as const, err };
    }
  }, [input, backend]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['vegalite', 'echarts', 'chartjs'] as Backend[]).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBackend(b)}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              border: `1px solid ${siteTheme.borderMuted}`,
              borderRadius: 4,
              background: backend === b ? siteTheme.accentBg : siteTheme.surface,
              color: backend === b ? siteTheme.accent : siteTheme.textMuted,
              cursor: 'pointer',
              fontWeight: backend === b ? 600 : 400,
            }}
          >
            {BACKEND_LABELS[b]}
          </button>
        ))}
        {backend !== 'vegalite' && (
          <span style={{ fontSize: 11, color: siteTheme.textMuted, alignSelf: 'center', marginLeft: 4 }}>
            other engines
          </span>
        )}
      </div>

      <div
        style={{
          border: `1px solid ${siteTheme.border}`,
          borderRadius: siteTheme.radius,
          padding: 12,
          background: siteTheme.surface,
          minHeight: 280,
        }}
      >
        {compiled.ok ? (
          <>
            {backend === 'vegalite' && <VegaLiteView spec={compiled.value} />}
            {backend === 'echarts' && <EChartsView option={compiled.value} height={320} />}
            {backend === 'chartjs' && <ChartjsView config={compiled.value} height={320} />}
          </>
        ) : (
          <pre style={{ color: siteTheme.error, fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>
            {String((compiled.err as Error)?.message ?? compiled.err)}
          </pre>
        )}
      </div>
    </div>
  );
}
