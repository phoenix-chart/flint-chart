import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Vega-Lite-gallery-style thumbnail wrapper for the photo-wall.
 *
 * Charts render at their *designed* pixel size (which varies widely — wide
 * legends, tall calendars, square pies…). Rather than shrink every chart to
 * fit (which leaves ragged letterbox gaps and tiny charts), this wrapper
 * *fills* the tile and crops the overflow — exactly like the Vega-Lite example
 * gallery. At rest the top-left of the chart is shown; on hover it slowly pans
 * to reveal the cropped edge (the x-axis at the bottom, or the legend on the
 * right), so every tile reads as a clean, uniform thumbnail.
 *
 * The fit (scale + rest offset) applies instantly so entering the page never
 * animates; only the hover pan is transitioned.
 */
export function ChartThumb({
  height,
  hovered = false,
  children,
}: {
  /** Fixed height of the bounding box in px. Width fills the container. */
  height: number;
  /** Drives the hover pan-to-reveal (owned by the parent card). */
  hovered?: boolean;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, restX: 0, restY: 0, panX: 0, panY: 0 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const natW = inner.offsetWidth;
      const natH = inner.offsetHeight;
      if (!natW || !natH) return;
      const boxW = outer.clientWidth;
      const boxH = height;
      const sw = boxW / natW;
      const sh = boxH / natH;
      // Cover-fit: fill the tile, cropping the overflowing dimension. Never
      // upscale past the designed size (so charts smaller than the tile just
      // sit centred rather than blowing up blurry).
      const scale = Math.min(Math.max(sw, sh), 1);
      if (!Number.isFinite(scale) || scale <= 0) return;

      const contentW = natW * scale;
      const contentH = natH * scale;
      const overflowX = Math.max(contentW - boxW, 0);
      const overflowY = Math.max(contentH - boxH, 0);
      // Overflowing axis: rest at the start, pan to the end on hover. Other
      // axis: centre it (no pan).
      const restX = overflowX > 0 ? 0 : (boxW - contentW) / 2;
      const restY = overflowY > 0 ? 0 : (boxH - contentH) / 2;
      const panX = overflowX > 0 ? -overflowX / scale : 0;
      const panY = overflowY > 0 ? -overflowY / scale : 0;

      setFit((prev) => {
        const next = { scale, restX, restY, panX, panY };
        const same = (Object.keys(next) as (keyof typeof next)[]).every(
          (k) => Math.abs(prev[k] - next[k]) < 0.5,
        );
        return same ? prev : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [height]);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
      }}
    >
      {/* Fit (scale + rest position) applies instantly — no entry animation. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${fit.restX}px, ${fit.restY}px) scale(${fit.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Only the hover pan animates. */}
        <div
          ref={innerRef}
          style={{
            transform: hovered ? `translate(${fit.panX}px, ${fit.panY}px)` : 'none',
            transformOrigin: '0 0',
            transition: 'transform 900ms ease-in-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
