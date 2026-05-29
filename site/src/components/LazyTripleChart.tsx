import { useEffect, useRef, useState } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { TripleChart } from './TripleChart';
import { siteTheme } from '../shared/theme';

/** Defer chart rendering until the card scrolls into view. */
export function LazyTripleChart({ testCase }: { testCase: TestCase }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: 280 }}>
      {visible ? (
        <TripleChart testCase={testCase} />
      ) : (
        <div
          style={{
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: siteTheme.textMuted,
            fontSize: 13,
            border: `1px dashed ${siteTheme.border}`,
            borderRadius: siteTheme.radius,
            background: siteTheme.bg,
          }}
        >
          Loading chart…
        </div>
      )}
    </div>
  );
}
