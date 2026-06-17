// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { assembleVegaLite } from '../src';
import { genLineTests } from '../src/test-data';
import type { TestCase } from '../src/test-data/types';

function toInput(tc: TestCase) {
  const encodings: Record<string, string> = {};
  for (const [channel, item] of Object.entries(tc.encodingMap)) {
    const field = tc.fields.find((f) => f.id === (item as any).fieldID);
    if (field) encodings[channel] = field.name;
  }
  const semantic_types: Record<string, string> = {};
  for (const [name, meta] of Object.entries(tc.metadata)) {
    semantic_types[name] = meta.semanticType;
  }
  return {
    data: { values: tc.data },
    semantic_types,
    chart_spec: {
      chartType: tc.chartType,
      encodings,
      canvasSize: { width: 560, height: 360 },
    },
  };
}

describe('Vega-Lite Line Chart — continuous color', () => {
  const cases = genLineTests();

  it('uses a neutral line layer plus colored points for O×Q + color(Q)', () => {
    const tc = cases.find((t) => t.description === 'Ordinal + continuous color gradient')!;
    const spec = assembleVegaLite(toInput(tc)) as any;

    expect(spec.layer).toHaveLength(2);
    expect(spec.layer[0].mark.type).toBe('line');
    expect(spec.layer[0].mark.color).toBe('#cccccc');
    expect(spec.layer[0].encoding.color).toBeUndefined();
    expect(spec.layer[0].encoding.x.field).toBe('Stage');
    expect(spec.layer[0].encoding.y.field).toBe('Value');

    expect(spec.layer[1].mark.type).toBe('point');
    expect(spec.layer[1].encoding.color.field).toBe('ColorVal');
    expect(spec.layer[1].encoding.color.type).toBe('quantitative');
  });

  it('uses a neutral line layer plus colored points for T×Q + color(Q)', () => {
    const tc = cases.find((t) => t.description === 'Continuous color gradient on time series')!;
    const spec = assembleVegaLite(toInput(tc)) as any;

    expect(spec.layer).toHaveLength(2);
    expect(spec.layer[0].encoding.color).toBeUndefined();
    expect(spec.layer[1].encoding.color.field).toBe('ColorVal');
  });

  it('keeps a single line mark for discrete color series', () => {
    const tc = cases.find((t) => t.description === '4 series × 50 dates — smooth random walks')!;
    const spec = assembleVegaLite(toInput(tc)) as any;

    expect(spec.mark).toBe('line');
    expect(spec.layer).toBeUndefined();
    expect(spec.encoding.color.field).toBeDefined();
  });
});
