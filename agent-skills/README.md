# agent-skills/

AI-agent assets for **flint-chart**. Things that help LLMs and IDE agents
produce correct, idiomatic `ChartAssemblyInput` JSON.

```
agent-skills/
├── skills/               Copilot / Claude / Cursor-compatible skills
│   ├── flint-chart-author/SKILL.md   Author or edit a chart spec
│   └── flint-chart-port/SKILL.md     Port an existing Vega-Lite / ECharts spec to flint-chart
├── prompts/              Standalone system prompts
│   └── flint-chart-author.md
├── instructions/         IDE-agnostic .instructions.md drop-in files
│   └── flint-chart.instructions.md
└── mcp-server/           Model Context Protocol server exposing flint-chart as tools
    └── …
```

## How agents should use flint-chart

The whole point of flint-chart is that LLMs **don't have to know low-level
chart knobs**. The agent contract is:

1. Pick a `chartType` from the registry.
2. Map fields to channels (`x`, `y`, `color`, …).
3. Annotate each field with a **semantic type** (`Quantity`, `Price`,
   `Country`, `Date`, …).

That's it. Sizing, zero baselines, color schemes, number formatting,
sort order — all derived deterministically.

See [skills/flint-chart-author/SKILL.md](skills/flint-chart-author/SKILL.md)
for the full contract and worked examples.

## MCP server

The MCP server in [`mcp-server/`](mcp-server/) wraps flint-chart's four
`assemble*` entry points as MCP tools, so any MCP-aware client (Claude
Desktop, VS Code Agent Mode, Continue, etc.) can produce specs without
shelling out.

```bash
# from repo root
npm install
npm run mcp:build
node agent-skills/mcp-server/dist/index.js
```

Register it in your client's MCP config:

```json
{
  "mcpServers": {
    "flint-chart": {
      "command": "node",
      "args": ["/abs/path/to/flint-chart/agent-skills/mcp-server/dist/index.js"]
    }
  }
}
```
