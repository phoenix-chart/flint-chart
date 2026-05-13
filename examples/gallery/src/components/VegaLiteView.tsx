import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

export function VegaLiteView({ spec }: { spec: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    embed(ref.current, spec, { actions: false, renderer: 'canvas' }).catch((err) => {
      if (!cancelled) console.error('vega-embed failed', err);
    });
    return () => {
      cancelled = true;
    };
  }, [spec]);
  return <div ref={ref} />;
}
