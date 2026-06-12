import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Shrink-to-fit thumbnail wrapper for the photo-wall.
 *
 * Charts render at their *designed* pixel size (which varies widely — wide
 * legends, tall calendars, square pies, etc.). This wrapper measures the
 * child's natural layout size (`offsetWidth/Height`, which ignore CSS
 * transforms) and applies a uniform `scale()` so the whole chart always *fits*
 * inside the fixed bounding box — never cropping axes or legends and never
 * upscaling past the designed size (capped at 1).
 *
 * On hover, *only* charts whose aspect ratio mismatches the tile (so contain
 * fitting leaves a letterbox gap) grow slightly to reveal more — a Vega-Lite-
 * gallery-style affordance — bounded so they never upscale past their designed
 * size. Charts that already fill the tile stay static, so the hover never
 * clips a well-fitted chart or animates pointlessly.
 */
export function ChartThumb({
  height,
  hovered = false,
  padding = 8,
  children,
}: {
  /** Fixed height of the bounding box in px. Width fills the container. */
  height: number;
  /** Drives the gentle hover zoom (owned by the parent card). */
  hovered?: boolean;
  /** Inner padding kept clear around the fitted chart. */
  padding?: number;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoverScale, setHoverScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const natW = inner.offsetWidth;
      const natH = inner.offsetHeight;
      if (!natW || !natH) return;
      const boxW = outer.clientWidth - padding * 2;
      const boxH = height - padding * 2;
      const sw = boxW / natW;
      const sh = boxH / natH;
      // Contain-fit: whole chart visible, never upscaled past its designed size.
      const contain = Math.min(sw, sh, 1);
      if (!Number.isFinite(contain) || contain <= 0) return;

      // The hover "reveal" only makes sense when the chart's aspect ratio
      // mismatches the tile — i.e. contain-fitting leaves a noticeable letterbox
      // gap in one dimension. Charts that already fill the tile (matching aspect)
      // would just clip on zoom, which reads as broken, so they stay static.
      const cover = Math.max(sw, sh); // fills the box, cropping the overflow dim
      const aspectMismatch = cover / Math.min(sw, sh); // >= 1
      const hover =
        aspectMismatch > 1.25 ? Math.min(contain * 1.18, cover, 1) : contain;

      setScale((prev) => (Math.abs(prev - contain) > 0.005 ? contain : prev));
      setHoverScale((prev) => (Math.abs(prev - hover) > 0.005 ? hover : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [height, padding]);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Fit scale applies instantly (no transition) so entering the page never
          animates the initial shrink. */}
      <div
        style={{
          position: 'absolute',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Only the hover zoom animates. */}
        <div
          ref={innerRef}
          style={{
            transform: `scale(${hovered && scale > 0 ? hoverScale / scale : 1})`,
            transformOrigin: 'center center',
            transition: 'transform 300ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
