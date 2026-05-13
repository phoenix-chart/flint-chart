import { useMemo, useState } from 'react';
import { TEST_GENERATORS } from 'flint-chart/test-data';
import { SiteShell } from '../components/SiteShell';
import { TripleChart } from '../components/TripleChart';

/**
 * Chart gallery — lists every generator from `test-data/`, renders its first
 * test cases across all three Vega-Lite / ECharts / Chart.js backends.
 */
export function Gallery() {
  const groups = useMemo(() => Object.keys(TEST_GENERATORS).sort(), []);
  const [selected, setSelected] = useState<string>(groups[0] ?? '');

  const tests = useMemo(() => {
    if (!selected) return [];
    try {
      return TEST_GENERATORS[selected]?.() ?? [];
    } catch (err) {
      console.error('test generator failed', selected, err);
      return [];
    }
  }, [selected]);

  return (
    <SiteShell title="Gallery">
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, minHeight: 0 }}>
        <aside
          style={{
            borderRight: '1px solid #e1e4e8',
            overflowY: 'auto',
            background: '#fff',
            padding: '8px 0',
          }}
        >
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelected(g)}
              style={{
                display: 'block',
                width: '100%',
                padding: '4px 12px',
                border: 0,
                textAlign: 'left',
                background: g === selected ? '#ddf4ff' : 'transparent',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {g}
            </button>
          ))}
        </aside>

        <main style={{ overflowY: 'auto', padding: 16 }}>
          <header style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{selected}</h2>
            <p style={{ margin: '4px 0 0', color: '#57606a' }}>
              {tests.length} test case{tests.length === 1 ? '' : 's'}
            </p>
          </header>

          {tests.slice(0, 6).map((t, i) => (
            <section
              key={i}
              style={{
                marginBottom: 24,
                padding: 12,
                background: '#fff',
                border: '1px solid #e1e4e8',
                borderRadius: 6,
              }}
            >
              <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>{t.title}</h3>
              <p style={{ margin: '0 0 8px', color: '#57606a', fontSize: 12 }}>{t.description}</p>
              <TripleChart testCase={t} />
            </section>
          ))}
        </main>
      </div>
    </SiteShell>
  );
}
