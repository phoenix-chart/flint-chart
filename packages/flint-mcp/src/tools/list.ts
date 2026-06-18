// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  vlAllTemplateDefs,
  ecAllTemplateDefs,
  cjsAllTemplateDefs,
  type ChartTemplateDef,
} from 'flint-chart';
import type { RenderBackend } from '../render/types.js';

const REGISTRY: Record<RenderBackend, ChartTemplateDef[]> = {
  vegalite: vlAllTemplateDefs,
  echarts: ecAllTemplateDefs,
  chartjs: cjsAllTemplateDefs,
};

export interface ChartTypeInfo {
  chartType: string;
  /** Encoding channels this chart type accepts (e.g. x, y, color, size). */
  channels: string[];
}

export interface BackendCatalog {
  backend: RenderBackend;
  count: number;
  chartTypes: ChartTypeInfo[];
}

/**
 * Enumerate the chart-type catalog (chart type + accepted channels) for one
 * backend, or for all supported backends when `backend` is omitted.
 */
export function listChartTypes(backend?: RenderBackend): BackendCatalog[] {
  const backends: RenderBackend[] = backend
    ? [backend]
    : (Object.keys(REGISTRY) as RenderBackend[]);
  return backends.map((b) => {
    const defs = REGISTRY[b] ?? [];
    const chartTypes = defs
      .map((d) => ({ chartType: d.chart, channels: d.channels ?? [] }))
      .sort((a, b2) => a.chartType.localeCompare(b2.chartType));
    return { backend: b, count: chartTypes.length, chartTypes };
  });
}
