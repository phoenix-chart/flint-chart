// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  assembleVegaLite,
  assembleECharts,
  assembleChartjs,
  type ChartAssemblyInput,
  type ChartWarning,
} from 'flint-chart';
import {
  resolveDataSource,
  type DataSourceOptions,
} from './data-source.js';
import type { RenderBackend } from './types.js';

/** Maximum number of inline data rows accepted (DoS guard). */
export const MAX_DATA_ROWS = 100_000;

/** Maximum canvas dimension in pixels the host will honor (DoS guard). */
export const MAX_CANVAS_DIM = 4000;

const ASSEMBLERS: Record<
  RenderBackend,
  (input: ChartAssemblyInput) => any
> = {
  vegalite: assembleVegaLite,
  echarts: assembleECharts,
  chartjs: assembleChartjs,
};

export interface AssembleResult {
  /** The backend-native spec (still carrying Flint's private `_`-keys). */
  spec: any;
  /** Warnings emitted by the assembler. */
  warnings: ChartWarning[];
  /** Computed subplot width from the stretch model, if present. */
  width?: number;
  /** Computed subplot height from the stretch model, if present. */
  height?: number;
}

/**
 * Validate caller-supplied input before it reaches an assembler. Inline rows
 * pass through directly. Local `data.url` references are resolved only when the
 * server has explicit data roots; remote URLs stay blocked.
 */
export function validateInput(
  input: ChartAssemblyInput,
  options: DataSourceOptions = {},
): void {
  prepareInput(input, options);
}

/** Resolve data references and validate caller-supplied input. */
export function prepareInput(
  input: ChartAssemblyInput,
  options: DataSourceOptions = {},
): ChartAssemblyInput {
  if (input == null || typeof input !== 'object') {
    throw new Error('input must be a ChartAssemblyInput object');
  }
  const resolvedInput = resolveDataSource(input, {
    ...options,
    maxDataRows: MAX_DATA_ROWS,
  });
  const resolvedData: any = (resolvedInput as any).data;
  if (resolvedData == null || typeof resolvedData !== 'object') {
    throw new Error('input.data is required (provide { values: [...] })');
  }
  if (!Array.isArray(resolvedData.values)) {
    throw new Error(
      'input.data must provide inline values or a local data.url under configured data roots',
    );
  }
  if (resolvedData.values.length > MAX_DATA_ROWS) {
    throw new Error(
      `input.data.values has ${resolvedData.values.length} rows, exceeding the limit of ${MAX_DATA_ROWS}`,
    );
  }
  const cs: any = (resolvedInput as any).chart_spec;
  if (cs == null || typeof cs !== 'object' || typeof cs.chartType !== 'string') {
    throw new Error('input.chart_spec.chartType is required');
  }
  for (const field of ['baseSize', 'canvasSize'] as const) {
    const size = cs[field];
    if (size) {
      if (
        (typeof size.width === 'number' && size.width > MAX_CANVAS_DIM) ||
        (typeof size.height === 'number' && size.height > MAX_CANVAS_DIM)
      ) {
        throw new Error(
          `chart_spec.${field} exceeds the maximum dimension of ${MAX_CANVAS_DIM}px`,
        );
      }
    }
  }
  return resolvedInput;
}

/**
 * Assemble a Flint spec for one backend and split out Flint's private metadata
 * (`_warnings`, `_width`, `_height`). The returned `spec` is left untouched so
 * callers can choose to expose or strip the private keys.
 */
export function assembleForBackend(
  backend: RenderBackend,
  input: ChartAssemblyInput,
  options: DataSourceOptions = {},
): AssembleResult {
  const assemble = ASSEMBLERS[backend];
  if (!assemble) {
    throw new Error(`unknown backend: ${backend}`);
  }
  const resolvedInput = prepareInput(input, options);
  const spec = assemble(resolvedInput);
  const warnings: ChartWarning[] = Array.isArray(spec?._warnings)
    ? spec._warnings
    : [];
  const width = typeof spec?._width === 'number' ? spec._width : undefined;
  const height = typeof spec?._height === 'number' ? spec._height : undefined;
  return { spec, warnings, width, height };
}

/**
 * Remove Flint's private `_`-prefixed annotation keys from a top-level spec
 * object so it is render-ready and safe to surface to callers.
 */
export function stripPrivateKeys<T extends Record<string, any>>(spec: T): T {
  for (const key of Object.keys(spec)) {
    if (key.startsWith('_')) {
      delete (spec as Record<string, any>)[key];
    }
  }
  return spec;
}
