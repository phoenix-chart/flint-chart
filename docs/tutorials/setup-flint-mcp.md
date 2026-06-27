# Set up Flint MCP

This page shows how to run `flint-chart-mcp` in an MCP client and what the
server exposes once it is connected. It is more detailed than the short MCP
overview page, but it still starts from the basic setup path.

Use this page when you want an agent in VS Code, Claude Desktop, Cursor, or
another MCP client to create, validate, preview, or render Flint charts. For
custom agents and product integrations that embed the library directly, see
[Agent workflows](/documentation/agent-workflows).

## What the MCP server provides

The MCP server is Flint's execution counterpart for agents. The agent writes one
semantic `ChartAssemblyInput`, and the server compiles, validates, renders, or
opens that chart locally.

| Tool | Use it for |
|------|------------|
| `create_chart_view` | Preferred default when the host supports MCP Apps: open an interactive chart view with a live SVG preview and chart options. |
| `validate_chart` | Check whether a Flint input is valid and inspect warnings, errors, and computed size. |
| `render_chart` | Render a static PNG or SVG locally when you need an artifact or the host has no MCP App UI. |
| `compile_chart` | Return backend-native Vega-Lite, ECharts, or Chart.js JSON. |
| `list_chart_types` | Inspect supported chart types and encoding channels. |

| Resource or prompt | Use it for |
|--------------------|------------|
| `flint://agent-skill` | Load the bundled chart-author instructions. |
| `flint://chart-types` | Browse the supported chart catalog. |
| `ui://flint-chart/chart-view.html` | Bundled UI resource used by `create_chart_view` in MCP App hosts. |
| `author_flint_chart` | Start from a prompt that embeds the chart-author skill. |

For best results, have the client load `flint://agent-skill` or run the
`author_flint_chart` prompt before the agent calls the chart tools. The skill
teaches the agent the valid `chartType` names, field-to-channel mappings,
semantic types, data-binding rules, and when to use each rendering tool.

## Requirements

You need:

- an MCP client that can run stdio servers;
- Node.js and npm available to that client;
- chart data either embedded directly in the tool call or stored in an allowed
  local data root.

The server renders in-process on the host machine. Inline rows and allowed local
files stay local; the server does not upload data to a remote rendering service.

## Run with `npx`

Most clients can run the published package through `npx`, with no global
install:

```bash
npx -y flint-chart-mcp
```

That command starts a stdio MCP server. In practice, you usually put it in your
client's MCP configuration instead of running it by hand.

## Configure VS Code

For VS Code, add a server entry in `.vscode/mcp.json`:

```jsonc
{
  "servers": {
    "flint": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}
```

If the agent should chart local `.csv`, `.tsv`, or `.json` files by `data.url`,
grant an explicit data root:

```jsonc
{
  "servers": {
    "flint": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "flint-chart-mcp", "--data-roots", "./data"]
    }
  }
}
```

After changing server code or configuration, restart the MCP server in the
client. A useful smoke test is to ask the agent to list the Flint chart types
with `list_chart_types`.

## Configure Claude Desktop or Cursor

Many MCP clients use an `mcpServers` object:

```jsonc
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}
```

With local file access enabled:

```jsonc
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp", "--data-roots", "./data"]
    }
  }
}
```

Use an absolute path for the data root if your client starts servers from a
different working directory than your project.

## Run from this repository

When developing Flint itself, build the MCP package and point the client at the
local CLI:

```bash
npm install
npm --prefix packages/flint-mcp run build
```

VS Code local-source config:

```jsonc
{
  "servers": {
    "flint": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${workspaceFolder}/packages/flint-mcp/dist/cli.js",
        "--data-roots",
        "${workspaceFolder}/shared/test-data"
      ]
    }
  }
}
```

Rebuild and restart the MCP server after changing server code, rendering code,
or the bundled MCP App UI.

## Data access

MCP tool calls can bind data in two ways:

- **Embedded rows:** pass `data: { values: [...] }` directly in the tool call.
  This is the simplest path for small or already prepared tables.
- **Local file references:** pass `data: { url: "..." }` for a `.json`, `.csv`,
  or `.tsv` file under a configured data root.

Local file reads are intentionally restricted. Files outside the configured data
roots are rejected, and remote URLs are not fetched.

Useful data-root options:

```bash
npx -y flint-chart-mcp --data-roots ./data,./fixtures
npx -y flint-chart-mcp --data-root ./data --data-root ./fixtures
FLINT_MCP_DATA_ROOTS=./data,./fixtures npx -y flint-chart-mcp
```

If the chart request needs aggregation, filtering, joins, pivots, derived
columns, or long-form reshaping, have the agent prepare a chart-ready table
before it calls Flint. Flint compiles charts; it is not a general data-wrangling
engine.

## Backend and rendering options

The server supports these backends:

- `vegalite` for grammar-style statistical charts;
- `echarts` for richer interactive and hierarchical chart types;
- `chartjs` for familiar canvas-based charts. Chart.js renders PNG only.

You can expose only a subset at startup:

```bash
npx -y flint-chart-mcp --backends vegalite,echarts
FLINT_MCP_BACKENDS=vegalite,echarts npx -y flint-chart-mcp
```

Use `create_chart_view` when the user wants to see and iterate on a chart in a
host with MCP App support. Use `render_chart` for a static artifact. Use
`compile_chart` when the user needs backend-native JSON for another renderer or
editor.

## Verify the setup

In the MCP client, ask the agent for a simple verification pass:

```text
Load flint://agent-skill or run the author_flint_chart prompt.
Then call list_chart_types for the vegalite backend and tell me whether Flint is connected.
```

Then try a first chart:

```text
Use Flint MCP to create a bar chart from these rows:
[{"region":"North","revenue":120},{"region":"South","revenue":90}]
Use region as Category and revenue as Quantity.
Open it with create_chart_view if this client supports MCP Apps; otherwise render an SVG.
```

If `list_chart_types` works but a local file chart fails, check the configured
data root first. If `create_chart_view` is unavailable, the host likely does not
support MCP Apps; ask the agent to use `render_chart` instead.

## Next steps

- [Agent workflows](/documentation/agent-workflows) shows how to embed Flint's
  semantic chart contract inside a custom agent or agentic product.
- [Getting started](/documentation/getting-started) explains the `DataSpec` and
  `ChartSpec` shape with a tiny first chart.
- [Vega-Lite charts](/documentation/reference-vegalite),
  [ECharts charts](/documentation/reference-echarts), and
  [Chart.js charts](/documentation/reference-chartjs) list supported chart
  types by backend.
