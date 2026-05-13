# examples/editor

Vega-Lite-style live playground for `flint-chart`. Edit a `ChartAssemblyInput`
JSON on the left, see the chart on the right — switch backends with the
tabs. Useful for:

- exploring what `semantic_types` do
- comparing how the same input renders across backends
- copying the compiled spec out (toggle "show compiled spec")

## Run locally

```bash
npm install
npm --prefix examples/editor install
npm run editor
```

Opens on http://localhost:5174.

## Deploy

Same as the gallery — `npm run editor:build`,
served under `/flint-chart/editor/` by default.