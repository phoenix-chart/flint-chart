# Getting started

Flint starts from a simple idea: describe **what your data means**, then say
**what picture you want**. Flint turns that into a render-ready chart spec for
Vega-Lite, ECharts, or Chart.js.

This page keeps the first pass intentionally small. You will install the
package, look at one complete Flint spec, and compile it into a chart.

## Install

### JavaScript / TypeScript

Install Flint:

```bash
npm install flint-chart
```

If you want to render Vega-Lite charts in the browser, also install the renderer
stack:

```bash
npm install vega vega-lite vega-embed
```

### Python

Install the Python package:

```bash
pip install flint-chart
```

For notebooks or static HTML output, Altair can render the Vega-Lite spec Flint
returns:

```bash
pip install altair
```

## Your first Flint spec

Here is the whole input for a small monthly signups chart:

```json
{
  "data": {
    "values": [
      { "month": "2024-01", "signups": 120 },
      { "month": "2024-02", "signups": 146 },
      { "month": "2024-03", "signups": 168 },
      { "month": "2024-04", "signups": 164 },
      { "month": "2024-05", "signups": 181 }
    ]
  },
  "semantic_types": {
    "month": "YearMonth",
    "signups": "Quantity"
  },
  "chart_spec": {
    "chartType": "Line Chart",
    "encodings": {
      "x": { "field": "month" },
      "y": { "field": "signups" }
    },
    "baseSize": { "width": 420, "height": 280 }
  }
}
```

```flint-chart
{
  "data": {
    "values": [
      { "month": "2024-01", "signups": 120 },
      { "month": "2024-02", "signups": 146 },
      { "month": "2024-03", "signups": 168 },
      { "month": "2024-04", "signups": 164 },
      { "month": "2024-05", "signups": 181 }
    ]
  },
  "semantic_types": {
    "month": "YearMonth",
    "signups": "Quantity"
  },
  "chart_spec": {
    "chartType": "Line Chart",
    "encodings": {
      "x": { "field": "month" },
      "y": { "field": "signups" }
    },
    "baseSize": { "width": 420, "height": 280 }
  }
}
```

Read it as two pieces:

- **DataSpec**: the `data` and `semantic_types` sections. This is where the
  table lives, and where each column gets a meaning. `month` is a `YearMonth`,
  so Flint treats strings like `2024-01` as dates. `signups` is a `Quantity`, so
  Flint gives it a numeric axis. If you are working from a messy CSV, database
  schema, or natural-language request, an AI agent can draft this part for you;
  see [Agent workflows](/tutorials/agent-workflows).
- **ChartSpec**: the `chart_spec` section. This is the request for a picture:
  use the `Line Chart` template, put `month` on x, and put `signups` on y.

That is the core workflow. The DataSpec says what the data *is*. The ChartSpec
says how you want to *look at it*. Paste the JSON into the [online editor](/editor)
to edit it live.

## Compile it

In JavaScript or TypeScript, pass the same input to an assembler:

```ts
import { assembleVegaLite } from 'flint-chart';

const input = {
  data: {
    values: [
      { month: '2024-01', signups: 120 },
      { month: '2024-02', signups: 146 },
      { month: '2024-03', signups: 168 },
      { month: '2024-04', signups: 164 },
      { month: '2024-05', signups: 181 },
    ],
  },
  semantic_types: {
    month: 'YearMonth',
    signups: 'Quantity',
  },
  chart_spec: {
    chartType: 'Line Chart',
    encodings: {
      x: { field: 'month' },
      y: { field: 'signups' },
    },
    baseSize: { width: 420, height: 280 },
  },
};

const spec = assembleVegaLite(input);
```

Flint returns a plain Vega-Lite spec. Render it with Vega-Embed:

```ts
import embed from 'vega-embed';

await embed('#chart', spec);
```

The same Flint input can also target other backends in JavaScript:

```ts
import { assembleChartjs, assembleECharts } from 'flint-chart';

const chartjsConfig = assembleChartjs(input);
const echartsOption = assembleECharts(input);
```

In Python, the shape is the same:

```python
from flint.vegalite import assemble_vegalite

spec = assemble_vegalite(input)
```

## What to read next

- [Example: a data story](/tutorials/data-story) shows why the split matters:
  one DataSpec becomes five different charts by changing only the ChartSpec.
- [Agent workflows](/tutorials/agent-workflows) shows how an AI agent can help
  infer the DataSpec and author chart requests.
- [Semantic Type](/documentation/semantic-types) explains the semantic labels
  Flint understands, such as `YearMonth`, `Quantity`, `Category`, and `Profit`.
- [Gallery](/wall) lists the chart templates available across Vega-Lite,
  ECharts, and Chart.js.
- [Overview](/documentation/overview) gives the deeper architecture when you
  are ready for the full model.
