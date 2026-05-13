# @flint-chart/mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io/) server that
exposes flint-chart's four assemblers as MCP tools.

## Tools

| Tool | Description |
|---|---|
| `flint_assemble_vegalite` | Compile a `ChartAssemblyInput` → Vega-Lite spec |
| `flint_assemble_echarts` | Compile a `ChartAssemblyInput` → ECharts option |
| `flint_assemble_chartjs` | Compile a `ChartAssemblyInput` → Chart.js config |
| `flint_assemble_gofish` | Compile a `ChartAssemblyInput` → GoFish spec |
| `flint_list_chart_types` | Enumerate supported `chartType` strings per backend |

## Build + run

```bash
# from repo root
npm install
npm run mcp:build
node agents/mcp-server/dist/index.js
```

## Register with a client

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "flint-chart": {
      "command": "node",
      "args": ["/abs/path/to/flint-chart/agents/mcp-server/dist/index.js"]
    }
  }
}
```

**VS Code (Agent Mode)** — add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "flint-chart": {
      "command": "node",
      "args": ["${workspaceFolder}/agents/mcp-server/dist/index.js"]
    }
  }
}
```
