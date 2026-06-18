// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  assembleVegaLite,
  assembleECharts,
  assembleChartjs,
  type ChartAssemblyInput,
  type ChartWarning,
} from 'flint-chart';
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
 * Validate caller-supplied input before it reaches an assembler.
 *
 * v1 policy: inline data only. Remote `data.url` fetching is deferred behind a
 * future allowlist to avoid SSRF, so it is rejected here with a clear message.
 */
export function validateInput(input: ChartAssemblyInput): void {
  if (input == null || typeof input !== 'object') {
    throw new Error('input must be a ChartAssemblyInput object');
  }
  const data: any = (input as any).data;
  if (data == null || typeof data !== 'object') {
    throw new Error('input.data is required (provide { values: [...] })');
  }
  if (typeof data.url === 'string') {
    throw new Error(
      'remote data.url fetching is disabled in this server; pass inline data.values instead',
    );
  }
  if (!Array.isArray(data.values)) {
    throw new Error('input.data.values must be an array of row objects');
  }
  if (data.values.length > MAX_DATA_ROWS) {
    throw new Error(
      `input.data.values has ${data.values.length} rows, exceeding the limit of ${MAX_DATA_ROWS}`,
    );
  }
  const cs: any = (input as any).chart_spec;
  if (cs == null || typeof cs !== 'object' || typeof cs.chartType !== 'string') {
    throw new Error('input.chart_spec.chartType is required');
  }
  const size = cs.canvasSize;
  if (size) {
    if (
      (typeof size.width === 'number' && size.width > MAX_CANVAS_DIM) ||
      (typeof size.height === 'number' && size.height > MAX_CANVAS_DIM)
    ) {
      throw new Error(
        `chart_spec.canvasSize exceeds the maximum dimension of ${MAX_CANVAS_DIM}px`,
      );
    }
  }
}

/**
 * Assemble a Flint spec for one backend and split out Flint's private metadata
 * (`_warnings`, `_width`, `_height`). The returned `spec` is left untouched so
 * callers can choose to expose or strip the private keys.
 */
export function assembleForBackend(
  backend: RenderBackend,
  input: ChartAssemblyInput,
): AssembleResult {
  const assemble = ASSEMBLERS[backend];
  if (!assemble) {
    throw new Error(`unknown backend: ${backend}`);
  }
  validateInput(input);
  const spec = assemble(input);
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
