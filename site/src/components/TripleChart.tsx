import { useEffect, useMemo, useState } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { VegaLiteView } from './VegaLiteView';
import { EChartsView } from './EChartsView';
import { ChartjsView } from './ChartjsView';
import { testCaseToAssemblyInput } from '../shared/test-case-utils';
import {
  BACKEND_LABELS,
  getSupportedBackends,
  type PreviewBackend,
} from '../shared/supported-backends';
import { siteTheme } from '../shared/theme';

/**
 * Renders one TestCase with tabs only for backends that support its chart type.
 */
export function TripleChart({ testCase }: { testCase: TestCase }) {
  const supportedBackends = useMemo(
    () => getSupportedBackends(testCase.chartType),
    [testCase.chartType],
  );
  const [backend, setBackend] = useState<PreviewBackend>(
    () => supportedBackends[0] ?? 'vegalite',
  );

  useEffect(() => {
    setBackend((current) =>
      supportedBackends.includes(current) ? current : (supportedBackends[0] ?? 'vegalite'),
    );
  }, [testCase.chartType, supportedBackends]);

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

  if (supportedBackends.length === 0) {
    return (
      <div
        style={{
          border: `1px solid ${siteTheme.border}`,
          borderRadius: siteTheme.radius,
          padding: 12,
          background: siteTheme.surface,
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: siteTheme.textMuted,
          fontSize: 13,
        }}
      >
        No rendering backend supports "{testCase.chartType}".
      </div>
    );
  }

  return (
    <div>
      {supportedBackends.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {supportedBackends.map((b) => (
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
        </div>
      )}

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
