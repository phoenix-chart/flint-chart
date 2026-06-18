// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DEFAULT_FONT_FAMILY } from './fonts.js';
import { svgToResult } from './svg.js';
import type { RenderResult, RenderFormat } from './types.js';

const DEFAULT_W = 400;
const DEFAULT_H = 320;

export interface VegaLiteRenderArgs {
  format: RenderFormat;
  scale: number;
  background: string;
  width?: number;
  height?: number;
}

/**
 * Render a Vega-Lite spec entirely in-process: compile to Vega, build a
 * headless `vega.View`, emit SVG, then rasterize (for PNG) with resvg. No
 * browser or external binary is required.
 */
export async function renderVegaLite(
  spec: any,
  args: VegaLiteRenderArgs,
): Promise<Omit<RenderResult, 'warnings'>> {
  const vega = await import('vega');
  const vegaLite = await import('vega-lite');

  // Ensure a deterministic, bundled default font for axis/legend text.
  const config = {
    ...(spec.config ?? {}),
    font: spec.config?.font ?? DEFAULT_FONT_FAMILY,
  };
  const vlSpec = { ...spec, config };

  const compiled = vegaLite.compile(vlSpec as any).spec;
  const runtime = vega.parse(compiled as any, { background: args.background } as any);
  const view = new vega.View(runtime, { renderer: 'none' });
  view.logLevel(vega.Error);
  await view.runAsync();
  const svg = await view.toSVG();
  view.finalize();

  // Vega reports the rendered content box; fall back to the assembler size.
  const width = Math.round((view.width?.() as number) || args.width || DEFAULT_W);
  const height = Math.round((view.height?.() as number) || args.height || DEFAULT_H);

  return svgToResult(svg, {
    backend: 'vegalite',
    format: args.format,
    scale: args.scale,
    background: args.background,
    width,
    height,
  });
}
