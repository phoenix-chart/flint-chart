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

  it('line chart with quantitative color uses gray line + colored points layer', () => {
    const spec = assembleVegaLite({
      data: {
        values: [
          { Date: '2019-12-31', Value: 117, ColorVal: 2.4 },
          { Date: '2020-02-05', Value: 109, ColorVal: 1.9 },
        ],
      },
      semantic_types: { Date: 'Date', Value: 'Quantity', ColorVal: 'Quantity' },
      chart_spec: {
        chartType: 'Line Chart',
        encodings: {
          x: { field: 'Date' },
          y: { field: 'Value' },
          color: { field: 'ColorVal' },
        },
        canvasSize: { width: 480, height: 320 },
      },
    }) as any;

    expect(spec.layer).toHaveLength(2);
    expect(spec.layer[0].mark.type ?? spec.layer[0].mark).toBe('line');
    expect(spec.layer[0].mark.color).toBe('#888888');
    expect(spec.layer[0].encoding?.color).toBeUndefined();
    expect(spec.encoding.x?.field).toBe('Date');
    expect(spec.encoding.y?.field).toBe('Value');
    expect(spec.layer[1].mark.type).toBe('circle');
    expect(spec.layer[1].encoding.color?.field).toBe('ColorVal');
  });

  it('chart.js line with quantitative color uses neutral stroke + per-point fill on one dataset', () => {
    const config = assembleChartjs({
      data: {
        values: [
          { Date: '2019-12-31', Value: 117, ColorVal: 2.4 },
          { Date: '2020-02-05', Value: 109, ColorVal: 9.5 },
        ],
      },
      semantic_types: { Date: 'Date', Value: 'Quantity', ColorVal: 'Quantity' },
      chart_spec: {
        chartType: 'Line Chart',
        encodings: {
          x: { field: 'Date' },
          y: { field: 'Value' },
          color: { field: 'ColorVal' },
        },
        canvasSize: { width: 480, height: 320 },
      },
    }) as any;

    expect(config.data.datasets).toHaveLength(1);
    expect(config.data.datasets[0].borderColor).toBe('#888888');
    expect(config.data.datasets[0].pointRadius).toBe(4);
    expect(config.data.datasets[0].pointBackgroundColor).toHaveLength(2);
  });
});
