---
name: flint-chart-author
description: Author a flint-chart ChartAssemblyInput — pick a chart type, map fields to channels, annotate each field with a semantic type. USE WHEN the user asks to "make a chart", "visualize this data", or "generate a Vega-Lite/ECharts/Chart.js spec" from tabular data. The library deterministically derives sizing, zero baseline, color schemes, and formatting from the semantic types, so DO NOT hand-tune those values.
---

# flint-chart: authoring a chart spec

## What you produce

A single `ChartAssemblyInput` object. Pass it to `assembleVegaLite`,
`assembleECharts`, `assembleChartjs`, or `assembleGoFish` to get a
backend spec. **You write the input, not the output spec.**

```ts
interface ChartAssemblyInput {
  data: { values: any[] } | { url: string };
  semantic_types?: Record<string, string>;   // field → semantic type
  chart_spec: {
    chartType: string;                       // e.g. "Scatter Plot"
    encodings: Record<string, { field?: string; ... }>;
    canvasSize?: { width: number; height: number };
    chartProperties?: Record<string, any>;
  };
}
```

## Step 1 — pick `chartType`

Use one of the registered names exactly. Common ones:

`"Bar Chart"`, `"Stacked Bar Chart"`, `"Grouped Bar Chart"`,
`"Line Chart"`, `"Area Chart"`, `"Scatter Plot"`, `"Histogram"`,
`"Heatmap"`, `"Pie Chart"`, `"Rose Chart"`, `"Boxplot"`,
`"Density Plot"`, `"Lollipop Chart"`, `"Radar Chart"`,
`"Waterfall Chart"`, `"Candlestick Chart"`, `"Pyramid Chart"`,
`"Streamgraph"`, `"Sankey"`, `"Sunburst"`, `"Treemap"`,
`"Funnel"`, `"Gauge"`.

If unsure which name a backend supports, call `vlGetTemplateChannels`
(or the equivalent for your backend).

## Step 2 — map fields to channels

Channels: `x`, `y`, `x2`, `y2`, `color`, `size`, `shape`, `opacity`,
`strokeDash`, `column`, `row`, `angle`, `radius`, `detail`, `group`,
`open`, `high`, `low`, `close`.

```json
"encodings": {
  "x": { "field": "weight" },
  "y": { "field": "mpg" },
  "color": { "field": "origin" }
}
```

You usually don't need `type`, `aggregate`, or `sortOrder` —
they're inferred from the semantic type. Set them only when you
have a specific intent.

## Step 3 — annotate with semantic types

**This is the only step that matters for getting good defaults.** Pick
the most specific semantic type for each field:

| Family | Semantic types |
|---|---|
| Counts / amounts | `Quantity`, `Count`, `Percentage`, `Score` |
| Money | `Price`, `Revenue`, `Profit`, `Cost` |
| Time | `Date`, `DateTime`, `Year`, `Month`, `Quarter`, `Weekday`, `Hour` |
| Geography | `Country`, `Region`, `City`, `State`, `Continent` |
| Identifiers | `Category`, `Name`, `ID`, `Code` |
| Ratings / ranks | `Rank`, `Rating`, `Score` |
| Physical | `Temperature`, `Distance`, `Weight`, `Speed`, `Pressure` |

Effects of choosing well:

- `Price` / `Revenue` → currency formatting, zero baseline, sequential color.
- `Temperature` → diverging color, no zero baseline.
- `Rank` → reversed axis (1 on top), discrete color.
- `Date` → temporal axis with auto-granularity.

If you don't know, use `Quantity` for numbers, `Category` for strings,
`Date` for date-shaped values.

## Worked example

User: "Plot car weight vs fuel economy, colored by origin."

```json
{
  "data": { "values": [/* rows from user */] },
  "semantic_types": {
    "weight": "Quantity",
    "mpg": "Quantity",
    "origin": "Country"
  },
  "chart_spec": {
    "chartType": "Scatter Plot",
    "encodings": {
      "x": { "field": "weight" },
      "y": { "field": "mpg" },
      "color": { "field": "origin" }
    },
    "canvasSize": { "width": 400, "height": 300 }
  }
}
```

## What you should NOT do

- Don't set Vega-Lite / ECharts / Chart.js properties directly — that
  defeats the deterministic derivation. Edit the **input**, re-assemble.
- Don't pass `type: "quantitative"` etc. unless the semantic type and
  data conflict and you need to override.
- Don't pass colors, font sizes, axis tick counts, etc. in the input —
  the user can fine-tune the **output** spec for that.
- Don't invent semantic type names. If none fit, use the family default
  (`Quantity`, `Category`, `Date`).

## Validation

Before returning, mentally verify:

1. Every channel that has a `field` references a column actually in `data.values[0]`.
2. Every field used in `encodings` is keyed in `semantic_types`.
3. `chartType` is one of the supported names for the chosen backend.
