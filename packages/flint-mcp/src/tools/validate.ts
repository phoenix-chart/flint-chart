// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ChartAssemblyInput, ChartWarning } from 'flint-chart';
import { assembleForBackend } from '../render/assemble.js';
import type { RenderBackend } from '../render/types.js';

export interface ValidateResult {
  backend: RenderBackend;
  chartType: string;
  /** True when assembly succeeded with no error-severity warnings. */
  valid: boolean;
  /** All warnings (info/warning/error) emitted during assembly. */
  warnings: ChartWarning[];
  /** Error-severity warnings plus any thrown assembly failure. */
  errors: ChartWarning[];
  /** Computed layout size from Flint's stretch model, if available. */
  computedSize?: { width: number; height: number };
}

/**
 * Validate a {@link ChartAssemblyInput} for a backend: report warnings/errors,
 * applicability, and the computed layout size. Never throws — assembly failures
 * are surfaced as an error entry. Pure JS — no native dependencies.
 */
export function validateChart(
  input: ChartAssemblyInput,
  backend: RenderBackend,
): ValidateResult {
  const chartType = input?.chart_spec?.chartType ?? '(unknown)';
  try {
    const { warnings, width, height } = assembleForBackend(backend, input);
    const errors = warnings.filter((w) => w.severity === 'error');
    return {
      backend,
      chartType,
      valid: errors.length === 0,
      warnings,
      errors,
      computedSize:
        typeof width === 'number' && typeof height === 'number'
          ? { width, height }
          : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      backend,
      chartType,
      valid: false,
      warnings: [],
      errors: [{ severity: 'error', code: 'assembly_failed', message }],
    };
  }
}
