import { useEffect, useMemo, useRef } from 'react';
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
 * Faceted charts (column/row encodings) are assembled into a `_facet` config that
 * holds a grid of per-panel Chart.js configs instead of a single one. Those are
 * rendered by {@link ChartjsFacetView}; feeding the `_facet` config straight to a
 * single `new Chart(...)` (the old behaviour) produced a blank canvas because it
 * has no top-level `type`/`data`.
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
  if (config?._facet) {
    return <ChartjsFacetView config={config} constrain={constrain} />;
  }
  return <ChartjsSingleView config={config} height={height} constrain={constrain} />;
}

function ChartjsSingleView({
  config,
  height,
  constrain,
}: {
  config: any;
  height: number;
  constrain: boolean;
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

/** One faceted panel: a Chart.js config rendered into a fixed-size canvas. */
function FacetPanel({ config, width, height }: { config: any; width: number; height: number }) {
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
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={ref} />
    </div>
  );
}

const FACET_GAP = 16;

/**
 * Renders a faceted Chart.js config: a grid of small-multiple panels with
 * optional column/row headers and a shared legend. Panel positions reproduce the
 * designed `_width`/`_height` computed by the assembler so the photo-wall's
 * `ScaleToFit` can scale the whole figure to fit.
 */
function ChartjsFacetView({ config, constrain }: { config: any; constrain: boolean }) {
  const panelRows: any[][] = config?._facetPanels ?? [];
  const flat = panelRows.flat();

  const refPanel = flat[0]?.config;
  const panelW = asFinite(refPanel?._width) ?? 300;
  const panelH = asFinite(refPanel?._height) ?? 240;

  const rows = asFinite(config?._facetRows) ?? panelRows.length;
  const cols = asFinite(config?._facetCols) ?? Math.max(1, ...panelRows.map((r) => r.length));

  const hasColHeader = flat.some((p) => p?.colHeader != null);
  const hasRowHeader = flat.some((p) => p?.rowHeader != null);
  const colHeaderH = hasColHeader ? 22 : 0;
  const rowHeaderW = hasRowHeader ? 28 : 0;

  const bodyW = rowHeaderW + cols * panelW + (cols - 1) * FACET_GAP;
  const bodyH = colHeaderH + rows * panelH + (rows - 1) * FACET_GAP;

  const sharedY = config?._facetSharedYDomain as { min: number; max: number } | undefined;
  const legend = (config?._facetLegend ?? []) as Array<{ label: string; color: string }>;

  // Apply the shared y-domain to every panel so all small multiples share one
  // scale (the assembler computes the domain but leaves it to the renderer).
  const panels = useMemo(() => {
    return flat.map((p) => {
      if (!sharedY) return p;
      const cfg = {
        ...p.config,
        options: {
          ...(p.config?.options ?? {}),
          scales: {
            ...(p.config?.options?.scales ?? {}),
            y: {
              ...(p.config?.options?.scales?.y ?? {}),
              min: sharedY.min,
              max: sharedY.max,
            },
          },
        },
      };
      return { ...p, config: cfg };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const colHeaders = hasColHeader
    ? Array.from({ length: cols }, (_, ci) => panelRows[0]?.[ci]?.colHeader ?? '')
    : [];
  const rowHeaders = hasRowHeader
    ? Array.from({ length: rows }, (_, ri) => panelRows[ri]?.[0]?.rowHeader ?? '')
    : [];

  return (
    <div
      style={{
        width: bodyW,
        maxWidth: constrain ? '100%' : undefined,
        fontSize: 11,
        color: '#444',
      }}
    >
      {legend.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '4px 14px',
            marginBottom: 8,
          }}
        >
          {legend.map((item) => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: item.color,
                  display: 'inline-block',
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', width: bodyW, height: bodyH }}>
        {/* Column headers */}
        {colHeaders.map((label, ci) => (
          <div
            key={`ch-${ci}`}
            style={{
              position: 'absolute',
              left: rowHeaderW + ci * (panelW + FACET_GAP),
              top: 0,
              width: panelW,
              height: colHeaderH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </div>
        ))}

        {/* Row headers */}
        {rowHeaders.map((label, ri) => (
          <div
            key={`rh-${ri}`}
            style={{
              position: 'absolute',
              left: 0,
              top: colHeaderH + ri * (panelH + FACET_GAP),
              width: rowHeaderW,
              height: panelH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {label}
          </div>
        ))}

        {/* Panels */}
        {panels.map((p) => (
          <div
            key={p.key}
            style={{
              position: 'absolute',
              left: rowHeaderW + p.colIndex * (panelW + FACET_GAP),
              top: colHeaderH + p.rowIndex * (panelH + FACET_GAP),
            }}
          >
            <FacetPanel config={p.config} width={panelW} height={panelH} />
          </div>
        ))}
      </div>
    </div>
  );
}
