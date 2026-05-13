import { useMemo } from 'react';
import type { TestCase } from 'flint-chart/test-data';
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';
import { VegaLiteView } from './VegaLiteView';
import { EChartsView } from './EChartsView';
import { ChartjsView } from './ChartjsView';

/**
 * Renders one TestCase across all three backends side-by-side.
 *
 * NOTE: the DF-flavored TestCase carries `encodingMap` keyed by fieldID +
 * an external `fields[]` list. The shim below resolves those into
 * library-flat encodings (channel → { field }). Once we drop DF-shaped
 * TestCase in favor of a leaner gallery-native shape, this shim goes away.
 */
export function TripleChart({ testCase }: { testCase: TestCase }) {
  const input = useMemo(() => testCaseToAssemblyInput(testCase), [testCase]);

  const vl = useMemo(() => safe(() => assembleVegaLite(input)), [input]);
  const ec = useMemo(() => safe(() => assembleECharts(input)), [input]);
  const cj = useMemo(() => safe(() => assembleChartjs(input)), [input]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <Panel title="Vega-Lite">{vl.ok ? <VegaLiteView spec={vl.value} /> : <Err err={vl.err} />}</Panel>
      <Panel title="ECharts">{ec.ok ? <EChartsView option={ec.value} /> : <Err err={ec.err} />}</Panel>
      <Panel title="Chart.js">{cj.ok ? <ChartjsView config={cj.value} /> : <Err err={cj.err} />}</Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #eaeef2', borderRadius: 4, padding: 8 }}>
      <div style={{ fontSize: 11, color: '#57606a', marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function Err({ err }: { err: unknown }) {
  return (
    <pre style={{ color: '#cf222e', fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>
      {String((err as Error)?.message ?? err)}
    </pre>
  );
}

function safe<T>(fn: () => T): { ok: true; value: T } | { ok: false; err: unknown } {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, err };
  }
}

// ---- TestCase → ChartAssemblyInput shim ------------------------------------

function testCaseToAssemblyInput(t: TestCase) {
  const idToName = new Map(t.fields.map((f) => [f.id, f.name]));
  const encodings: Record<string, any> = {};
  for (const [channel, e] of Object.entries(t.encodingMap)) {
    if (!e?.fieldID) continue;
    const field = idToName.get(e.fieldID) ?? e.fieldID;
    encodings[channel] = {
      field,
      type: e.dtype,
      aggregate: e.aggregate,
      sortOrder: e.sortOrder,
      sortBy: e.sortBy,
      scheme: e.scheme,
    };
  }
  const semantic_types: Record<string, string> = {};
  for (const [k, m] of Object.entries(t.metadata)) semantic_types[k] = m.semanticType;

  return {
    data: { values: t.data },
    semantic_types,
    chart_spec: {
      chartType: t.chartType,
      encodings,
      canvasSize: { width: 360, height: 240 },
      chartProperties: t.chartProperties,
    },
    options: t.assembleOptions,
    semantic_annotations: t.semanticAnnotations,
  } as any;
}
