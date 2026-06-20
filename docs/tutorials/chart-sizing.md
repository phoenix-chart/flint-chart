# Chart sizing demo

Flint treats `canvasSize` as a target layout budget, not a promise to clip every chart into a fixed rectangle. When labels, dense points, categories, or facets need more room, the compiler can stretch the effective width or height before it makes harder tradeoffs.

This page gives the practical version. The full equations and implementation map live in [Auto Layout Algorithm](/documentation/layout-model).

## When charts grow

Most charts fit the requested canvas. Growth appears when the requested space is too small for the data geometry:

- **Banded axes** need enough step size for categories, bins, or grouped bars.
- **Continuous axes** need enough screen distance for dense points or temporal ticks.
- **Radial and area charts** need enough circumference or area for slices and tiles.

The compiler first uses the requested `canvasSize`, then applies a bounded stretch if the chart would become unreadable. `options.maxStretch` caps that growth; `options.elasticity` controls how quickly pressure turns into extra space.

---

## Banded axes

Bars, histograms, heatmaps, and boxplots allocate a slot for each item. Add categories below and watch the chart widen until the stretch cap is exhausted.

```flint-playground
discrete
```

## Continuous axes

Scatter, line, and area charts do not allocate one band per row, but dense points still create pressure. Add points below and watch the axis stretch more gradually.

```flint-playground
continuous
```

## Radial charts

Pie, rose, radar, and similar closed-loop charts need enough circumference for each slice or spoke. Add slices below and watch the chart grow its radius when the requested canvas gets too tight.

```flint-playground
circumference
```

## Area layouts

Treemaps and other filled 2D layouts need enough total area for rectangles to stay legible. Add leaves below and watch the canvas expand by area rather than by a single axis.

```flint-playground
area
```

## Controlling the budget

Use defaults while exploring. Tighten the budget only when the surrounding UI has a hard size constraint:

```json
{
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "category" },
      "y": { "field": "value" }
    },
    "canvasSize": { "width": 480, "height": 320 }
  },
  "options": {
    "maxStretch": 1.5,
    "elasticity": 0.45,
    "minStep": 8
  }
}
```

Set a lower `maxStretch` for fixed dashboard cells; raise it for exploratory views where scrolling is acceptable. For facets and the model details behind these controls, continue to [Auto Layout Algorithm](/documentation/layout-model).