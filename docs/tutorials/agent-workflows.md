# Agent workflows

Flint can sit in an agent workflow in two different ways.

- **I want an agent to create good-looking charts powered by Flint.** Use Flint as a chart tool in
  a chat app, VS Code, Claude, Cursor, or another MCP client. Ask the agent to
  validate a chart request, render a PNG or SVG, try a different chart type, or
  switch backend if needed.
- **I want to build Flint into my own agentic product.** Import Flint into an
  app, notebook, service, or system like Data Formulator. Your agent may
  generate a spec, but your product owns the workflow: storing specs, building
  UI controls, compiling to Vega-Lite/ECharts/Chart.js, and rendering the
  result.

Both paths use the same contract under the hood: `ChartAssemblyInput`. You can
ignore that contract at first if you only want chart output from an MCP tool;
you will use it directly if you are building on top of Flint.

## I want an agent to create good-looking charts powered by Flint

Use this workflow when you are in chat, VS Code, Claude, Cursor, or another MCP
client and mostly want chart output. The spec can stay mostly invisible. Your
main loop is: ask for a chart, validate it, render it, then ask for changes.

### Give the agent the Flint skill

The chart-author skill lives in this repo at [agent-skills/flint-chart-author/SKILL.md](https://github.com/microsoft/flint-chart/blob/main/agent-skills/flint-chart-author/SKILL.md).
Use it anywhere your coding agent can load Markdown instructions: VS Code
Copilot, Claude Code, Cursor, or another agent shell.

When you use the MCP server, the same instructions are also available through
the server as `flint://agent-skill`, and through the `author_flint_chart` prompt
for clients that support MCP prompts. That keeps the rendering tools and the
authoring contract together: the agent can load the Flint rules before it calls
`validate_chart`, `render_chart`, or `compile_chart`.

The skill teaches the agent the semantic chart contract and the operational
steps around it:

- infer or write `semantic_types` for the data fields;
- choose a supported `chartType`;
- map fields to channels like `x`, `y`, `color`, `column`, or `size`;
- return a valid `ChartAssemblyInput`;
- validate and render with MCP tools when chart output is requested;
- install/import Flint and call assemblers when the task is project integration.

The boundary stays the same: the agent works through Flint's semantic input. It
should not hand-write Vega-Lite marks, ECharts series, axis formats, color
scales, or layout math.

### Add the MCP renderer

For preview images inside an agent workflow, run the MCP server. It gives the
agent local tools plus the context it needs to use them correctly:

| Tool | Use it for |
|------|------------|
| `validate_chart` | Check whether the input is valid and see warnings. |
| `render_chart` | Render PNG or SVG locally. |
| `compile_chart` | Return the backend-native Vega-Lite, ECharts, or Chart.js spec. |
| `list_chart_types` | Inspect supported chart types and channels. |

| Resource or prompt | Use it for |
|--------------------|------------|
| `flint://agent-skill` | Load the bundled chart-author instructions. |
| `flint://chart-types` | Inspect the supported chart catalog. |
| `author_flint_chart` | Start from a prompt that embeds the skill. |

Most MCP clients can run it with `npx`, no global install:

```jsonc
// Claude Desktop / Cursor
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp"]
    }
  }
}
```

```jsonc
// VS Code .vscode/mcp.json
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

Rendering is local and in-process. Inline data stays on your machine.

To let the MCP server read local data files by `data.url`, add an allowed data
root. Files outside that root are rejected, and remote URLs are not fetched.

```jsonc
// Claude Desktop / Cursor, with local file references enabled
{
  "mcpServers": {
    "flint": {
      "command": "npx",
      "args": ["-y", "flint-chart-mcp", "--data-roots", "./data"]
    }
  }
}
```

### How the MCP loop works

The normal loop is:

1. The client loads `flint://agent-skill` or runs the `author_flint_chart`
   prompt.
2. The agent inspects the available data. If needed, it uses another coding,
   notebook, SQL, or data tool to clean, aggregate, or reshape the table first.
3. The agent binds data in the form the MCP server can actually render:
   embedded `data.values`, or a local `data.url` file under an allowed data root.
4. The agent writes the Flint `semantic_types` and `chart_spec`.
5. The agent calls `validate_chart` and fixes any schema, field, chart-type, or
   backend warnings.
6. The agent calls `render_chart` for PNG/SVG output, or `compile_chart` when you
  want Vega-Lite, ECharts, or Chart.js JSON.
7. The MCP client returns the image, SVG, or spec artifact to the user.

There are three data-binding cases to keep separate:

- **MCP with small or prepared rows:** pass rows directly as
  `data: { values: [...] }` in the tool call.
- **MCP with a prepared local file:** save `.json`, `.csv`, or `.tsv` under a
  configured data root, then pass `data: { url: "sales.csv" }` or a file URL.
- **Generated application or notebook code:** load data into a real runtime
  variable such as `rows`, then call Flint with `data: { values: rows }`. This
  variable pattern belongs in generated code; it is not valid inside a direct
  MCP tool call.

Data transformation belongs before Flint. If the request needs aggregation,
filtering, joins, pivots, derived columns, or a long-form table, the agent should
use another coding, notebook, SQL, or data tool first, then author the Flint spec
against that chart-ready table.

Use backend customization only for post-Flint style/presentation tweaks. The
preferred path is to keep chart structure in Flint's `chart_spec`, because that
remains portable across backends. When a user asks for a visual detail that
Flint cannot express, the agent should create and inspect the Flint chart first,
then call `compile_chart` with `backend: "vegalite"`, make the smallest necessary
style edit to the returned Vega-Lite JSON, and render it in the host environment
with a Vega-Lite renderer. That edited Vega-Lite JSON is not a Flint spec, so it
should not be sent to `render_chart`.

### Ask for chart output

Start with a concrete request. For example:

```text
Load flint://agent-skill or run the author_flint_chart prompt.

I have rows with columns: month, product, revenue, profit.
Create a monthly revenue trend by product.
Validate it with validate_chart.
Render a PNG with render_chart using the vegalite backend.
```

The agent may show a `ChartAssemblyInput`, or it may only show the rendered
result. If it does show the input, it should be shaped like this:

```jsonc
{
  "data": { "values": [ /* your rows */ ] },
  "semantic_types": {
    "month": "YearMonth",
    "product": "Category",
    "revenue": "Quantity",
    "profit": "Profit"
  },
  "chart_spec": {
    "chartType": "Line Chart",
    "encodings": {
      "x": { "field": "month" },
      "y": { "field": "revenue" },
      "color": { "field": "product" }
    }
  }
}
```

When you want a different design, ask for a ChartSpec change:

```text
Keep the same data, but switch this from a line chart to a heatmap.
Use month on x, product on y, and profit on color.
Validate and render it.
```

When you need a backend-specific chart, ask for the backend switch explicitly:

```text
Use the same data view, but make a Sunburst Chart and render it with ECharts.
```

The useful habit is to ask for the visual change, not backend JSON. Let Flint
and the MCP server answer the backend questions.

### Check the result

Before you accept an agent-authored chart, skim these things:

- Do the `semantic_types` match the actual columns? `YearMonth` for month-like
  strings, `Quantity` for additive measures, `Profit` for signed gain/loss.
- Does the `chart_spec` use fields that really exist in the data view?
- Did `validate_chart` return warnings about unsupported channels, crowded axes,
  or a backend that does not support that chart type?
- Is the requested backend appropriate? Vega-Lite is great for grammar-style
  charts; ECharts covers richer interactive and hierarchical designs such as
  sunburst.

That is usually enough. The compiler handles axis types, temporal parsing,
zero baselines, color defaults, and layout choices.

## I want to build Flint into my own agentic product

Use this workflow when you are building an app, notebook, service, or system
like Data Formulator. The agent can still help author the chart request, but
your product owns the state, UI controls, compilation, rendering, and review.

### Use `ChartAssemblyInput` as the product contract

Store the Flint input when you can. It is smaller and easier to inspect than a
backend-native chart spec.

- **DataSpec** is the `data` and `semantic_types` section. It tells Flint what
  columns exist and what they mean.
- **ChartSpec** is the `chart_spec` section. It tells Flint which chart template
  to use and how fields map to channels.

Your product can expose UI for the ChartSpec, ask an agent to draft or revise
it, and compile it only when it is time to render.

### Let the agent write the spec inside your workflow

A product prompt is usually stricter than a chat prompt because you need a
machine-readable result:

```text
Use the Flint chart authoring skill.

Return only a valid ChartAssemblyInput JSON object.
The data rows have fields: month, product, revenue, profit.
Create a chart_spec for a monthly revenue trend by product.
Infer semantic_types, use only fields that exist, and do not write backend JSON.
```

Your system can then validate the returned JSON, store it, show editable chart
controls, or send it back to the agent for a revision.

### Let the agent transform data and write the spec together

If the source table is not chart-ready, use the chart-author reference skill at
[agent-skills/flint-chart-author/SKILL.md](https://github.com/microsoft/flint-chart/blob/main/agent-skills/flint-chart-author/SKILL.md).
It is designed for a single structured turn: the agent returns Python pandas
code that produces a chart-ready DataFrame, plus an explicit top-level Flint
`chart_input` that can be rendered after the host binds the transformed rows.

```text
Use the Flint data-agent skill.

From the orders table, create monthly revenue by region.
Return Python transformation code and a Flint chart_input in one JSON object.
```

That pattern is useful for Data Formulator-style products: the product executes
the transformation, stores or previews the derived table, fills
`chart_input.data.values`, then compiles the Flint input for the selected
backend.

### Compile inside your app

Install Flint, then add the renderer dependency for the backend your product
uses:

```bash
npm install flint-chart
npm install vega vega-lite vega-embed  # browser Vega-Lite rendering
npm install echarts                    # ECharts rendering
npm install chart.js                   # Chart.js rendering
```

In JavaScript or TypeScript, choose the backend at render time:

```ts
import { assembleChartjs, assembleECharts, assembleVegaLite } from 'flint-chart';

const vegaLiteSpec = assembleVegaLite(input);
const echartsOption = assembleECharts(input);
const chartjsConfig = assembleChartjs(input);
```

In Python, the shape is the same:

```bash
pip install flint-chart
pip install altair  # optional renderer for notebooks or static HTML
```

```python
from flint.vegalite import assemble_vegalite

spec = assemble_vegalite(input)
```

The product decides which renderer to mount, how to size the chart, how to store
the spec, and whether users can edit the chart request directly.

### Build review into the product

Before rendering or saving an agent-authored spec, check the parts your product
cares about most:

- validate that every encoded field exists in the current data view;
- reject chart types or backends your UI does not support;
- keep derived or aggregated data shaping upstream of Flint;
- store the Flint input when possible, then compile backend specs on demand;
- expose ChartSpec controls instead of asking users to edit backend JSON.

This keeps Flint as the semantic chart layer while your product remains in
charge of the surrounding experience.

## Next steps

- [Getting started](/documentation/getting-started) explains the DataSpec and
  ChartSpec shape with a tiny first chart.
- [Example: a data story](/documentation/data-story) shows a larger workflow where
  one source dataset becomes several chart designs.
- [MCP server README](https://github.com/microsoft/flint-chart/tree/main/packages/flint-mcp)
  has the full tool reference and CLI options.
- [Flint chart-author skill](https://github.com/microsoft/flint-chart/blob/main/agent-skills/flint-chart-author/SKILL.md)
  shows a one-turn pattern for Python transformation code plus a Flint spec.
- [Semantic Type](/documentation/semantic-types) lists the labels the agent can
  use for fields.
