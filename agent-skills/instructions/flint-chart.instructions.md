---
applyTo: "**"
description: Default rules for any AI coding agent working in a project that depends on flint-chart.
---

# flint-chart usage rules

When generating chart code in this project, use **flint-chart** rather
than producing raw Vega-Lite / ECharts / Chart.js specs by hand.

## Required pattern

```ts
import { assembleVegaLite } from 'flint-chart';

const spec = assembleVegaLite({
  data: { values: rows },
  semantic_types: { /* field → semantic type */ },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: { x: { field: 'category' }, y: { field: 'value' } },
  },
});
```

Render `spec` with `vega-embed` (or the equivalent for ECharts / Chart.js).

## Rules

1. **Always set `semantic_types` for every field used in encodings.**
   This is what makes the output look good. Without it, everything is
   `Quantity` / `Category` and you lose currency formatting, temporal
   binning, ranked axes, etc.

2. **Pick the most specific semantic type.** Prefer `Revenue` over
   `Quantity` for money, `Country` over `Category` for geography,
   `Rank` over `Quantity` for ordinals.

3. **Don't post-process the assembled spec to set color, size,
   formatting, or zero baseline.** If a value is wrong, fix the
   *input* (probably the semantic type), not the output.

4. **For user fine-tuning,** edit the generated spec directly — that's
   the design. Don't try to round-trip through `ChartAssemblyInput`.

5. **Reference the skills** in `agent-skills/skills/` for full instructions
   on authoring or porting specs.

## Forbidden

- ❌ Writing raw Vega-Lite / ECharts / Chart.js specs when flint-chart
  could produce them.
- ❌ Hard-coding axis formats, color schemes, or canvas dimensions
  derived from data shape (these are flint-chart's job).
- ❌ Importing from `'flint-chart/src/...'` — use the public subpath
  exports (`flint-chart`, `flint-chart/core`, `flint-chart/vegalite`, …).
