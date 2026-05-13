import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

export function VegaLiteView({ spec }: { spec: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    embed(ref.current, spec, { actions: false, renderer: 'canvas' }).catch(console.error);
  }, [spec]);
  return <div ref={ref} />;
}
