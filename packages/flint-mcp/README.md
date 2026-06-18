# flint-chart-mcp

> Model Context Protocol (MCP) server for [Flint](https://github.com/microsoft/flint-chart).
> Give it data **+** one semantic chart spec; get back a **rendered chart** —
> PNG or SVG — across Vega-Lite, ECharts, and Chart.js. Rendering is local and
> **in-process**: your data never leaves the host.

Flint's [agent skill](../../agent-skills/SKILL.md) teaches an agent how to *author*
a `ChartAssemblyInput`. This MCP server is the *execution* counterpart: it
compiles, validates, and renders that one spec.

## Why a small tool surface

Most chart MCP servers expose one tool per chart type (26+ tools) because every
chart has a different schema, and they upload your config to a remote render
service. Flint has **one schema** (`ChartAssemblyInput`) spanning ~40 chart
types × multiple backends, so this server exposes **four verb tools** and
renders **locally**.

## Tools

| Tool | Input | Output |
|---|---|---|
| `render_chart` | spec + `backend` + `format` (`png`/`svg`) + `scale?` | inline PNG image or SVG text |
| `compile_chart` | spec + `backend` | backend-native spec JSON + warnings |
| `validate_chart` | spec + `backend` | validity, warnings/errors, computed size |
| `list_chart_types` | `backend?` | chart types + encoding channels per backend |

A browsable `flint://chart-types` resource exposes the full catalog.

`backend` is one of `vegalite`, `echarts`, `chartjs`. The `chartjs` backend
renders **PNG only** (its engine has no SVG output).

## Install / run

Zero-install via `npx`:

```bash
npx -y flint-chart-mcp
```

### MCP client config

```json
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}
```

Works with Claude Desktop, Cursor, VS Code, and any MCP client that speaks
**stdio**.

### CLI options

```
--transport <stdio>   Transport (only "stdio" is supported). Default: stdio.
--backends <list>     Comma-separated subset of vegalite,echarts,chartjs.
                      Overridden by FLINT_MCP_BACKENDS if set.
-v, --version         Print version.
-h, --help            Print help.
```

Gate the exposed backends at deploy time:

```bash
FLINT_MCP_BACKENDS=vegalite,echarts npx -y flint-chart-mcp
```

## Example `render_chart` call

```jsonc
{
  "name": "render_chart",
  "arguments": {
    "data": {
      "values": [
        { "region": "North", "revenue": 120 },
        { "region": "South", "revenue": 90 },
        { "region": "East",  "revenue": 150 }
      ]
    },
    "semantic_types": { "region": "Category", "revenue": "Quantity" },
    "chart_spec": {
      "chartType": "Bar Chart",
      "encodings": { "x": { "field": "region" }, "y": { "field": "revenue" } },
      "canvasSize": { "width": 360, "height": 240 }
    },
    "backend": "vegalite",
    "format": "png"
  }
}
```

The response contains the PNG inline (MCP `ImageContent`, base64) plus a short
note with the artifact size and any assembly warnings.

## Programmatic rendering

The in-process render core is also importable, so build scripts and tools can
reuse one shared SSR recipe:

```ts
import { renderChart } from 'flint-chart-mcp/render';

const { buffer, warnings } = await renderChart(input, 'echarts', { format: 'png', scale: 2 });
```

## How it renders (in-process, no browser)

- **Vega-Lite** → compile to Vega → headless `vega.View` → SVG → (PNG via `@resvg/resvg-js`).
- **ECharts** → server-side SVG rendering → (PNG via resvg).
- **Chart.js** → `@napi-rs/canvas` → PNG (no SVG engine).

A bundled DejaVu Sans font is registered with both rasterizers for deterministic,
portable output, and Flint's computed `width`/`height` (its stretch-layout
result) is applied so the semantic layout shows up in the artifact.

## Security & limits

- **No remote upload.** All rendering is in-process; inline data stays on the host.
- **Inline data only.** `data.url` fetching is disabled to avoid SSRF.
- **DoS guards.** Row count and canvas dimensions are capped for hostile specs.

## Development

```bash
npm install            # from the repo root (workspaces)
npm run build:mcp      # build this package (requires flint-js built first)
npm run test:mcp       # run the test suite
```

## License

MIT © Microsoft Corporation
