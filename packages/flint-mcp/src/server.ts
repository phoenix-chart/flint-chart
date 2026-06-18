// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { renderChart } from './render/index.js';
import type { RenderBackend } from './render/types.js';
import { compileChart } from './tools/compile.js';
import { validateChart } from './tools/validate.js';
import { listChartTypes } from './tools/list.js';
import {
  assemblyInputShape,
  toAssemblyInput,
  SUPPORTED_BACKENDS,
  type SupportedBackend,
  type AssemblyInputArgs,
} from './tools/schemas.js';

/** Package version, kept in lockstep with the npm release. */
export const VERSION = '0.1.0';

export interface CreateServerOptions {
  /** Restrict which backends are exposed (default: all supported). */
  enabledBackends?: SupportedBackend[];
}

type JsonContent = { content: { type: 'text'; text: string }[]; isError?: boolean };

function jsonResult(value: unknown): JsonContent {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown): JsonContent {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

/** Resolve and validate the set of enabled backends. */
export function resolveBackends(options: CreateServerOptions = {}): SupportedBackend[] {
  const requested = options.enabledBackends?.length
    ? options.enabledBackends
    : [...SUPPORTED_BACKENDS];
  const enabled = requested.filter((b): b is SupportedBackend =>
    (SUPPORTED_BACKENDS as readonly string[]).includes(b),
  );
  if (enabled.length === 0) {
    throw new Error(
      `no valid backends enabled; choose from: ${SUPPORTED_BACKENDS.join(', ')}`,
    );
  }
  return enabled;
}

/**
 * Build the Flint MCP server with the four verb tools (`render_chart`,
 * `compile_chart`, `validate_chart`, `list_chart_types`) and a chart-types
 * resource. Rendering is fully in-process; no data leaves the host.
 */
export function createServer(options: CreateServerOptions = {}): McpServer {
  const backends = resolveBackends(options);
  const backendEnum = z
    .enum(backends as [SupportedBackend, ...SupportedBackend[]])
    .describe(`Rendering backend. One of: ${backends.join(', ')}.`);

  const server = new McpServer(
    { name: 'flint-chart-mcp', version: VERSION },
    {
      instructions:
        'Flint compiles one semantic chart spec (ChartAssemblyInput) into ' +
        'Vega-Lite, ECharts, or Chart.js. Use render_chart to get a PNG/SVG ' +
        'artifact, compile_chart for the backend spec JSON, validate_chart to ' +
        'check a spec, and list_chart_types to discover chart types and their ' +
        'channels. Author specs as taught in the Flint agent skill (SKILL.md).',
    },
  );

  // --- render_chart -------------------------------------------------------
  server.registerTool(
    'render_chart',
    {
      title: 'Render chart',
      description:
        'Compile a Flint chart spec for a backend and render it to an image ' +
        '(PNG) or vector (SVG), returned inline. Rendering is local/in-process. ' +
        'The chartjs backend supports PNG only.',
      inputSchema: {
        ...assemblyInputShape,
        backend: backendEnum,
        format: z
          .enum(['png', 'svg'])
          .optional()
          .describe('Output format. Default: png. chartjs supports png only.'),
        scale: z
          .number()
          .min(0.5)
          .max(4)
          .optional()
          .describe('Device scale for PNG raster (1 = design size, 2 = retina). Default: 1.'),
        background: z
          .string()
          .optional()
          .describe('Background color (CSS color). Default: #ffffff.'),
      },
    },
    async (args: any) => {
      try {
        const input = toAssemblyInput(args as AssemblyInputArgs);
        const res = await renderChart(input, args.backend as RenderBackend, {
          format: args.format,
          scale: args.scale,
          background: args.background,
        });
        const note =
          `${res.backend} · ${res.format} · ${res.width}×${res.height}px` +
          (res.warnings.length ? ` · ${res.warnings.length} warning(s)` : '');
        if (res.format === 'svg') {
          return {
            content: [
              { type: 'text' as const, text: res.svg as string },
              { type: 'text' as const, text: note },
            ],
          };
        }
        return {
          content: [
            { type: 'image' as const, data: res.base64 as string, mimeType: res.mimeType },
            { type: 'text' as const, text: note },
          ],
        };
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // --- compile_chart ------------------------------------------------------
  server.registerTool(
    'compile_chart',
    {
      title: 'Compile chart spec',
      description:
        'Compile a Flint chart spec to a backend-native spec object ' +
        '(Vega-Lite / ECharts / Chart.js) without rendering. Returns the spec ' +
        'JSON, assembly warnings, and the computed layout size.',
      inputSchema: { ...assemblyInputShape, backend: backendEnum },
    },
    async (args: any) => {
      try {
        const input = toAssemblyInput(args as AssemblyInputArgs);
        return jsonResult(compileChart(input, args.backend as RenderBackend));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // --- validate_chart -----------------------------------------------------
  server.registerTool(
    'validate_chart',
    {
      title: 'Validate chart spec',
      description:
        'Validate a Flint chart spec for a backend without rendering. Reports ' +
        'whether it is valid, all warnings/errors, and the computed layout size.',
      inputSchema: { ...assemblyInputShape, backend: backendEnum },
    },
    async (args: any) => {
      try {
        const input = toAssemblyInput(args as AssemblyInputArgs);
        return jsonResult(validateChart(input, args.backend as RenderBackend));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // --- list_chart_types ---------------------------------------------------
  server.registerTool(
    'list_chart_types',
    {
      title: 'List chart types',
      description:
        'List the available chart types and their encoding channels for a ' +
        'backend, or for all backends when none is given.',
      inputSchema: {
        backend: backendEnum.optional(),
      },
    },
    async (args: any) => {
      try {
        return jsonResult(listChartTypes(args?.backend as RenderBackend | undefined));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // --- chart-types resource (browsable catalog) ---------------------------
  server.registerResource(
    'chart-types',
    'flint://chart-types',
    {
      title: 'Flint chart types',
      description: 'Catalog of chart types and channels across all enabled backends.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(listChartTypes(), null, 2),
        },
      ],
    }),
  );

  return server;
}
