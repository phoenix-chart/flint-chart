# Adding a chart template

This guide covers adding a new chart type to an **existing** backend. For a new rendering target, start with [Adding a backend](/documentation/adding-a-backend).

---

## Table of Contents

- [§1 Name and channels](#1-name-and-channels)
- [§2 Author the template](#2-author-the-template)
- [§3 Register](#3-register)
- [§4 Test data and gallery](#4-test-data-and-gallery)
- [§5 Cross-backend parity](#5-cross-backend-parity)
- [§6 Related](#6-related)

---

# §1 Name and channels

The public identity is the **`chart` string** on `ChartTemplateDef`. It must match `chart_spec.chartType` exactly (e.g. `"Scatter Plot"`).

Pick channels the mark actually uses. Copy a similar template as a starting point:

| Family | Vega-Lite reference |
|---|---|
| Scatter / point | `vegalite/templates/scatter.ts` |
| Bar / column | `vegalite/templates/bar.ts` |
| Line / area | `vegalite/templates/line.ts` |
| Radial | `vegalite/templates/pie.ts` |

ECharts and Chart.js mirror the same `ChartTemplateDef` interface under their own `templates/` folders.

---

# §2 Author the template

`ChartTemplateDef` lives in `packages/flint-js/src/core/types.ts`.

```typescript
import { ChartTemplateDef } from '../../core/types';
import { defaultBuildEncodings } from './utils';

export const dotPlotDef: ChartTemplateDef = {
    chart: 'Dot Plot',
    template: { mark: 'circle', encoding: {} },
    channels: ['x', 'y', 'color', 'size', 'column', 'row'],
    markCognitiveChannel: 'position',

    declareLayoutMode: (channelSemantics, table, chartProperties) => {
        // optional: banded axes, σ overrides, Q→O conversion
        return { /* LayoutDeclaration */ };
    },

    instantiate: (spec, ctx) => {
        defaultBuildEncodings(spec, ctx.resolvedEncodings);
        // ctx.channelSemantics, ctx.layout, ctx.table, ctx.chartProperties, …
    },

    properties: [
        { key: 'opacity', label: 'Opacity', type: 'continuous',
          min: 0.1, max: 1, step: 0.05, defaultValue: 1 },
    ],
};
```

### Key rules

1. **`template`** — minimal native skeleton; `instantiate` fills encodings and mark props.
2. **`markCognitiveChannel`** — tells the compiler how readers decode value (affects zero baseline and [Auto Layout Algorithm](/documentation/layout-model) compression).
3. **`instantiate`** — receives a **deep clone** of `template` plus `InstantiateContext` (resolved encodings, `ChannelSemantics`, `LayoutResult`, data table, canvas size).
4. **No semantic branching** — read `ctx.channelSemantics[channel].format`, `.type`, `.zero`, etc.; do not switch on raw field names or storage types.

Optional hooks: `postProcess` (after layout), `encodingActions` (shelf quick actions).

---

# §3 Register

In `packages/flint-js/src/<backend>/templates/index.ts`:

1. Import the new `*Def` constant.
2. Add it to the appropriate category array inside `*TemplateDefs` (e.g. `scatterTemplates`).
3. Ensure `*GetTemplateDef(chartType)` can find it: `defs.find(t => t.chart === chartType)`.

Vega-Lite also runs `withInjectedProperties()` to attach shared facet / log-scale properties across templates — follow existing entries in that file when your chart needs the same hooks.

---

# §4 Test data and gallery

### Generator pattern

`TestCase` interface: `packages/flint-js/src/test-data/types.ts`.

Typical flow (see `scatter-tests.ts`, `bar-tests.ts`):

1. Define a small parameter matrix (cardinality, color on/off, facet on/off).
2. Export `gen<Chart>Tests(): TestCase[]` with `chartType` matching `ChartTemplateDef.chart`.
3. Register in `packages/flint-js/src/test-data/index.ts`:

```typescript
TEST_GENERATORS['Dot Plot'] = genDotPlotTests;
```

4. Optionally add a page in `gallery-tree.ts` listing the generator key.

### Verify

```bash
npm run typecheck
npm run test
npm run site    # Gallery → find your chart type
```

Eyeball format, layout stretch, legend, and facet behavior across 3–6 representative cases.

---

# §5 Cross-backend parity

The user-facing contract is that the same `chartType` string should work across `assembleVegaLite`, `assembleECharts`, and `assembleChartJs` **when templates exist**. In practice:

- Port to backends you need immediately; file follow-ups for the rest.
- `site/src/shared/supported-backends.ts` filters chart types per backend registry — a VL-only template will not appear in ECharts until registered there too.

---

# §6 Related

- [Adding a backend](/documentation/adding-a-backend) — full assembler wiring
- [Semantic Type](/documentation/semantic-types) — what `channelSemantics` contains
- [Auto Layout Algorithm](/documentation/layout-model) — `declareLayoutMode` and stretch models
- [API reference](/documentation/api-reference) — `chart_spec.chartType` and encodings
