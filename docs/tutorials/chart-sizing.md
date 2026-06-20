# Chart sizing demo

Flint sizes every chart from two numbers — a **target** it aims for and a
**ceiling** it may never exceed. Getting this distinction right is the key to
predictable layouts, so it is worth a minute up front.

## `baseSize` vs. `canvasSize`

| Field | Role | Default |
|-------|------|---------|
| `baseSize` | **Target** — the size the chart aims for with typical data. The layout engine measures data density ("pressure") against this. | `400 × 320` |
| `canvasSize` | **Hard ceiling** — the maximum the chart may ever reach, in any dimension (faceted grids included). | none → `baseSize × maxStretch` (default `2×`) |

When data is dense — many categories, points, slices, or facets — Flint
*stretches* the chart past its base so marks stay readable, but never past the
ceiling:

```
                 stretches when data is dense
   baseSize  ───────────────────────────────▶  canvasSize
  (target, the size      grows only as needed     (hard ceiling,
   for typical data)                               never exceeded)
```

The stretch is bounded per dimension:

$$\beta_x = \frac{\text{canvasSize.width}}{\text{baseSize.width}}, \qquad \beta_y = \frac{\text{canvasSize.height}}{\text{baseSize.height}} \quad (\text{each } \geq 1).$$

What the common combinations do:

- **Neither set** → `400×320` target; may grow up to `800×640` (2×) when dense.
- **Only `baseSize`** → your target; may grow up to 2× when dense.
- **Only `canvasSize`** → a **fixed box**: the chart fills it and shrinks to fit
  when dense, but never overflows. *What you ask for is what you get.*
- **Both** → aim for `baseSize`, grow toward `canvasSize`, never beyond. A
  `canvasSize` smaller than `baseSize` shrinks the chart to fit the box.

Rule of thumb: set **`canvasSize`** for a fixed slot ("never bigger than this
box"); set **`baseSize`** for a comfortable size that may grow for dense data.

This page gives the practical version. The full equations and implementation map live in [Auto Layout Algorithm](/documentation/layout-model).

## When charts grow

Most charts fit their `baseSize`. Growth appears when the base is too small for the data geometry:

- **Banded axes** need enough step size for categories, bins, or grouped bars.
- **Continuous axes** need enough screen distance for dense points or temporal ticks.
- **Radial and area charts** need enough circumference or area for slices and tiles.

The compiler first uses the requested `baseSize`, then applies a bounded stretch if the chart would become unreadable. The stretch stops at the ceiling: either an explicit `canvasSize`, or `baseSize × options.maxStretch` (default 2×) when `canvasSize` is omitted. `options.elasticity` controls how quickly pressure turns into extra space. The ceiling bounds the whole chart — including faceted small-multiple grids.

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

Use defaults while exploring. Set `baseSize` to change the target, and add a
`canvasSize` ceiling only when the surrounding UI has a hard size constraint:

```json
{
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "category" },
      "y": { "field": "value" }
    },
    "baseSize": { "width": 480, "height": 320 },
    "canvasSize": { "width": 720, "height": 480 }
  },
  "options": {
    "elasticity": 0.45,
    "minStep": 8
  }
}
```

Here the chart targets 480×320 and may stretch up to 720×480 (βx = 1.5, βy = 1.5).
Drop `canvasSize` to let the chart grow to `baseSize × maxStretch`, or lower
`options.maxStretch` to tighten the default ceiling for fixed dashboard cells.

For a **fixed slot**, the simplest form is `canvasSize` on its own — Flint then
treats it as a box the chart fills and shrinks to fit, never overflowing:

```json
{
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": {
      "x": { "field": "category" },
      "y": { "field": "value" }
    },
    "canvasSize": { "width": 320, "height": 240 }
  }
}
```

For facets and the model details behind these controls, continue to [Auto Layout Algorithm](/documentation/layout-model).