import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Shrink-to-fit wrapper for the photo-wall.
 *
 * Charts render at their *designed* pixel size (which varies widely — wide
 * legends, tall calendars, etc.). This wrapper measures the child's natural
 * layout size (via `offsetWidth/Height`, which ignore CSS transforms) and
 * applies a uniform `scale()` so the chart always fits inside a fixed bounding
 * box without overflowing or distorting its aspect ratio. Charts never scale
 * *up* past their designed size (capped at 1).
 */
export function ScaleToFit({
  height,
  padding = 0,
  children,
}: {
  /** Fixed height of the bounding box in px. Width fills the container. */
  height: number;
  /** Inner padding kept clear around the scaled chart. */
  padding?: number;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
      const next = Math.min(boxW / natW, boxH / natH, 1);
      if (Number.isFinite(next) && next > 0) {
        setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
      }
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
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
