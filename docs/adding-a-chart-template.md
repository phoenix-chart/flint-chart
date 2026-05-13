# Adding a chart template

This guide walks through adding a new chart template to an existing backend.

## 1. Pick a name and channels

The `chartType` string is the public identity — it must be stable across
backends. Channels are the visual encoding slots your template accepts.

```ts
const TEMPLATE_NAME = 'Dot Density';
const CHANNELS = ['x', 'y', 'color', 'size'] as const;
```

## 2. Author the template

Each backend folder has a `templates/` directory. Pick a similar
existing template as a starting point — for a scatter-shaped chart in
Vega-Lite, copy `src/vegalite/templates/scatter.ts`.

A template exports a `ChartTemplateDef`:

```ts
export const dotDensityTemplate: ChartTemplateDef = {
  chartType: 'Dot Density',
  category: 'Scatter & Point',
  channels: [...CHANNELS],
  build: (ctx) => {
    // ctx contains: encodings (post-semantic-resolution), layout, data, options
    // return the backend-native spec fragment
  },
};
```

## 3. Register

Add an `export` to `src/<backend>/templates/index.ts` so it appears in
that backend's template registry.

## 4. Add test cases

Add a generator to `src/test-data/` (or to an existing test file for
the chart family) that produces 3–6 `TestCase` instances exercising
common dimensions: small/large cardinality, with/without color, with/without
facets. Wire it up in `src/test-data/index.ts` `TEST_GENERATORS`.

## 5. Verify

```bash
npm run typecheck
npm run test
npm run dev --workspace=@flint-chart/gallery  # eyeball the new template
```

## Cross-backend parity

If you've implemented a template in one backend and it's worth porting,
file an issue tagged `parity` so the same `chartType` name lands in the
others. The user-facing contract is that any `chartType` string works
identically across `assembleVegaLite`, `assembleECharts`, etc.
