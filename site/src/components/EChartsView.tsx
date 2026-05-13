import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export function EChartsView({ option, height = 260 }: { option: any; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.setOption(option);
    return () => chart.dispose();
  }, [option]);
  return <div ref={ref} style={{ width: '100%', height }} />;
}
