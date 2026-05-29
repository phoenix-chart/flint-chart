import type { TestCase } from 'flint-chart/test-data';

/** Convert a gallery TestCase into a flat ChartAssemblyInput for the editor. */
export function testCaseToAssemblyInput(t: TestCase) {
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
