import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { siteTheme } from '../shared/theme';

export function EChartsView({ option, height = 260 }: { option: any; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    }

    setError(null);
    try {
      chartRef.current.setOption(option, { notMerge: true });
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    }
  }, [option]);

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

  return <div ref={ref} style={{ width: '100%', height }} />;
};
