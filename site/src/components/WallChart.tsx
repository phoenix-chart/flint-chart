import { useMemo } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { VegaLiteView } from './VegaLiteView';
import { EChartsView } from './EChartsView';
import { ChartjsView } from './ChartjsView';
import { testCaseToAssemblyInput, thumbnailCanvasSize, type CanvasSize } from '../shared/test-case-utils';
import type { PreviewBackend } from '../shared/supported-backends';
import { siteTheme } from '../shared/theme';

/**
 * Renders a single chart for one backend at its *designed* size (no width
 * clamp), so the photo-wall's {@link ScaleToFit} wrapper can scale it down to
 * fit a uniform bounding box. Unlike {@link TripleChart} there is no backend
 * toggle or card chrome — just the chart (or a compact error message).
 */
export function WallChart({
  testCase,
  backend,
  canvasSize,
}: {
  testCase: TestCase;
  backend: PreviewBackend;
  canvasSize?: CanvasSize;
}) {
  const input = useMemo(
    () => testCaseToAssemblyInput(testCase, canvasSize ?? thumbnailCanvasSize(testCase)),
    [testCase, canvasSize],
  );

  const compiled = useMemo(() => {
    try {
      if (backend === 'vegalite') return { ok: true as const, value: assembleVegaLite(input) };
      if (backend === 'echarts') return { ok: true as const, value: assembleECharts(input) };
      return { ok: true as const, value: assembleChartjs(input) };
    } catch (err) {
      return { ok: false as const, err };
    }
  }, [input, backend]);

  if (!compiled.ok) {
    return (
      <pre
        style={{
          color: siteTheme.error,
          fontSize: 11,
          whiteSpace: 'pre-wrap',
          margin: 0,
          maxWidth: 360,
        }}
      >
        {String((compiled.err as Error)?.message ?? compiled.err)}
      </pre>
    );
  }

  if (backend === 'vegalite') return <VegaLiteView spec={compiled.value} />;
  if (backend === 'echarts') return <EChartsView option={compiled.value} constrain={false} />;
  return <ChartjsView config={compiled.value} constrain={false} />;
}
