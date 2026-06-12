import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const asFinite = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/**
 * Chart.js renderer.
 *
 * The flint Chart.js assembler computes a designed canvas size (`_width`/`_height`)
 * that already reserves a gutter for the right-hand legend column. Render into a
 * wrapper sized to those dimensions so the plot and legend keep their designed
 * proportions — the same way Vega-Lite and ECharts now render at their natural
 * designed size. Previously the canvas stretched to a `100% × 260px` container,
 * which squished plots vertically (designed heights are often 400+) and made the
 * reserved legend gutter meaningless, so legends were mis-sized.
 *
 * NOTE: Chart.js + `responsive: true` recomputes canvas size from the parent on
 * every frame. If the parent isn't bounded (e.g. a flex column with
 * `min-height: 0`), the canvas grows unboundedly. The wrapper therefore keeps a
 * definite width/height; `maxWidth: 100%` prevents overflow on narrow viewports
 * while still letting Chart.js shrink responsively.
 */
export function ChartjsView({
  config,
  height = 320,
  constrain = true,
}: {
  config: any;
  height?: number;
  /** When false, render at the designed pixel size without clamping to the
   *  container width (used by the photo-wall, which scales charts to fit). */
  constrain?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const designedWidth = asFinite(config?._width);
  const designedHeight = asFinite(config?._height);
  const renderHeight = designedHeight ?? height;

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
    <div
      style={{
        position: 'relative',
        width: designedWidth != null ? designedWidth : '100%',
        height: renderHeight,
        maxWidth: constrain ? '100%' : undefined,
      }}
    >
      <canvas ref={ref} />
    </div>
  );
}
