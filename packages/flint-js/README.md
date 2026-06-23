# flint-chart

> A semantic-level visualization library that compiles data **+** semantic types
> into chart specifications for [Vega-Lite](https://vega.github.io/vega-lite/),
> [ECharts](https://echarts.apache.org/), and [Chart.js](https://www.chartjs.org/).

You (or an LLM) describe a chart at the semantic level: chart type, field
assignments, and a **semantic type** per field (e.g. `Revenue`, `Rank`,
`CategoryCode`). A deterministic compiler derives the low-level parameters
(sizing, zero-baseline, number formatting, color schemes, mark templates) so
charts look good and stay editable without another model call.

Pure TypeScript. No UI framework dependencies. Data in, spec out.

## Install

```bash
npm install flint-chart
```

## Quick start

```ts
import { assembleVegaLite, type ChartAssemblyInput } from 'flint-chart';

const input: ChartAssemblyInput = {
  data: {
    values: [
      { region: 'North', revenue: 120 },
      { region: 'South', revenue: 90 },
      { region: 'East', revenue: 150 },
    ],
  },
  semantic_types: { region: 'Category', revenue: 'Quantity' },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: { x: { field: 'region' }, y: { field: 'revenue' } },
  },
};

const vegaLiteSpec = assembleVegaLite(input);
```

The same `ChartAssemblyInput` compiles to any backend:

```ts
import { assembleVegaLite, assembleECharts, assembleChartjs } from 'flint-chart';

const vl = assembleVegaLite(input);   // Vega-Lite spec
const ec = assembleECharts(input);    // ECharts option
const cj = assembleChartjs(input);    // Chart.js config
```

## Subpath exports

| Import | Contents |
|---|---|
| `flint-chart` | Top-level: the three `assemble*` functions plus core types |
| `flint-chart/core` | Semantic types, `ChartAssemblyInput`, shared compiler logic |
| `flint-chart/vegalite` | Vega-Lite backend |
| `flint-chart/echarts` | ECharts backend |
| `flint-chart/chartjs` | Chart.js backend |
| `flint-chart/test-data` | Sample data generators used by the gallery and tests |
| `flint-chart/gallery` | Curated example specs |

Both ESM (`import`) and CommonJS (`require`) builds are published, with type
declarations for every entry point.

## Rendering

This package produces **specs**, not pixels. To render those specs to PNG or SVG
without a browser, use the companion
[`flint-chart-mcp`](https://github.com/microsoft/flint-chart/tree/main/packages/flint-mcp)
server (or pass the spec to your own Vega-Lite / ECharts / Chart.js renderer).

## Documentation

- [Project overview & docs](https://github.com/microsoft/flint-chart#readme)
- [Semantic-type model & rationale](src/docs/design-semantics.md)
- [Stretch / banking layout model](src/docs/design-stretch-model.md)
- [Agent authoring skill](https://github.com/microsoft/flint-chart/blob/main/agent-skills/flint-chart-author/SKILL.md)

## License

MIT © Microsoft Corporation
