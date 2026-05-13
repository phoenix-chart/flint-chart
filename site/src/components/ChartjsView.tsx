import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Chart.js renderer.
 *
 * NOTE: Chart.js + `responsive: true` (the default) recomputes canvas size
 * from the parent container on every frame. If the parent isn't bounded
 * (e.g. a flex column with `min-height: 0`), the canvas grows unboundedly
 * each tick. We pin the canvas inside a fixed-height wrapper and disable
 * `maintainAspectRatio` so width can flex but height stays fixed.
 */
export function ChartjsView({ config, height = 260 }: { config: any; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const merged = {
      ...config,
      options: {
        ...(config?.options ?? {}),
        responsive: true,
        maintainAspectRatio: false,
      },
    };
    const chart = new Chart(ref.current, merged);
    return () => chart.destroy();
  }, [config]);
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas ref={ref} />
    </div>
  );
}
