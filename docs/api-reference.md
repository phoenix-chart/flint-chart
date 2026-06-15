# API reference

JavaScript / TypeScript package: **`flint-chart`** (`packages/flint-js`). 

Python package: **`flint`** — Vega-Lite assembly today; input shape mirrors the JS API.

Conceptual background: [Overview](/documentation/overview) · Pipeline: [Architecture](/documentation/architecture)

---

## Table of Contents

- [§1 Flint spec mapping](#1-flint-spec-mapping)
- [§2 Assemblers](#2-assemblers)
- [§3 ChartAssemblyInput](#3-chartassemblyinput)
- [§4 Encodings and options](#4-encodings-and-options)
- [§5 Complete example](#5-complete-example)
- [§6 Template discovery](#6-template-discovery)
- [§7 Core utilities](#7-core-utilities)
- [§8 Overflow and warnings](#8-overflow-and-warnings)
- [§9 Subpath exports](#9-subpath-exports)
- [§10 Related](#10-related)

---

# §1 Flint spec mapping

| Flint | API field | Contents |
|---------------|-----------|----------|
| **dataSpec** | `semantic_types` | `field → string` or `field → SemanticAnnotation` |
| Raw table | `data` | `{ values: rows[] }` or `{ url: "..." }` |
| **chartSpec** | `chart_spec` | `chartType`, `encodings`, `canvasSize`, `chartProperties` |

`semantic_types` is authored once per dataset and reused across charts; only `chart_spec` changes during exploration.

### SemanticAnnotation (inline in `semantic_types`)

```ts
interface SemanticAnnotation {
  semanticType: string;
  intrinsicDomain?: [number, number];  // e.g. Rating [1, 5]
  unit?: string;                        // e.g. USD, °C
  sortOrder?: string[];                 // custom ordinal order
}
```

Bare string shorthand: `"Price"` ≡ `{ semanticType: "Price" }`.

---

# §2 Assemblers

All backends accept the same `ChartAssemblyInput` and return a render-ready object.

```ts
import {
  assembleVegaLite,
  assembleECharts,
  assembleChartjs,
  assembleGoFish,
} from 'flint-chart';

const vlSpec  = assembleVegaLite(input);
const ecSpec  = assembleECharts(input);
const cjsSpec = assembleChartjs(input);
const gfSpec  = assembleGoFish(input);
```

| Export | Returns |
|--------|---------|
| `assembleVegaLite` | Vega-Lite JSON spec |
| `assembleECharts` | ECharts `option` object |
| `assembleChartjs` | Chart.js configuration |
| `assembleGoFish` | GoFish imperative spec |

Unknown `chartType` for a backend throws before render. Check support with `vlGetTemplateDef`, `ecGetTemplateDef`, or `cjsGetTemplateDef`.

---

# §3 ChartAssemblyInput

```ts
interface ChartAssemblyInput {
  data: { values: Record<string, unknown>[] } | { url: string };
  semantic_types?: Record<string, string | SemanticAnnotation>;
  chart_spec: {
    chartType: string;
    encodings: Record<string, ChartEncoding | string>;  // string = field shorthand
    canvasSize?: { width: number; height: number };    // default 400×320
    chartProperties?: Record<string, unknown>;
  };
  options?: AssembleOptions;
  field_display_names?: Record<string, string>;
}
```

### `data`

| Form | Description |
|------|-------------|
| `{ values: rows[] }` | Inline row objects (editor and tutorials) |
| `{ url: "..." }` | Remote JSON or CSV URL |

### `semantic_types`

Maps column name → semantic type. Drives encoding type, formatting, aggregation defaults, color class, and layout. See [Semantic types](/documentation/semantic-types).

### `chart_spec`

| Field | Description |
|-------|-------------|
| `chartType` | Template name — must match a backend registry entry (`"Bar Chart"`, `"Heatmap"`, …) |
| `encodings` | Channel → encoding map |
| `canvasSize` | Pixel budget for layout |
| `chartProperties` | Template-specific toggles (e.g. `orient`, `opacity`) |

---

# §4 Encodings and options

### ChartEncoding

```ts
interface ChartEncoding {
  field?: string;
  type?: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
  aggregate?: 'count' | 'sum' | 'average';
  sortOrder?: 'ascending' | 'descending';
  sortBy?: string;
  scheme?: string;
}
```

Explicit `type` overrides semantic inference. Explicit `aggregate` overrides auto-aggregation when enabled.

Common channels: `x`, `y`, `color`, `size`, `shape`, `column`, `row`, `group`, `detail`.

### AssembleOptions (selected)

```ts
interface AssembleOptions {
  addTooltips?: boolean;       // default false
  elasticity?: number;         // discrete stretch exponent (default 0.5)
  maxStretch?: number;         // unified stretch cap (default 2)
  facetElasticity?: number;    // facet stretch (default 0.3)
  minStep?: number;            // min px per discrete item (default 6)
  minSubplotSize?: number;     // min facet subplot px (default 60)
  maxColorValues?: number;     // color cardinality before truncation (default 24)
  stepPadding?: number;        // band inner padding fraction (default 0.1)
  defaultBandSize?: number;    // baseline px per category (backend-tuned)
}
```

Full list: `packages/flint-js/src/core/types.ts` (`AssembleOptions`). Behavior: [Layout model](/documentation/layout-model).

---

# §5 Complete example

```ts
const input: ChartAssemblyInput = {
  data: {
    values: [
      { quarter: 'Q1', revenue: 1200 },
      { quarter: 'Q2', revenue: 1450 },
      { quarter: 'Q3', revenue: 980 },
      { quarter: 'Q4', revenue: 1800 },
    ],
  },
  semantic_types: { quarter: 'Quarter', revenue: 'Price' },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: {
      x: { field: 'quarter' },
      y: { field: 'revenue' },
    },
    canvasSize: { width: 480, height: 320 },
  },
};

const spec = assembleVegaLite(input);
```

---

# §6 Template discovery

```ts
import {
  vlTemplateDefs,
  vlGetTemplateDef,
  vlGetTemplateChannels,
  ecGetTemplateDef,
  cjsGetTemplateDef,
} from 'flint-chart';

Object.keys(vlTemplateDefs);
// ["Points", "Bars", "Lines & Areas", …]

vlGetTemplateChannels('Scatter Plot');
// ["x", "y", "color", "size", "opacity", "column", "row"]
```

---

# §7 Core utilities

Re-exported from `flint-chart` / `flint-chart/core`:

| Symbol | Purpose |
|--------|---------|
| `inferVisCategory` | Infer coarse vis category from raw data |
| `getVisCategory` | Look up category for a semantic type string |
| `getRegistryEntry` | Query `TypeRegistryEntry` for a type |
| `channels`, `channelGroups` | Channel metadata |

Key types: `ChartAssemblyInput`, `ChartEncoding`, `ChartTemplateDef`, `AssembleOptions`, `ChartWarning`, `ChannelSemantics`.

---

# §8 Overflow and warnings

When a discrete channel exceeds the layout budget, the compiler:

1. Computes how many items fit ([Layout model §2](/documentation/layout-model#2-discrete-axis-elastic-budget-model))
2. Applies the template overflow strategy
3. Filters data to kept values
4. Attaches warnings to the result

Default strategy priority:

1. Connected marks (line, area) — keep all points
2. User-specified sort — keep top/bottom N
3. Opposite quantitative axis — sort and truncate
4. Bar + count — sum-aggregate then truncate
5. Numeric field — numeric sort, first N
6. Fallback — first N in data order

Inspect `_warnings` or `ChartWarning` arrays in integration code to surface truncation in UI.

---

# §9 Subpath exports

| Import path | Contents |
|-------------|----------|
| `flint-chart` | Assemblers + main re-exports |
| `flint-chart/core` | Types, semantics, layout |
| `flint-chart/vegalite` | VL templates and `assembleVegaLite` |
| `flint-chart/echarts` | ECharts templates and `assembleECharts` |
| `flint-chart/chartjs` | Chart.js templates and `assembleChartjs` |
| `flint-chart/gofish` | GoFish templates and `assembleGoFish` |
| `flint-chart/test-data` | Gallery generators (`TEST_GENERATORS`) |

---

# §10 Related

- [Overview](/documentation/overview) — dataSpec + chartSpec motivation
- [Architecture](/documentation/architecture) — three-stage pipeline
- [Semantic types](/documentation/semantic-types) — type hierarchy and resolution
- [Getting started](/tutorials/getting-started) — hands-on walkthrough
- [Adding a backend](/documentation/adding-a-backend) — new `assemble*()` target
- [Paper (PDF)](https://github.com/microsoft/flint-chart/blob/main/docs/figs/AgChart.pdf)
