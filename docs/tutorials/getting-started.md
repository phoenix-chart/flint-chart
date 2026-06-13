# Introduction to flint-chart

This tutorial walks you through writing a visualization with **flint-chart** —
the same step-by-step style as the [Vega-Lite getting started
guide](https://vega.github.io/vega-lite/tutorials/getting_started.html), but
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

Suppose you have a small table with a categorical column `a` and a numeric
column `b`:

| a | b |
|---|---|
| C | 2 |
| C | 7 |
| C | 4 |
| D | 1 |
| D | 2 |
| D | 6 |
| E | 8 |
| E | 4 |
| E | 7 |

In flint-chart, inline data is a JSON array of row objects under `data.values`:

```json
{
  "data": {
    "values": [
      { "a": "C", "b": 2 },
      { "a": "C", "b": 7 },
      { "a": "C", "b": 4 },
      { "a": "D", "b": 1 },
      { "a": "D", "b": 2 },
      { "a": "D", "b": 6 },
      { "a": "E", "b": 8 },
      { "a": "E", "b": 4 },
      { "a": "E", "b": 7 }
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
      { "a": "C", "b": 2 },
      { "a": "C", "b": 7 },
      { "a": "C", "b": 4 },
      { "a": "D", "b": 1 },
      { "a": "D", "b": 2 },
      { "a": "D", "b": 6 },
      { "a": "E", "b": 8 },
      { "a": "E", "b": 4 },
      { "a": "E", "b": 7 }
    ]
  },
  "semantic_types": {
    "a": "Category",
    "b": "Quantity"
  }
}
```

| Field | Semantic type | What the compiler derives |
|-------|-----------------|---------------------------|
| `a`   | `Category`      | Discrete axis, categorical color defaults |
| `b`   | `Quantity`      | Continuous axis, zero baseline for bar-length marks |

You do **not** set `type`, `axis.title`, `format`, or `scale.zero` here — the
compiler reads the semantic type registry and fills those in when it builds the
backend spec. See [Semantic types](/documentation/semantic-types) for the full
T0 → T1 → T2 system.

---

## Chart type and encodings

A Vega-Lite spec uses `mark` plus `encoding`. Flint uses **`chart_spec`**:

- `chartType` — template name (e.g. `"Scatter Plot"`, `"Bar Chart"`)
- `encodings` — map visual channels (`x`, `y`, `color`, …) to fields
- `canvasSize` — optional pixel budget (default 400×320)

### Scatter plot — position encodings

Map `a` to the x-channel and `b` to the y-channel:

```json
{
  "data": {
    "values": [
      { "a": "C", "b": 2 },
      { "a": "C", "b": 7 },
      { "a": "C", "b": 4 },
      { "a": "D", "b": 1 },
      { "a": "D", "b": 2 },
      { "a": "D", "b": 6 },
      { "a": "E", "b": 8 },
      { "a": "E", "b": 4 },
      { "a": "E", "b": 7 }
    ]
  },
  "semantic_types": {
    "a": "Category",
    "b": "Quantity"
  },
  "chart_spec": {
    "chartType": "Scatter Plot",
    "encodings": {
      "x": { "field": "a" },
      "y": { "field": "b" }
    },
    "canvasSize": { "width": 400, "height": 300 }
  }
}
```

Paste this into the [editor](/editor) and open the **Vega-Lite** preview tab.
You should see one point per row. Categories appear on the x-axis; numeric
values on the y-axis. The compiler chose axis types, ticks, and grid lines from
`Category` and `Quantity`.

Three observations compared to raw Vega-Lite:

1. You never wrote `"type": "nominal"` or `"type": "quantitative"`.
2. Axis labels and grid behavior came from semantics, not manual `axis` blocks.
3. The same input can be compiled to **ECharts** or **Chart.js** from the
   preview tabs (when that chart type exists in that backend).

---

## Aggregation

With multiple rows per category, a bar chart usually shows a **summary** per
category — not every raw point. In Vega-Lite you add `"aggregate": "average"`
on a channel. Flint uses the same knob on encodings:

```json
{
  "data": {
    "values": [
      { "a": "C", "b": 2 },
      { "a": "C", "b": 7 },
      { "a": "C", "b": 4 },
      { "a": "D", "b": 1 },
      { "a": "D", "b": 2 },
      { "a": "D", "b": 6 },
      { "a": "E", "b": 8 },
      { "a": "E", "b": 4 },
      { "a": "E", "b": 7 }
    ]
  },
  "semantic_types": {
    "a": "Category",
    "b": "Quantity"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "a" },
      "y": { "field": "b", "aggregate": "average" }
    },
    "canvasSize": { "width": 400, "height": 300 }
  }
}
```

Category **D** averages to `(1 + 2 + 6) / 3 = 3`. Switch the preview to
**Bar Chart** semantics: vertical bars, one per category, height = mean of `b`.

### Horizontal bars

Swap the x and y encodings (same idea as swapping channels in Vega-Lite):

```json
"chartType": "Bar Chart",
"encodings": {
  "x": { "field": "b", "aggregate": "average" },
  "y": { "field": "a" }
}
```

Flint picks the bar orientation from which axis is categorical. You still only
name fields and aggregates — not `orient`, `size`, or band padding.

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
  semantic_types: { a: 'Category', b: 'Quantity' },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: {
      x: { field: 'a' },
      y: { field: 'b', aggregate: 'average' },
    },
    canvasSize: { width: 400, height: 300 },
  },
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
