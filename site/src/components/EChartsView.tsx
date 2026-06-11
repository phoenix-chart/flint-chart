import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { siteTheme } from '../shared/theme';

const asFinite = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

export function EChartsView({ option, height }: { option: any; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The flint ECharts assembler computes a designed canvas size (`_width`/`_height`)
  // and positions legends / visualMaps with absolute pixels relative to it — the same
  // way Vega-Lite sizes its plot area and lets the SVG wrap around it. Render at those
  // dimensions so the legend lands where it was designed, instead of snapping to the
  // live container's bounding box (which made rose legends drift far right, streamgraph
  // legends overlap the plot, and heatmap colour bars float below a stretched plot).
  const designedWidth = asFinite(option?._width);
  const designedHeight = asFinite(option?._height);
  const renderHeight = designedHeight ?? height ?? 320;

  useEffect(() => {
    if (!ref.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current, undefined, {
        renderer: 'canvas',
        width: designedWidth,
        height: renderHeight,
      });
    } else {
      chartRef.current.resize({
        width: designedWidth ?? 'auto',
        height: renderHeight,
      });
    }

    setError(null);
    try {
      chartRef.current.setOption(option, { notMerge: true });
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    }
  }, [option, designedWidth, renderHeight]);

  useEffect(() => {
    const chart = chartRef.current;
    return () => {
      chart?.dispose();
      chartRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <pre style={{ color: siteTheme.error, fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>
        {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        width: designedWidth != null ? designedWidth : '100%',
        height: renderHeight,
        maxWidth: '100%',
      }}
    />
  );
};
