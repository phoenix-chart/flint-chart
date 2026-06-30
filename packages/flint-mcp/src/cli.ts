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
  --disable-file-reference
                          Reject local data.url file references and accept only
                          inline data.values. By default any local file the agent
                          references can be read (relative paths resolve against
                          the working directory). Also enabled by the
                          FLINT_MCP_DISABLE_FILE_REFERENCE env var.
  --data-roots <list>     Deprecated and ignored. Local files are readable by default.
  --data-root <dir>       Deprecated and ignored. Local files are readable by default.
  -v, --version           Print version and exit.
  -h, --help              Print this help and exit.

Tools:
  render_chart, compile_chart, validate_chart, list_chart_types

Resources:
  flint://agent-skill, flint://chart-types

Prompt:
  author_flint_chart

Example MCP client config:
  { "command": "npx", "args": ["-y", "flint-chart-mcp"] }
`;

interface ParsedArgs {
  transport: string;
  backends?: SupportedBackend[];
  /** When true, reject local data.url file references (inline rows only). */
  disableFileReference: boolean;
  /** True when a deprecated --data-root(s) flag was passed (ignored, warned). */
  usedDeprecatedDataRoots: boolean;
}

function parseBackends(raw: string | undefined): SupportedBackend[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as SupportedBackend[];
  return list.length ? list : undefined;
}

/** Parse a boolean env var; undefined when unset so the flag can win. */
function parseBoolEnv(raw: string | undefined): boolean | undefined {
  if (raw == null) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === '') return undefined;
  return value !== '0' && value !== 'false' && value !== 'no';
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    transport: 'stdio',
    disableFileReference: false,
    usedDeprecatedDataRoots: false,
  };
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
      case '--disable-file-reference':
        out.disableFileReference = true;
        break;
      case '--data-roots':
      case '--data-root':
        // Deprecated: consume and ignore the value; warned about in main().
        i++;
        out.usedDeprecatedDataRoots = true;
        break;
      default:
        if (arg.startsWith('--transport=')) {
          out.transport = arg.slice('--transport='.length);
        } else if (arg.startsWith('--backends=')) {
          out.backends = parseBackends(arg.slice('--backends='.length));
        } else if (arg.startsWith('--data-roots=') || arg.startsWith('--data-root=')) {
          out.usedDeprecatedDataRoots = true;
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
  const envDisable = parseBoolEnv(process.env.FLINT_MCP_DISABLE_FILE_REFERENCE);
  const disableFileReference = envDisable ?? args.disableFileReference;

  // The legacy --data-roots/--data-root flags and FLINT_MCP_DATA_ROOTS env var
  // are deprecated and no longer take effect. They USED to allow/whitelist local
  // file reads, so we must NOT steer migrators toward --disable-file-reference
  // (the opposite intent) — that would accidentally turn off all file charting.
  if (args.usedDeprecatedDataRoots || process.env.FLINT_MCP_DATA_ROOTS?.trim()) {
    process.stderr.write(
      'flint-chart-mcp: --data-roots / --data-root (and FLINT_MCP_DATA_ROOTS) are ' +
        'deprecated and have NO effect. Local data.url files are now readable by ' +
        'default, so you can safely REMOVE these flags and local-file charts keep ' +
        'working. (Only add --disable-file-reference if you instead want to BLOCK ' +
        'local file reads.)\n',
    );
  }

  // Validate eagerly so a bad config fails fast with a clear message.
  const resolved = resolveBackends({ enabledBackends });

  const server = createServer({ enabledBackends, disableFileReference });
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the protocol channel; log to stderr only.
  const dataMode = disableFileReference
    ? 'local file references disabled'
    : 'local files readable on request';
  process.stderr.write(
    `flint-chart-mcp ${VERSION} ready on stdio (backends: ${resolved.join(', ')}; ` +
      `${dataMode})\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`flint-chart-mcp failed to start: ${err?.stack ?? err}\n`);
  process.exit(1);
});

