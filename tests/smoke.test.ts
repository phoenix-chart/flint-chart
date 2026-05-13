// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import {
  assembleVegaLite,
  assembleECharts,
  assembleChartjs,
  assembleGoFish,
} from '../src';

const DATA = [
  { weight: 1.6, mpg: 32, origin: 'JP' },
  { weight: 2.1, mpg: 27, origin: 'US' },
  { weight: 1.9, mpg: 29, origin: 'EU' },
];

const INPUT = {
  data: { values: DATA },
  semantic_types: { weight: 'Quantity', mpg: 'Quantity', origin: 'Country' },
  chart_spec: {
    chartType: 'Scatter Plot',
    encodings: {
      x: { field: 'weight' },
      y: { field: 'mpg' },
      color: { field: 'origin' },
    },
    canvasSize: { width: 400, height: 300 },
  },
};

describe('public API smoke', () => {
  it('assembleVegaLite returns a Vega-Lite spec', () => {
    const spec = assembleVegaLite(INPUT) as any;
    expect(spec).toBeDefined();
    expect(spec.$schema ?? spec.encoding ?? spec.layer ?? spec.mark).toBeDefined();
  });

  it('assembleECharts returns an option object', () => {
    const option = assembleECharts(INPUT) as any;
    expect(option).toBeDefined();
    expect(typeof option).toBe('object');
  });

  it('assembleChartjs returns a config object', () => {
    const config = assembleChartjs(INPUT) as any;
    expect(config).toBeDefined();
    expect(config.type ?? config.data ?? config.options).toBeDefined();
  });

  it('assembleGoFish returns a spec object', () => {
    const spec = assembleGoFish(INPUT) as any;
    expect(spec).toBeDefined();
  });
});
