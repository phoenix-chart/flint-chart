# Getting started

This tutorial walks through **Omni Game Metrics** — a synthetic game-operations dataset used in the published paper. You will build five charts in three phases and learn how Flint turns **data + semantic types + chart intent** into render-ready specs.

| What you need | Where |
|---------------|-------|
| Paste JSON and preview | [Editor](/editor) |
| See every step side by side | This page |
| API details | [API reference](/documentation/api-reference) |

Each chart step below shows a **live preview** (Vega-Lite, ECharts, Chart.js tabs).

---

## What you will learn

1. Load **data** — rows only; preview stays empty (expected).
2. Add **semantic types** — tell Flint what each column *means*.
3. Add **chart_spec** — pick a chart type and map fields to channels.
4. **Iterate** — change types or chart type; the compiler updates axes, color, and layout.
5. **Compile** — call `assembleVegaLite()` (or ECharts / Chart.js) in your own app.

**Story arc:**

```text
Phase 1 — Overview     Line + Grouped bar   (MAU trends)
Phase 2 — Change       Waterfall + Heatmap  (net adds)
Phase 3 — Composition  Sunburst             (year-end mix)
```

---

## Step 1 — The data

Each row is one **game × region × month** snapshot (1,152 rows total: 24 games × 4 regions × 12 months).

| period | game | gameType | newUsers | totalUsers | region |
|--------|------|----------|----------|------------|--------|
| 2025-01 | Starforge Tactics | PC / Client | 5997 | 10173 | N |
| 2025-01 | Starforge Tactics | PC / Client | 682 | 4475 | E |
| 2025-01 | Starforge Tactics | PC / Client | -886 | 1917 | S |

Minimal input — data only:

```json
{
  "data": {
    "values": [
      {
        "period": "2025-01",
        "game": "Starforge Tactics",
        "gameType": "PC / Client",
        "newUsers": 5997,
        "totalUsers": 10173,
        "region": "N"
      }
    ]
  }
}
```

> **Try it:** paste into the [editor](/editor). No chart appears yet — you still need semantic types and `chart_spec`.

---

## Step 2 — Semantic types

Flint cares about **meaning**, not storage type. Add `semantic_types` once per dataset; reuse it across every chart.

```json
{
  "data": { "values": [ "... 1,152 rows ..." ] },
  "semantic_types": {
    "period": "YearMonth",
    "game": "Category",
    "gameType": "Category",
    "newUsers": "Quantity",
    "totalUsers": "Quantity",
    "region": "Category"
  }
}
```

| Field | Type | Compiler uses it for |
|-------|------|----------------------|
| `period` | `YearMonth` | Temporal parsing and axis ticks |
| `game`, `gameType`, `region` | `Category` | Discrete axes, categorical color |
| `newUsers`, `totalUsers` | `Quantity` | Continuous axes, aggregation defaults |

Gallery charts use **aggregated** tables (288, 72, 14, or 96 rows). You only name fields and types — axes, formats, and scales are derived. Deep dive: [Semantic types](/documentation/semantic-types).

---

## Step 3 — Phase 1: Overview

### Line chart — MAU trend by region

**Question:** How does MAU move month to month, split by region and game type?

| Channel | Field | Role |
|---------|-------|------|
| `column` | `region` | Facet panels (N / E / S / W) |
| `x` | `period` | Time |
| `y` | `totalUsers` | MAU (aggregated) |
| `color` | `gameType` | Series color |

```flint-step
Omni: Line
0
```

You did not set `"type": "temporal"` or facet spacing — semantics + the Line Chart template handled that. Toggle preview tabs to compare backends.

### Grouped bar — same story, bar lens

**Question:** Total MAU per month, bars grouped by game type (all regions combined).

| Channel | Field |
|---------|-------|
| `x` | `period` |
| `y` | `totalUsers` |
| `color` / `group` | `gameType` |

```flint-step
Omni: Grouped Bar
0
```

---

## Step 4 — Phase 2: Change

### Waterfall — month-over-month net adds

**Question:** How did portfolio MAU move step by step through the year?

14 steps: opening MAU → each month's `sum(newUsers)` → closing MAU.

| Channel | Field |
|---------|-------|
| `x` | `Step` |
| `y` | `Amount` |
| `color` | `Type` (`start` / `delta` / `end`) |

```flint-step
Omni: Waterfall
0
```

Green = growth months; red = net-negative months.

### Heatmap — which games gained or lost users?

**Question:** Net adds by **game × month** (summed over regions).

| Channel | Field |
|---------|-------|
| `x` | `period` |
| `y` | `game` |
| `color` | `newUsers` |

`newUsers` can be **negative**. Use the `Profit` semantic type so color is **diverging and centered at zero**:

```json
"semantic_types": {
  "newUsers": { "semanticType": "Profit" },
  "period": "YearMonth",
  "game": "Category"
},
"chart_spec": {
  "chartProperties": { "colorScheme": "redblue" }
}
```

Change `Profit` back to `Quantity` in the editor — the palette becomes sequential and hides the sign of change.

```flint-step
Omni: Heatmap
0
```

---

## Step 5 — Phase 3: Composition

### Sunburst — year-end MAU mix

**Question:** How is December MAU split across region → game type → game?

| Channel | Field |
|---------|-------|
| `color` | `region` |
| `group` | `gameType` |
| `detail` | `game` |
| `size` | `totalUsers` |

```flint-step
Omni: Sunburst
0
```

Vega-Lite has no native sunburst — open the **ECharts** tab for the intended view. The same Flint input still compiles; backend support varies by chart type.

---

## Step 6 — Explore and iterate

After the walkthrough, experiment in the [editor](/editor) or from any gallery card (**Open in editor**).

### Swap chart type, keep semantics

Same line data can drive other templates. Change only `chartType` (and encodings if needed) — axis treatment updates automatically.

Example: set `"chartType": "Area Chart"` with the same `column`, `x`, `y`, and `color` as the line chart.

### Compare backends

| Function | Output |
|----------|--------|
| `assembleVegaLite(input)` | Vega-Lite spec |
| `assembleECharts(input)` | ECharts `option` |
| `assembleChartjs(input)` | Chart.js config |

| Chart | Vega-Lite | ECharts | Chart.js |
|-------|-----------|---------|----------|
| Line / Grouped bar / Waterfall / Heatmap | ✓ | ✓ | ✓ |
| Sunburst | fallback | ✓ primary | partial |

Check support before rendering:

```ts
import { vlGetTemplateDef, ecGetTemplateDef, cjsGetTemplateDef } from 'flint-chart';

vlGetTemplateDef('Heatmap');
ecGetTemplateDef('Sunburst Chart');
```

Unknown `chartType` throws at compile time — not in the renderer.

### Tune layout when labels crowd

Faceted line charts use the `column` channel — no manual facet block. If panels feel cramped:

```json
{
  "options": {
    "elasticity": 0.5,
    "maxStretch": 2,
    "minStep": 8
  }
}
```

See [Layout model](/documentation/layout-model).

### Gallery workflow

1. Open [gallery](/wall) → **Omni Game Metrics**.
2. Pick a chart → **Open in editor**.
3. Change one semantic type or field — all backend tabs rebuild.

---

## Step 7 — Compile in your app

```ts
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';

const input = {
  data: { values: [/* aggregated rows */] },
  semantic_types: {
    period: 'YearMonth',
    totalUsers: 'Quantity',
    gameType: 'Category',
    region: 'Category',
  },
  chart_spec: {
    chartType: 'Line Chart',
    encodings: {
      column: 'region',
      x: 'period',
      y: 'totalUsers',
      color: 'gameType',
    },
    canvasSize: { width: 480, height: 320 },
  },
};

const vlSpec  = assembleVegaLite(input);
const ecSpec  = assembleECharts(input);
const cjsSpec = assembleChartjs(input);
```

Same input, three backends. Details: [Overview](/documentation/overview).

### Embed on a page

- **Vega-Lite** — [Vega-Embed](https://github.com/vega/vega-embed): `vegaEmbed('#vis', vlSpec)`
- **ECharts** — `echarts.init(dom).setOption(ecSpec)`
- **Chart.js** — `new Chart(canvas, cjsSpec)`

---

## Next steps

| Goal | Link |
|------|------|
| Architecture and spec model | [Overview](/documentation/overview) |
| Semantic type reference | [Semantic types](/documentation/semantic-types) |
| All templates | [Gallery](/wall) |
| Add a new chart type | [Adding a chart template](/documentation/adding-a-chart-template) |
| Local dev setup | [Development](/documentation/development) |
