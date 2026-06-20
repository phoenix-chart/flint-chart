# Chart.js chart reference

> This page is generated from the live chart-template registry (`scripts/gen-chart-reference.ts`). Do not edit it by hand — run `npm run gen:reference`.

The Chart.js backend is the lightweight embedding target. It supports the common chart families with a focused set of parameters.

## How to set parameters

Every parameter below is set through `chart_spec.chartProperties`, keyed by the parameter name:

```jsonc
{
  "chartType": "Bar Chart",
  "encodings": { "x": { "field": "category" }, "y": { "field": "value" } },
  "chartProperties": { "cornerRadius": 4, "stackMode": "normalize" }
}
```

The **Availability** column marks whether a parameter is `always` offered or only `conditional` (surfaced when the data/encodings warrant it — e.g. a log scale only on a wide-range axis). Passing a non-applicable parameter is accepted but ignored.

**19 chart types** across 5 categories.

## Scatter & Point

### ![](chart-icon-scatter.svg) Scatter Plot

**Encoding channels:** `x`, `y`, `color`, `size`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `opacity` | number | 0.1 – 1 (step 0.05) | `1` | always | Mark fill/stroke opacity. |

### ![](chart-icon-connected-scatter.svg) Connected Scatter Plot

**Encoding channels:** `x`, `y`, `order`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-bubble.svg) Bubble Chart

**Encoding channels:** `x`, `y`, `size`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `opacity` | number | 0.1 – 1 (step 0.05) | `0.6` | always | Mark fill/stroke opacity. |

## Bar

### ![](chart-icon-column.svg) Bar Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `cornerRadius` | number | 0 – 15 (step 1) | `0` | always | Rounded-corner radius for bar marks. |

### ![](chart-icon-column-grouped.svg) Grouped Bar Chart

**Encoding channels:** `x`, `y`, `group`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-column-stacked.svg) Stacked Bar Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-combo.svg) Combo Chart

**Encoding channels:** `x`, `y`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `cornerRadius` | number | 0 – 15 (step 1) | `0` | always | Rounded-corner radius for bar marks. |

### ![](chart-icon-histogram.svg) Histogram

**Encoding channels:** `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `binCount` | number | 5 – 50 (step 1) | `10` | always | Number of histogram bins. |

### ![](chart-icon-waterfall.svg) Waterfall Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-gantt.svg) Gantt Chart

**Encoding channels:** `y`, `x`, `x2`, `color`, `column`, `row`

_No template-specific parameters._

## Line & Area

### ![](chart-icon-line.svg) Line Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After` | — | always | Line/area interpolation (curve) method. |

### ![](chart-icon-slope.svg) Slope Chart

**Encoding channels:** `x`, `y`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-area.svg) Area Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)` | — | always | Line/area interpolation (curve) method. |
| `opacity` | number | 0.1 – 1 (step 0.05) | `0.4` | always | Mark fill/stroke opacity. |
| `stackMode` | choice | `Stacked (default)`, `Layered (overlap)` | — | always | How overlapping series are stacked (none / stacked / normalized). |

### ![](chart-icon-range-area.svg) Range Area Chart

**Encoding channels:** `x`, `y`, `y2`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-ecdf.svg) ECDF Plot

**Encoding channels:** `x`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `showPoints` | toggle | on / off | `false` | always | Overlay point markers on the line. |

## Part-to-Whole

### ![](chart-icon-pie.svg) Pie Chart

**Encoding channels:** `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 0 – 60 (step 5) | `0` | always | Inner-radius (donut hole) as a percentage of the outer radius. |

### ![](chart-icon-doughnut.svg) Doughnut Chart

**Encoding channels:** `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 20 – 80 (step 5) | `55` | always | Inner-radius (donut hole) as a percentage of the outer radius. |

## Polar

### ![](chart-icon-radar.svg) Radar Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `filled` | choice | `Filled (default)`, `Outline only` | — | always | Fill the enclosed area. |
| `fillOpacity` | number | 0.05 – 0.8 (step 0.05) | `0.3` | always | Fill opacity for the area/region. |

### ![](chart-icon-rose.svg) Rose Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `alignment` | choice | `Left (default)`, `Center` | — | always | Segment alignment for radial charts. |
