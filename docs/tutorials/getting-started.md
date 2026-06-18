# Introduction to flint-chart

This tutorial walks you through writing a visualization with **flint-chart**, 
using Flint's semantic input instead of hand-written encodings.

We will add one piece at a time: **data → semantic types → chart type &
encodings → aggregation → compilation**. Follow along in the
[online editor](/editor): paste each JSON block into the Flint input pane and
watch the preview update.

## Tutorial overview

1. [The data](#the-data)
2. [Semantic types](#semantic-types)
3. [Chart type and encodings](#chart-type-and-encodings)
4. [Aggregation](#aggregation)
5. [Compile your chart](#compile-your-chart)
6. [Next steps](#next-steps)

---

## The data

Suppose you have a small monthly table with a `month` column and a numeric
`value` column. Some months have multiple records, which lets us show both
temporal parsing and aggregation later.

In flint-chart, inline data is a JSON array of row objects under `data.values`:

```json
{
  "data": {
    "values": [
      { "month": "2024-01", "value": 120 },
      { "month": "2024-01", "value": 135 },
      { "month": "2024-02", "value": 142 },
      { "month": "2024-02", "value": 150 },
      { "month": "2024-03", "value": 165 },
      { "month": "2024-03", "value": 172 },
      { "month": "2024-04", "value": 160 },
      { "month": "2024-04", "value": 168 },
      { "month": "2024-05", "value": 181 }
    ]
  }
}
```

This is the **data** layer of a `ChartAssemblyInput`. Flint also accepts
`{ "url": "..." }` for remote JSON/CSV, but inline values are easiest while
learning.

> **Try it:** paste the block above into the [editor](/editor). The preview
> pane stays empty until you add a `chart_spec` — that is expected.

---

## Semantic types

Vega-Lite asks you to set each channel's `type` (`nominal`, `quantitative`, …)
and many axis details by hand. Flint instead asks: **what does each column
mean?**

Add a `semantic_types` map — one semantic label per field:

```json
{
  "data": {
    "values": [
      { "month": "2024-01", "value": 120 },
      { "month": "2024-01", "value": 135 },
      { "month": "2024-02", "value": 142 },
      { "month": "2024-02", "value": 150 },
      { "month": "2024-03", "value": 165 },
      { "month": "2024-03", "value": 172 },
      { "month": "2024-04", "value": 160 },
      { "month": "2024-04", "value": 168 },
      { "month": "2024-05", "value": 181 }
    ]
  },
  "semantic_types": {
    "month": "YearMonth",
    "value": "Quantity"
  }
}
```

| Field | Semantic type | What the compiler derives |
|-------|-----------------|---------------------------|
| `month` | `YearMonth`  | Parses `YYYY-MM` strings as temporal values, formats month ticks |
| `value` | `Quantity`   | Continuous value axis, numeric ticks and grid lines |

You do **not** set `type`, `timeUnit`, `axis.format`, or `scale.zero` here — the
compiler reads the semantic type registry and fills those in when it builds the
backend spec. See [Semantic types](/documentation/semantic-types) for the full
T0 → T1 → T2 system.

---

## Chart type and encodings

A Vega-Lite spec uses `mark` plus `encoding`. Flint uses **`chart_spec`**:

- `chartType` — template name (e.g. `"Scatter Plot"`, `"Bar Chart"`)
- `encodings` — map visual channels (`x`, `y`, `color`, …) to fields
- `canvasSize` — optional pixel budget (default 400×320)

### Scatter plot — temporal x value

Map `month` to the x-channel and `value` to the y-channel:

```json
{
  "data": {
    "values": [
      { "month": "2024-01", "value": 120 },
      { "month": "2024-01", "value": 135 },
      { "month": "2024-02", "value": 142 },
      { "month": "2024-02", "value": 150 },
      { "month": "2024-03", "value": 165 },
      { "month": "2024-03", "value": 172 },
      { "month": "2024-04", "value": 160 },
      { "month": "2024-04", "value": 168 },
      { "month": "2024-05", "value": 181 }
    ]
  },
  "semantic_types": {
    "month": "YearMonth",
    "value": "Quantity"
  },
  "chart_spec": {
    "chartType": "Scatter Plot",
    "encodings": {
      "x": { "field": "month" },
      "y": { "field": "value" }
    },
    "canvasSize": { "width": 400, "height": 300 }
  }
}
```

Paste this into the [editor](/editor) and open the **Vega-Lite** preview tab.
You should see one point per row arranged along a time axis. Flint treats values
like `2024-01` as year-month dates rather than arbitrary string labels. The
compiler chose temporal parsing, month tick formatting, numeric ticks, and grid
lines from `YearMonth` and `Quantity`.

`canvasSize` is Flint's target layout budget, not always a hard final bounding
box. For dense temporal axes, many facets, or long labels, the compiler may
stretch the effective width or height to keep marks readable. By default,
`maxStretch` is `2`, so a 400 px axis may grow up to 800 px before Flint makes
harder tradeoffs such as smaller steps or truncation. Set
`options.maxStretch` when you need stricter fixed-size output; see the
[layout model](/documentation/layout-model) for the full explanation.

Three observations compared to raw Vega-Lite:

1. You never wrote `"type": "temporal"` or a date parser for `YYYY-MM` strings.
2. Axis labels and grid behavior came from semantics, not manual `axis` blocks.
3. The same input can be compiled to **ECharts** or **Chart.js** from the
   preview tabs (when that chart type exists in that backend).

---

## Aggregation

With multiple rows per month, a bar or line chart usually shows a **summary**
per month — not every raw point. In Vega-Lite you add `"aggregate": "average"`
on a channel. Flint uses the same knob on encodings:

```json
{
  "data": {
    "values": [
      { "month": "2024-01", "value": 120 },
      { "month": "2024-01", "value": 135 },
      { "month": "2024-02", "value": 142 },
      { "month": "2024-02", "value": 150 },
      { "month": "2024-03", "value": 165 },
      { "month": "2024-03", "value": 172 },
      { "month": "2024-04", "value": 160 },
      { "month": "2024-04", "value": 168 },
      { "month": "2024-05", "value": 181 }
    ]
  },
  "semantic_types": {
    "month": "YearMonth",
    "value": "Quantity"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "month" },
      "y": { "field": "value", "aggregate": "average" }
    },
    "canvasSize": { "width": 400, "height": 300 }
  }
}
```

February averages to `(142 + 150) / 2 = 146`. Switch the preview to **Bar Chart**
semantics: one bar per month, height = average `value`, with the x-axis still
formatted as year-month time.

### Line chart trend

Switch the chart type while keeping the same temporal x/value y encodings:

```json
"chartType": "Line Chart",
"encodings": {
  "x": { "field": "month" },
  "y": { "field": "value", "aggregate": "average" }
}
```

Flint keeps the same `YearMonth` parsing and axis formatting, but changes the
visual template from monthly bars to a monthly trend line.

### When aggregation is optional

For many semantic types the compiler **auto-aggregates** when multiple rows
share the same x value — e.g. `Price` → `average`, additive amounts → `sum`.
Explicit `aggregate` on an encoding always wins. Details are in
[Semantic types](/documentation/semantic-types#aggregation-role).

---

## Compile your chart

The site editor previews specs for you. In your own app, call one assembler:

```ts
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';

const input = {
  data: { values: [/* … */] },
  semantic_types: { month: 'YearMonth', value: 'Quantity' },
  chart_spec: {
    chartType: 'Line Chart',
    encodings: {
      x: { field: 'month' },
      y: { field: 'value', aggregate: 'average' },
    },
    canvasSize: { width: 400, height: 300 },
  },
  options: { maxStretch: 1.5 }, // cap automatic layout growth at 1.5x
};

const vlSpec  = assembleVegaLite(input);   // → Vega-Lite JSON
const ecSpec  = assembleECharts(input);    // → ECharts option
const cjsSpec = assembleChartjs(input);    // → Chart.js config
```

Each function returns a complete, render-ready object for that library. The
Flint input stays identical across backends; only the final instantiation
step differs. That is the core promise described in
[Overview](/documentation/overview).

### Embed on a web page

**Vega-Lite** — use [Vega-Embed](https://github.com/vega/vega-embed) with the
compiled spec:

```html
<div id="vis"></div>
<script src="https://cdn.jsdelivr.net/npm/vega@6"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@6"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@7"></script>
<script>
  vegaEmbed('#vis', vlSpec);
</script>
```

**ECharts** — pass `ecSpec` to `echarts.init(dom).setOption(ecSpec)`.

**Chart.js** — `new Chart(canvas, cjsSpec)`.

Or skip glue code and use the hosted [editor](/editor) and
[gallery](/wall) while exploring.

---

## Next steps

You now know the three layers of every Flint chart:

```
data.values  +  semantic_types  +  chart_spec  →  assemble*()  →  render
```

Continue learning:

- [Exploring data](/tutorials/exploring-data) — swap fields, change chart
  types, and compare backends without rewriting axis config.
- [Gallery](/wall) — every chart template with live Vega-Lite / ECharts /
  Chart.js previews.
- [Overview](/documentation/overview) — architecture and full
  `ChartAssemblyInput` reference.
- [Semantic types](/documentation/semantic-types) — the type registry and
  compilation rules.
- [Layout model](/documentation/layout-model) — how discrete axes and facets
  are sized.

To extend the library itself, see [Adding a chart template](/documentation/adding-a-chart-template).
