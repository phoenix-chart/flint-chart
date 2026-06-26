// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Client-side Flint rendering. Mirrors the server's Vega-Lite render path
 * (compile -> headless vega.View -> SVG) but runs entirely in the browser so
 * the chart re-renders instantly as the user edits options. No server round
 * trip, no data leaving the host.
 */
import { assembleVegaLite } from 'flint-chart';
import type { ChartAssemblyInput } from 'flint-chart';
import { compile } from 'vega-lite';
import { parse, View, Error as VegaError } from 'vega';
import { expressionInterpreter } from 'vega-interpreter';

/** Recursively drop Flint's private `_`-prefixed annotation keys. */
function stripPrivate<T>(node: T): T {
  if (Array.isArray(node)) return node.map(stripPrivate) as unknown as T;
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k.startsWith('_')) continue;
      out[k] = stripPrivate(v);
    }
    return out as unknown as T;
  }
  return node;
}

export interface FlintRenderResult {
  /** Rendered SVG markup. */
  svg: string;
  /** The assembled Vega-Lite spec (private keys stripped). */
  vlSpec: Record<string, unknown>;
  /** Assembler warnings, if any. */
  warnings: { severity: string; code: string; message: string }[];
}

const DEFAULT_BACKGROUND = '#ffffff';
const APP_PREVIEW_BASE_SIZE = { width: 360, height: 270 } as const;
const APP_PREVIEW_CANVAS_SIZE = { width: 720, height: 540 } as const;
const APP_PREVIEW_MIN_STEP_PLOT_SIZE = { width: 220, height: 160 } as const;
const APP_PREVIEW_MAX_AUTO_STEP = 96;

function usesAutoPreviewSize(input: ChartAssemblyInput): boolean {
  return !input.chart_spec.baseSize && !input.chart_spec.canvasSize;
}

function withAppPreviewDefaults(input: ChartAssemblyInput): ChartAssemblyInput {
  if (!usesAutoPreviewSize(input)) return input;
  return {
    ...input,
    chart_spec: {
      ...input.chart_spec,
      baseSize: { ...APP_PREVIEW_BASE_SIZE },
      canvasSize: { ...APP_PREVIEW_CANVAS_SIZE },
    },
  };
}

function encodingField(input: ChartAssemblyInput, channel: 'x' | 'y'): string | undefined {
  const encoding = input.chart_spec.encodings[channel];
  if (typeof encoding === 'string') return encoding;
  if (encoding && typeof encoding === 'object' && !Array.isArray(encoding)) {
    const field = (encoding as { field?: unknown }).field;
    return typeof field === 'string' ? field : undefined;
  }
  return undefined;
}

function uniqueValueCount(input: ChartAssemblyInput, field: string | undefined): number {
  if (!field) return 0;
  const rows = input.data.values ?? [];
  return new Set(rows.map((row) => row?.[field]).filter((value) => value != null)).size;
}

function applyStepMinimum(node: unknown, dimension: 'width' | 'height', itemCount: number): void {
  if (!node || typeof node !== 'object' || itemCount <= 0) return;
  const record = node as Record<string, unknown>;
  const size = record[dimension];
  if (size && typeof size === 'object') {
    const stepSize = (size as { step?: unknown }).step;
    if (typeof stepSize === 'number' && Number.isFinite(stepSize)) {
      const minPlotSize = APP_PREVIEW_MIN_STEP_PLOT_SIZE[dimension];
      const desiredStep = Math.min(APP_PREVIEW_MAX_AUTO_STEP, Math.ceil(minPlotSize / itemCount));
      if (stepSize < desiredStep) {
        record[dimension] = { ...(size as Record<string, unknown>), step: desiredStep };
      }
    }
  }
  applyStepMinimum(record.spec, dimension, itemCount);
}

function widenSmallStepPlotsForPreview(vlSpec: Record<string, unknown>, input: ChartAssemblyInput): void {
  const xCount = uniqueValueCount(input, encodingField(input, 'x'));
  const yCount = uniqueValueCount(input, encodingField(input, 'y'));
  applyStepMinimum(vlSpec, 'width', xCount);
  applyStepMinimum(vlSpec, 'height', yCount);
}

/**
 * Assemble a Flint {@link ChartAssemblyInput} to a Vega-Lite spec and render it
 * to an SVG string. Throws on assembly or compile failure so the caller can
 * surface the message.
 */
export async function renderFlintSvg(
  input: ChartAssemblyInput,
  background: string = DEFAULT_BACKGROUND,
): Promise<FlintRenderResult> {
  const usePreviewDefaults = usesAutoPreviewSize(input);
  const previewInput = withAppPreviewDefaults(input);
  const raw = assembleVegaLite(previewInput) as Record<string, unknown>;
  if (usePreviewDefaults) widenSmallStepPlotsForPreview(raw, previewInput);
  const warnings = (raw._warnings as FlintRenderResult['warnings']) ?? [];
  const vlSpec = stripPrivate(raw);

  const compiled = compile(vlSpec as never).spec;
  // Parse with `ast: true` and render through Vega's CSP-safe expression
  // interpreter. The default Vega runtime compiles expressions with
  // `new Function`, which violates strict webview CSPs (no 'unsafe-eval', e.g.
  // VS Code's MCP App host). The interpreter evaluates the AST instead.
  const runtime = parse(compiled as never, { background } as never, { ast: true } as never);
  const view = new View(runtime, { renderer: 'none', expr: expressionInterpreter });
  view.logLevel(VegaError);
  await view.runAsync();
  const svg = await view.toSVG();
  view.finalize();

  return { svg, vlSpec, warnings };
}
