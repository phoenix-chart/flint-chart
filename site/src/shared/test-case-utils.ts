import type { TestCase } from 'flint-chart/test-data';

function buildEncodingsFromTestCase(t: TestCase): Record<string, unknown> {
  const idToName = new Map(t.fields.map((f) => [f.id, f.name]));
  const encodings: Record<string, unknown> = {};
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
  return encodings;
}

/** semantic_types + chart_spec (chartType, encodings) — no data payload. */
export function testCaseToFlintSummary(t: TestCase) {
  const semantic_types: Record<string, string> = {};
  for (const [k, m] of Object.entries(t.metadata)) semantic_types[k] = m.semanticType;

  const rawEncodings = buildEncodingsFromTestCase(t);
  const encodings: Record<string, Record<string, unknown>> = {};
  for (const [channel, enc] of Object.entries(rawEncodings)) {
    if (!enc || typeof enc !== 'object') continue;
    const e = enc as Record<string, unknown>;
    const slim: Record<string, unknown> = { field: e.field };
    for (const key of ['aggregate', 'sortOrder', 'sortBy', 'scheme'] as const) {
      if (e[key] != null && e[key] !== '') slim[key] = e[key];
    }
    encodings[channel] = slim;
  }

  return {
    semantic_types,
    chart_spec: {
      chartType: t.chartType,
      encodings,
    },
  };
}

/** Convert a gallery TestCase into a flat ChartAssemblyInput for the editor. */
export function testCaseToAssemblyInput(t: TestCase) {
  const encodings = buildEncodingsFromTestCase(t);
  const semantic_types: Record<string, string> = {};
  for (const [k, m] of Object.entries(t.metadata)) semantic_types[k] = m.semanticType;

  return {
    data: { values: t.data },
    semantic_types,
    chart_spec: {
      chartType: t.chartType,
      encodings,
      canvasSize: { width: 480, height: 320 },
      chartProperties: t.chartProperties,
    },
    options: t.assembleOptions,
    semantic_annotations: t.semanticAnnotations,
  } as any;
}
