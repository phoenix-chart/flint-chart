// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, resolveBackends, VERSION } from './server.js';
import { SUPPORTED_BACKENDS, type SupportedBackend } from './tools/schemas.js';

const HELP = `flint-chart-mcp ${VERSION}

MCP server that compiles and renders Flint chart specs to Vega-Lite, ECharts,
or Chart.js artifacts (PNG/SVG), entirely in-process.

Usage:
  flint-chart-mcp [options]

Options:
  --transport <stdio>     Transport to use (only "stdio" is supported). Default: stdio.
  --backends <list>       Comma-separated backends to expose
                          (subset of: ${SUPPORTED_BACKENDS.join(', ')}).
                          Overridden by the FLINT_MCP_BACKENDS env var if set.
  -v, --version           Print version and exit.
  -h, --help              Print this help and exit.

Tools:
  render_chart, compile_chart, validate_chart, list_chart_types

Example MCP client config:
  { "command": "npx", "args": ["-y", "flint-chart-mcp"] }
`;

interface ParsedArgs {
  transport: string;
  backends?: SupportedBackend[];
}

function parseBackends(raw: string | undefined): SupportedBackend[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as SupportedBackend[];
  return list.length ? list : undefined;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { transport: 'stdio' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        process.stdout.write(HELP);
        process.exit(0);
        break;
      case '-v':
      case '--version':
        process.stdout.write(`${VERSION}\n`);
        process.exit(0);
        break;
      case '--transport':
        out.transport = argv[++i] ?? 'stdio';
        break;
      case '--backends':
        out.backends = parseBackends(argv[++i]);
        break;
      default:
        if (arg.startsWith('--transport=')) {
          out.transport = arg.slice('--transport='.length);
        } else if (arg.startsWith('--backends=')) {
          out.backends = parseBackends(arg.slice('--backends='.length));
        } else {
          process.stderr.write(`Unknown argument: ${arg}\n`);
          process.exit(2);
        }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.transport !== 'stdio') {
    process.stderr.write(
      `Unsupported transport "${args.transport}". Only "stdio" is supported in this version.\n`,
    );
    process.exit(2);
  }

  // Env var takes precedence over the flag for deployment-time gating.
  const enabledBackends =
    parseBackends(process.env.FLINT_MCP_BACKENDS) ?? args.backends;

  // Validate eagerly so a bad config fails fast with a clear message.
  const resolved = resolveBackends({ enabledBackends });

  const server = createServer({ enabledBackends });
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the protocol channel — log to stderr only.
  process.stderr.write(
    `flint-chart-mcp ${VERSION} ready on stdio (backends: ${resolved.join(', ')})\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`flint-chart-mcp failed to start: ${err?.stack ?? err}\n`);
  process.exit(1);
});
