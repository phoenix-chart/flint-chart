// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { z } from 'zod';
import type { ChartAssemblyInput } from 'flint-chart';

/** The three backends this server can compile, validate, and render. */
export const SUPPORTED_BACKENDS = ['vegalite', 'echarts', 'chartjs'] as const;
export type SupportedBackend = (typeof SUPPORTED_BACKENDS)[number];

export const dataSchema = z
  .object({
    values: z
      .array(z.record(z.string(), z.any()))
      .optional()
      .describe('Inline data rows (array of row objects), like Vega-Lite data.values.'),
    url: z
      .string()
      .optional()
      .describe('Remote data URL. Disabled by default in this server; pass inline values instead.'),
  })
  .describe('Data source. Provide inline `values`.');

export const chartSpecSchema = z
  .object({
    chartType: z
      .string()
      .describe('Chart template name, e.g. "Bar Chart", "Scatter Plot", "Heatmap".'),
    encodings: z
      .record(z.string(), z.any())
      .describe(
        'Channel → encoding map, e.g. { x: { field: "region" }, y: { field: "revenue" } }. A bare string is shorthand for { field: "..." }.',
      ),
    baseSize: z
      .object({ width: z.number(), height: z.number() })
      .optional()
      .describe(
        'Target canvas size in px (default 400×320). Flint\'s layout model stretches around this base up to the ceiling.',
      ),
    canvasSize: z
      .object({ width: z.number(), height: z.number() })
      .optional()
      .describe(
        'Optional hard ceiling in px. Caps how far the chart may stretch beyond baseSize. When omitted, the cap is baseSize × the maxStretch option (default 2×).',
      ),
    chartProperties: z
      .record(z.string(), z.any())
      .optional()
      .describe('Template-specific properties (e.g. bar corner radius, show labels).'),
  })
  .describe('What to draw.');

/**
 * The five fields of a {@link ChartAssemblyInput}, expressed as a flat MCP tool
 * parameter shape so each part is self-documenting in the JSON schema.
 */
export const assemblyInputShape = {
  data: dataSchema,
  semantic_types: z
    .record(z.string(), z.any())
    .optional()
    .describe('Field name → semantic type, e.g. { revenue: "Quantity", country: "Country" }.'),
  chart_spec: chartSpecSchema,
  options: z
    .record(z.string(), z.any())
    .optional()
    .describe('Assembler options (e.g. { addTooltips: true } and layout tuning).'),
  field_display_names: z
    .record(z.string(), z.string())
    .optional()
    .describe('Field name → display label, used for axis titles and legend headers.'),
};

export type AssemblyInputArgs = {
  data: { values?: unknown[]; url?: string };
  semantic_types?: Record<string, unknown>;
  chart_spec: {
    chartType: string;
    encodings: Record<string, unknown>;
    baseSize?: { width: number; height: number };
    canvasSize?: { width: number; height: number };
    chartProperties?: Record<string, unknown>;
  };
  options?: Record<string, unknown>;
  field_display_names?: Record<string, string>;
};

/** Reassemble the flat tool args into a {@link ChartAssemblyInput} object. */
export function toAssemblyInput(args: AssemblyInputArgs): ChartAssemblyInput {
  return {
    data: args.data,
    semantic_types: args.semantic_types,
    chart_spec: args.chart_spec,
    options: args.options,
    field_display_names: args.field_display_names,
  } as ChartAssemblyInput;
}
