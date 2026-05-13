import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { SiteShell } from '../components/SiteShell';
import { VegaLiteView } from '../components/VegaLiteView';
import { EChartsView } from '../components/EChartsView';
import { ChartjsView } from '../components/ChartjsView';
import { EXAMPLES } from './editor-examples';

type Backend = 'vegalite' | 'echarts' | 'chartjs';

/**
 * Live editor — JSON ChartAssemblyInput on the left, rendered backend on the
 * right (toggle between Vega-Lite / ECharts / Chart.js, optional compiled spec).
 */
export function Editor() {
  const [text, setText] = useState<string>(JSON.stringify(EXAMPLES[0].input, null, 2));
  const [backend, setBackend] = useState<Backend>('vegalite');
  const [showSpec, setShowSpec] = useState(false);

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(text) };
    } catch (err) {
      return { ok: false as const, err };
    }
  }, [text]);

  const compiled = useMemo(() => {
    if (!parsed.ok) return { ok: false as const, err: parsed.err };
    try {
      const input = parsed.value;
      if (backend === 'vegalite') return { ok: true as const, value: assembleVegaLite(input) };
      if (backend === 'echarts') return { ok: true as const, value: assembleECharts(input) };
      return { ok: true as const, value: assembleChartjs(input) };
    } catch (err) {
      return { ok: false as const, err };
    }
  }, [parsed, backend]);

  return (
    <SiteShell title="Editor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
        {/* ──────────────── editor pane ──────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #e1e4e8' }}>
          <header
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e1e4e8',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#57606a' }}>example:</span>
            <select
              onChange={(e) => {
                const ex = EXAMPLES.find((x) => x.name === e.target.value);
                if (ex) setText(JSON.stringify(ex.input, null, 2));
              }}
              defaultValue={EXAMPLES[0].name}
            >
              {EXAMPLES.map((ex) => (
                <option key={ex.name} value={ex.name}>
                  {ex.name}
                </option>
              ))}
            </select>
          </header>
          <CodeMirror
            value={text}
            height="100%"
            style={{ flex: 1, overflow: 'auto', fontSize: 13 }}
            extensions={[json()]}
            onChange={setText}
          />
          {!parsed.ok && (
            <pre style={{ color: '#cf222e', margin: 0, padding: 8, borderTop: '1px solid #e1e4e8' }}>
              JSON error: {String((parsed.err as Error).message)}
            </pre>
          )}
        </section>

        {/* ──────────────── render pane ──────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <header
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e1e4e8',
              background: '#fff',
              display: 'flex',
              gap: 8,
            }}
          >
            {(['vegalite', 'echarts', 'chartjs'] as Backend[]).map((b) => (
              <button
                key={b}
                onClick={() => setBackend(b)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #d0d7de',
                  borderRadius: 4,
                  background: backend === b ? '#0969da' : '#fff',
                  color: backend === b ? '#fff' : '#1f2328',
                  cursor: 'pointer',
                }}
              >
                {b}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <label style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                checked={showSpec}
                onChange={(e) => setShowSpec(e.target.checked)}
              />{' '}
              show compiled spec
            </label>
          </header>

          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {compiled.ok ? (
              <>
                {backend === 'vegalite' && <VegaLiteView spec={compiled.value} />}
                {backend === 'echarts' && <EChartsView option={compiled.value} height={360} />}
                {backend === 'chartjs' && <ChartjsView config={compiled.value} height={360} />}
                {showSpec && (
                  <pre
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: '#f6f8fa',
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 11,
                    }}
                  >
                    {JSON.stringify(compiled.value, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <pre style={{ color: '#cf222e' }}>
                Compile error: {String((compiled.err as Error)?.message ?? compiled.err)}
              </pre>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
