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

/**
 * Assemble a Flint {@link ChartAssemblyInput} to a Vega-Lite spec and render it
 * to an SVG string. Throws on assembly or compile failure so the caller can
 * surface the message.
 */
export async function renderFlintSvg(
  input: ChartAssemblyInput,
  background: string = DEFAULT_BACKGROUND,
): Promise<FlintRenderResult> {
  const raw = assembleVegaLite(input) as Record<string, unknown>;
  const warnings = (raw._warnings as FlintRenderResult['warnings']) ?? [];
  const vlSpec = stripPrivate(raw);

  const compiled = compile(vlSpec as never).spec;
  const runtime = parse(compiled as never, { background } as never);
  const view = new View(runtime, { renderer: 'none' });
  view.logLevel(VegaError);
  await view.runAsync();
  const svg = await view.toSVG();
  view.finalize();

  return { svg, vlSpec, warnings };
}
