import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export function EChartsView({ option }: { option: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.setOption(option);
    return () => chart.dispose();
  }, [option]);
  return <div ref={ref} style={{ width: '100%', height: 360 }} />;
}
