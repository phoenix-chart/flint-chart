---
name: flint-chart-author
description: Author a flint-chart ChartAssemblyInput — pick a chart type, map fields to channels, annotate each field with a semantic type. USE WHEN the user asks to "make a chart", "visualize this data", or "generate a Vega-Lite/ECharts/Chart.js spec" from tabular data. The library deterministically derives sizing, zero baseline, color schemes, and formatting from the semantic types, so DO NOT hand-tune those values.
---

# flint-chart: authoring a chart spec

## What you produce (and what you do NOT)

Your output is the **spec**: the `chart_spec` and `semantic_types` of a
`ChartAssemblyInput`. You reference data columns **by name**. The host
passes the resulting input to `assembleVegaLite`, `assembleECharts`,
or `assembleChartjs` to get a backend spec.

**You write the input spec, not the output spec.** And critically:

- **DO** emit `chart_spec` (chart type, channel→field mapping, properties)
  and `semantic_types` (field → semantic type).
- **Reference columns by name.** How `data` itself gets bound depends on
  the situation — a URL, a host-side variable, or embedded rows (see "How
  data gets bound"). Embedding is fine for small tables; just don't
  re-serialize a *large* dataset by hand, since that risks truncation and
  silent value corruption and wastes tokens.

```ts
interface ChartAssemblyInput {
  // Bound by the HOST or by you, depending on the situation (see below).
  data: { values: any[] } | { url: string };
  semantic_types?: Record<string, string>;   // field → semantic type  ← you write this
  chart_spec: {                               //                        ← you write this
    chartType: string;                        // e.g. "Scatter Plot"
    encodings: Record<string, EncodingValue>; // channel → { field, ... } (or array)
    canvasSize?: { width: number; height: number };  // default 400×320
    chartProperties?: Record<string, any>;    // per-chart tuning (optional)
  };
  options?: Record<string, any>;              // global layout options (rarely needed)
}
```

## How data gets bound

Bind `data` with the mechanism that fits the situation, in this order of
preference:

1. **`data: { url: "..." }` — if the data is accessible at a URL/path.**
   The dataset lives in a file or endpoint; the spec just points at it.
   No data flows through the model.
2. **`data: { values: rows }` — if you're generating code, use a variable.**
   `rows` is a symbol (variable, dataframe, tool argument) already loaded
   on the host. You reference it; you do not serialize its contents.
3. **`data: { values: [ ...literal... ] }` — otherwise, embed directly.**
   When there's no URL and no host-side variable to reference (e.g. the
   user pasted a small table into a tool-less chat), inline the rows. This
   is a normal, useful path — just don't reproduce a *large* dataset by
   hand, since that risks truncation and silent value corruption.

Deployment scenarios:

- **Chat app (e.g. Claude Desktop) with a render/MCP tool:** call the
  tool with the spec plus a *reference* to host-side data (file path,
  uploaded CSV, prior tool result). Mechanism 1 or 2.
- **Chat app, no tools, user pasted a table:** there's no runtime to
  inject data, so embed it directly (mechanism 3) or point at a `url` if
  one exists.
- **Coding agents (Copilot, Cursor, Claude Code):** you write *code*. Bind
  data by symbol reference — `data: { values: rows }` where `rows` was
  loaded from CSV/DB/dataframe in adjacent code — then call the assembler.
  This is the dominant real-world case.

In the worked examples below, `data` is shown as a placeholder
(`{ values: [] }`) to signal "host binds this" — focus on `chart_spec`
and `semantic_types`.

## Step 1 — pick `chartType`

Use one of the registered names **exactly**. Vega-Lite is the default and
broadest backend; the table below lists each Vega-Lite chart type, the
channels it accepts, and its tuning properties (see "Chart-level
properties"). Required channels are noted.

| chartType | Channels | Notes / required |
|---|---|---|
| `"Scatter Plot"` | x, y, color, size, opacity, column, row | x + y required |
| `"Regression"` | x, y, size, color, column, row | scatter + fit line; props `regressionMethod`, `polyOrder` |
| `"Connected Scatter Plot"` | x, y, order, color, detail, column, row | x + y required; `order` = connection sequence (time/index), so the line traces a trajectory and may self-cross |
| `"Ranged Dot Plot"` | x, y, color | dumbbell of two x per category |
| `"Strip Plot (Jitter)"` | x, y, color, size, column, row | props `stepWidth`, `pointSize`, `opacity` |
| `"Bar Chart"` | x, y, color, opacity, column, row | one discrete + one measure; prop `cornerRadius` |
| `"Grouped Bar Chart"` | x, y, group, column, row | `group` = the clustering category |
| `"Stacked Bar Chart"` | x, y, color, column, row | prop `stackMode` |
| `"Pyramid Chart"` | x, y, color | diverging horizontal bars |
| `"Lollipop Chart"` | x, y, color, column, row | prop `dotSize` |
| `"Waterfall Chart"` | x, y, color, column, row | prop `cornerRadius` |
| `"Gantt Chart"` | y, x, x2, color, detail, column, row | x = start, x2 = end |
| `"Bullet Chart"` | y, x, goal, color, column, row | `goal` required (target) |
| `"Histogram"` | x, color, column, row | x = measure to bin; prop `binCount` |
| `"Heatmap"` | x, y, color, column, row | color = the measure |
| `"Line Chart"` | x, y, color, strokeDash, detail, opacity, column, row | props `interpolate`, `showPoints` |
| `"Bump Chart"` | x, y, color, detail, column, row | rank-over-time lines |
| `"Slope Chart"` | x, y, color, detail, column, row | two-period value change; straight segments + end points, one line per category |
| `"Area Chart"` | x, y, color, opacity, column, row | props `interpolate`, `opacity`, `stackMode` |
| `"Range Area Chart"` | x, y, y2, color, column, row | x + y + y2 required; translucent band from `y` (low) to `y2` (high), value axis fits the band (not zero) |
| `"Violin Plot"` | x, y, color, row | x (category) + y (measure) required; mirrored KDE density per category, prop `bandwidth`; **Vega-Lite only**; `column` is used internally for the per-category panels |
| `"Streamgraph"` | x, y, color, column, row | centre-stacked areas |
| `"Density Plot"` | x, color, column, row | prop `bandwidth` |
| `"Pie Chart"` | size, color, column, row | `size` = slice value (→ angle), `color` = category |
| `"Rose Chart"` | x, y, color, column, row | polar bars; props `alignment`, `innerRadius`, `padAngle` |
| `"Radar Chart"` | x, y, color, column, row | props `filled`, `fillOpacity`, `strokeWidth` |
| `"Candlestick Chart"` | x, open, high, low, close, column, row | OHLC all required |
| `"Bar-Table"` | y, x, color, column, row | compact bars + value labels |
| `"KPI Card"` | metric, value, goal | big-number tile; prop `behindThreshold` |
| `"Map (Bubble)"` | longitude, latitude, color, size, opacity | props `region`, `projection` |
| `"Choropleth"` | id, color, detail | `id` = geographic key |

**Donut chart:** use `"Pie Chart"` with `chartProperties.innerRadius > 0`.

**Backend coverage.** Vega-Lite supports all of the above. Other backends
support a subset (verify if targeting a non-VL backend):

- **ECharts** adds: `"Boxplot"`, `"Calendar Heatmap"`, `"Gauge"`,
  `"Funnel"`, `"Treemap"`, `"Sunburst"`, `"Sankey"`,
  `"Parallel Coordinates"`, `"Graph"`, `"Tree"`.
- **Chart.js** supports: Scatter, Bubble, Bar, Grouped Bar, Stacked Bar,
  Combo, Line, Area, Range Area, Pie, Doughnut, Histogram, Radar, Rose, Slope,
  Connected Scatter.

You do not need to call the library or inspect its source to author the
input — pick from this table.

## Step 2 — map fields to channels

Each channel maps to an **encoding object** `{ field, ... }` (or a bare
string shorthand, expanded to `{ field: "<string>" }`):

```json
"encodings": {
  "x": { "field": "weight" },
  "y": "mpg",
  "color": { "field": "origin" }
}
```

**Encoding object fields** (all optional except `field`):

| Field | Values | Purpose |
|---|---|---|
| `field` | column name | Bind the channel to a data column |
| `type` | `quantitative`, `nominal`, `ordinal`, `temporal` | Override the inferred encoding type (rarely needed) |
| `aggregate` | `count`, `sum`, `average` | Force an aggregation on a measure channel |
| `sortOrder` | `ascending`, `descending` | Sort direction for a discrete/sorted axis |
| `sortBy` | channel name (e.g. `"y"`) or field | Sort a category axis by another channel's measure |
| `scheme` | Vega scheme name (e.g. `viridis`, `redblue`) | Color scheme for the `color` channel |

You usually don't need `type`, `aggregate`, or `sortOrder` — they're
inferred from the semantic type. Set them only with specific intent.

**Multi-series (wide → long).** To plot several measure columns as series,
pass an **array** on `x` or `y` (only those two channels). The library
folds them into long form and synthesizes a series/legend field:

```json
"encodings": { "x": { "field": "month" }, "y": ["sales", "profit"] }
```

All array fields must be quantitative, and you cannot also bind `color`
when using the array form (the fold owns the color/legend). This is the
**only** built-in reshape — there is no `transforms`/`fold` property. If a
chart needs a shape the data doesn't have (long-vs-wide, an aggregate the
encodings can't express, a derived/computed column, a pivot, a join):

- **If you're writing code**, reshape the data first with a normal data
  library — pandas/polars in Python, or Arquero/`Array.map`/SQL in JS —
  and pass the transformed rows in via `data: { values: rows }`. flint
  deliberately does **not** try to be a data-wrangling layer.
- **If you have tools/MCP servers available**, use them — a code-execution
  or data/SQL/MCP tool to reshape, aggregate, or fetch the data, then feed
  the result into the spec. 
- **Otherwise** (no runtime and no tools to transform in), surface the gap
  to the developer rather than inventing a transform property that doesn't
  exist.

## Step 3 — annotate with semantic types

**This is the most important step.** Semantic types drive all downstream
decisions — formatting, zero baseline, color scheme, scale direction, and
more. Pick the most specific type for each field. Full registered set:

| Family | Semantic types |
|---|---|
| Temporal (point) | `DateTime`, `Date`, `Time`, `Timestamp` |
| Temporal (granule) | `Year`, `Quarter`, `Month`, `Week`, `Day`, `Hour`, `YearMonth`, `YearQuarter`, `YearWeek`, `Decade` |
| Temporal (span) | `Duration` |
| Measure (amount) | `Amount`, `Price`, `Quantity`, `Count`, `Number` |
| Measure (proportion) | `Percentage` |
| Measure (signed/diverging) | `Profit`, `PercentageChange`, `Sentiment`, `Correlation` |
| Measure (physical) | `Temperature` |
| Discrete / rank | `Rank`, `Score`, `ID` |
| Geographic (coord) | `Latitude`, `Longitude` |
| Geographic (place) | `Country`, `State`, `City`, `Region`, `Address`, `ZipCode` |
| Categorical | `Category`, `Name`, `Status`, `Boolean`, `Direction`, `Range` |
| Fallback | `Unknown` |

What choosing well gets you (automatically):

- `Price` / `Amount` → currency formatting, zero baseline, sequential color
- `Temperature` → diverging color scheme, no forced zero baseline
- `Correlation` → fixed `[-1, 1]` diverging domain
- `Rank` → reversed axis (1 on top), discrete color
- `Date` / `DateTime` → temporal axis with auto-granularity formatting
- `Percentage` → percent formatting, 0–100 domain awareness

If you don't know, use `Quantity` for numbers, `Category` for strings,
`Date`/`DateTime` for date-shaped values. Do **not** invent type names.

## Chart-level properties (`chartProperties`)

`chartProperties` is an optional per-chart tuning map. Set a property only
when the user asks for that behavior — defaults are sensible. These are
**design choices**, not styling overrides (colors/fonts/ticks are still
derived). Values are clamped to the ranges shown.

| Chart type | Property | Type / range (default) | Effect |
|---|---|---|---|
| Bar Chart | `cornerRadius` | 0–15 (0) | Round bar corners (px) |
| Bar / Area / Stacked Bar | `stackMode` | `stacked` \| `normalize` \| `layered` (unset) | Stacking behavior; `normalize` = 100% |
| Line / Area | `interpolate` | `linear` \| `monotone` \| `step` \| `step-before` \| `step-after` \| `basis` \| `cardinal` \| `catmull-rom` (`linear`) | Curve shape |
| Line | `showPoints` | boolean (false) | Draw point markers on the line |
| Area | `opacity` | 0.1–1 (0.7) | Fill opacity |
| Scatter | `opacity` | 0.1–1 (1) | Point opacity |
| Strip Plot | `stepWidth` | 10–100 (20) | Jitter spread |
| Strip Plot | `pointSize` | 0–150 (0=auto) | Point size |
| Strip Plot | `opacity` | 0–1 (0=auto) | Point opacity |
| Histogram | `binCount` | 5–50 (10) | Number of bins |
| Density Plot | `bandwidth` | 0.05–2 (0=auto) | Kernel bandwidth |
| Pie Chart | `innerRadius` | 0–100 (0) | Donut hole size (>0 → donut) |
| Rose Chart | `alignment` | `left` \| `center` (`left`) | Wedge alignment |
| Rose Chart | `innerRadius` | 0–100 (0) | Inner radius |
| Rose Chart | `padAngle` | 0–0.1 (0) | Gap between slices |
| Lollipop | `dotSize` | 20–300 (80) | Circle size (px) |
| Waterfall | `cornerRadius` | 0–8 (0) | Round bar corners |
| Regression | `regressionMethod` | `linear` \| `log` \| `exp` \| `pow` \| `quad` \| `poly` (`linear`) | Fit method |
| Regression | `polyOrder` | 1–5 (3) | Polynomial order (when `poly`) |
| Radar | `filled` | boolean (true) | Fill the polygon |
| Radar | `fillOpacity` | 0–0.5 (0.15) | Polygon fill opacity |
| Radar | `strokeWidth` | 0.5–4 (1.5) | Line width |
| KPI Card | `behindThreshold` | 0–1 (0.5) | Value/goal ratio cutoff for color |
| Map (Bubble) | `region` | `us` \| `world` \| `auto` (`auto`) | Geographic scope |
| Map (Bubble) | `projection` | `mercator` \| `equalEarth` \| `orthographic` \| `stereographic` \| `conic` \| `mollweide` | Map projection |

**Cross-cutting properties** (apply to position/faceted charts when
relevant; set only to force non-default behavior):

- `independentYAxis` (boolean) — faceted charts: give each panel its own
  y-scale.
- `logScale_x` / `logScale_y` (boolean) — force a logarithmic axis.
- `includeZero_x` / `includeZero_y` (boolean) — force the axis to include 0.
- `xAxisType` / `yAxisType` (`temporal` | `nominal`) — force a temporal
  field to render as discrete bands (or vice-versa).

## Parameter overrides — when to reach for them

Overrides exist, but prefer letting semantic types drive decisions. Reach
for an override only when the user's intent genuinely conflicts with the
default:

- **Force an aggregation:** `encodings.y = { field: "sales", aggregate: "sum" }`.
- **Sort a category axis by its measure:** `encodings.x = { field: "name", sortBy: "y", sortOrder: "descending" }`.
- **Pick a color scheme:** `encodings.color = { field: "region", scheme: "tableau10" }`.
- **Override an inferred type:** `encodings.x = { field: "year", type: "ordinal" }` (e.g. treat a year as discrete bands).
- **Resize the canvas:** `chart_spec.canvasSize = { width, height }` (default 400×320).
- **Force log / zero baseline:** the `logScale_*` / `includeZero_*` chart
  properties above.

Global layout tuning lives in the top-level `options` object (e.g.
`addTooltips`, band padding, facet sizing). It is rarely needed for
authoring — omit it unless asked.

## Worked examples

In each example `data` is a placeholder — the host binds real rows or a
URL. You author only `chart_spec` and `semantic_types`.

### Scatter plot

User: "Plot car weight vs fuel economy, colored by origin."

```json
{
  "data": { "values": [] },
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

### Revenue bar chart with facets, sorted by value

User: "Show revenue by product line, biggest first, one panel per region."

```json
{
  "data": { "values": [] },
  "semantic_types": {
    "product_line": "Category",
    "revenue": "Amount",
    "region": "Region"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "product_line", "sortBy": "y", "sortOrder": "descending" },
      "y": { "field": "revenue" },
      "column": { "field": "region" }
    }
  }
}
```

### Time series, multiple series (wide → long via array)

User: "Line chart of monthly sales and profit."

```json
{
  "data": { "values": [] },
  "semantic_types": {
    "month": "YearMonth",
    "sales": "Amount",
    "profit": "Profit"
  },
  "chart_spec": {
    "chartType": "Line Chart",
    "encodings": {
      "x": { "field": "month" },
      "y": ["sales", "profit"]
    },
    "chartProperties": { "interpolate": "monotone", "showPoints": true }
  }
}
```

### Donut chart (Pie + innerRadius), value on `size`

User: "Show market share by vendor as a donut."

Pie/donut maps the slice value to `size` (rendered as angle) and the
category to `color`. Data is already long (one row per vendor).

```json
{
  "data": { "values": [] },
  "semantic_types": {
    "vendor": "Category",
    "share": "Percentage"
  },
  "chart_spec": {
    "chartType": "Pie Chart",
    "encodings": {
      "size": { "field": "share" },
      "color": { "field": "vendor" }
    },
    "chartProperties": { "innerRadius": 60 }
  }
}
```

### Bullet chart (KPI vs target)

User: "Show each rep's sales against their quota."

```json
{
  "data": { "values": [] },
  "semantic_types": {
    "rep": "Name",
    "sales": "Amount",
    "quota": "Amount"
  },
  "chart_spec": {
    "chartType": "Bullet Chart",
    "encodings": {
      "y": { "field": "rep" },
      "x": { "field": "sales" },
      "goal": { "field": "quota" }
    }
  }
}
```

## What you should NOT do

- **Don't re-emit the data.** Reference columns by name; let the host bind
  `data` (url, variable, or small literal). Never paste large datasets.
- **Don't write backend specs directly** — write the `ChartAssemblyInput`,
  then call the assembler. That's the whole point.
- **Don't invent transforms.** The only built-in reshape is the array form
  on `x`/`y`. If the data shape is wrong for the chart, say so and ask the
  host to reshape it.
- **Don't invent field names.** Reference only columns that exist in the
  dataset, spelled exactly. For wide-format data (one column per measure)
  feeding a chart that cannot use the `x`/`y` array fold (for example pie or
  arc, which bind `theta`/`color`), reshape to long upstream rather than
  guessing category/value column names that are not present.
- **Don't set `type`/`aggregate`/`sortOrder`** unless intent conflicts
  with the default.
- **Don't pass colors, font sizes, axis tick counts** — the compiler
  derives these. Users fine-tune the *output* spec.
- **Don't invent semantic type names.** If none fit, use the family
  default (`Quantity`, `Category`, `Date`).
- **Don't call the library to discover channels/types** — this document is
  the authoring reference.

## Validation checklist

Before returning, verify:

1. `chartType` is an exact registered name supported by the target backend.
2. Every `field` referenced in `encodings` is a real column name.
3. Every encoded field has an entry in `semantic_types` (specific type).
4. Required channels for the chart type are present (e.g. Bullet→`goal`,
   Candlestick→`open/high/low/close`, Pie→`size`+`color`).
5. Any `chartProperties` keys are valid for that chart type and in range.
6. You did **not** inline large data or hand-tune derived styling.
