#!/usr/bin/env node
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * flint-chart MCP server.
 *
 * Exposes the four assemblers as tools so any MCP client (Claude Desktop,
 * VS Code Agent Mode, Cursor, Continue, …) can produce backend specs
 * from a single `ChartAssemblyInput`.
 *
 * Tools:
 *   - flint_assemble_vegalite  → Vega-Lite spec JSON
 *   - flint_assemble_echarts   → ECharts option JSON
 *   - flint_assemble_chartjs   → Chart.js config JSON
 *   - flint_assemble_gofish    → GoFish spec JSON
 *   - flint_list_chart_types   → enumerates supported chartType strings per backend
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  assembleVegaLite,
  assembleECharts,
  assembleChartjs,
  assembleGoFish,
  vlAllTemplateDefs,
  ecAllTemplateDefs,
  cjsAllTemplateDefs,
  gfAllTemplateDefs,
} from 'flint-chart';

// ---- Tool input schemas ----------------------------------------------------

const AssembleInput = z.object({
  data: z.union([
    z.object({ values: z.array(z.any()) }),
    z.object({ url: z.string() }),
  ]),
  semantic_types: z.record(z.string()).optional(),
  chart_spec: z.object({
    chartType: z.string(),
    encodings: z.record(z.any()),
    canvasSize: z
      .object({ width: z.number(), height: z.number() })
      .optional(),
    chartProperties: z.record(z.any()).optional(),
  }),
  options: z.record(z.any()).optional(),
});

// ---- Server ----------------------------------------------------------------

const server = new Server(
  { name: 'flint-chart', version: '0.0.1' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'flint_assemble_vegalite',
      description:
        'Compile a flint-chart ChartAssemblyInput into a Vega-Lite spec. Pick the chartType + semantic_types; flint-chart derives sizing, formatting, color schemes, and zero baselines.',
      inputSchema: zodToJsonSchema(AssembleInput),
    },
    {
      name: 'flint_assemble_echarts',
      description: 'Compile a ChartAssemblyInput into an ECharts option object.',
      inputSchema: zodToJsonSchema(AssembleInput),
    },
    {
      name: 'flint_assemble_chartjs',
      description: 'Compile a ChartAssemblyInput into a Chart.js config object.',
      inputSchema: zodToJsonSchema(AssembleInput),
    },
    {
      name: 'flint_assemble_gofish',
      description: 'Compile a ChartAssemblyInput into a GoFish spec.',
      inputSchema: zodToJsonSchema(AssembleInput),
    },
    {
      name: 'flint_list_chart_types',
      description:
        'List supported chartType strings for each backend. Call this first if you are unsure which chart type names exist.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    switch (name) {
      case 'flint_assemble_vegalite':
        return json(assembleVegaLite(AssembleInput.parse(args) as any));
      case 'flint_assemble_echarts':
        return json(assembleECharts(AssembleInput.parse(args) as any));
      case 'flint_assemble_chartjs':
        return json(assembleChartjs(AssembleInput.parse(args) as any));
      case 'flint_assemble_gofish':
        return json(assembleGoFish(AssembleInput.parse(args) as any));
      case 'flint_list_chart_types':
        return json({
          vegalite: vlAllTemplateDefs.map((t) => t.chart),
          echarts: ecAllTemplateDefs.map((t) => t.chart),
          chartjs: cjsAllTemplateDefs.map((t) => t.chart),
          gofish: gfAllTemplateDefs.map((t) => t.chart),
        });
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: unknown) {
    return {
      isError: true,
      content: [{ type: 'text', text: (err as Error).message ?? String(err) }],
    };
  }
});

function json(value: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

// Minimal zod → JSON Schema shim. The MCP SDK accepts an opaque object
// here; we deliberately keep this loose rather than pulling in
// zod-to-json-schema as a dependency.
function zodToJsonSchema(_schema: z.ZodTypeAny) {
  return {
    type: 'object',
    properties: {
      data: { description: 'Either { values: [...] } or { url: "..." }' },
      semantic_types: {
        type: 'object',
        description: 'field name → semantic type (e.g. Quantity, Price, Country, Date)',
        additionalProperties: { type: 'string' },
      },
      chart_spec: {
        type: 'object',
        properties: {
          chartType: { type: 'string' },
          encodings: { type: 'object' },
          canvasSize: {
            type: 'object',
            properties: {
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
          chartProperties: { type: 'object' },
        },
        required: ['chartType', 'encodings'],
      },
      options: { type: 'object' },
    },
    required: ['data', 'chart_spec'],
  };
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio mode: errors only to stderr.
  console.error('[flint-chart-mcp] ready');
}

main().catch((err) => {
  console.error('[flint-chart-mcp] fatal:', err);
  process.exit(1);
});
