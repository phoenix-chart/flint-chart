# ECharts chart reference

> This page is generated from the live chart-template registry (`scripts/gen-chart-reference.ts`). Do not edit it by hand — run `npm run gen:reference`.

The ECharts backend targets interactive, canvas-rendered charts and adds several types Vega-Lite does not cover (sunburst, treemap, sankey, gauge, graph, tree, parallel coordinates, calendar heatmap).

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

**37 chart types** across 10 categories.

## Scatter & Point

### ![](chart-icon-scatter.svg) Scatter Plot

**Encoding channels:** `x`, `y`, `color`, `size`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `opacity` | number | 0.1 – 1 (step 0.05) | `1` | always | Mark fill/stroke opacity. |

### ![](chart-icon-linear-regression.svg) Regression

**Encoding channels:** `x`, `y`, `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `regressionMethod` | choice | `Linear`, `Logarithmic`, `Exponential`, `Power`, `Quadratic`, `Polynomial` | `Linear` | always | Regression fit method. |
| `polyOrder` | number | 2 – 10 (step 1) | `3` | always | Polynomial order for the regression fit. |

### ![](chart-icon-connected-scatter.svg) Connected Scatter Plot

**Encoding channels:** `x`, `y`, `order`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-dot-plot-horizontal.svg) Ranged Dot Plot

**Encoding channels:** `x`, `y`, `color`

_No template-specific parameters._

### ![](chart-icon-box-plot.svg) Boxplot

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-strip-plot.svg) Strip Plot

**Encoding channels:** `x`, `y`, `color`, `size`, `column`, `row`

_No template-specific parameters._

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

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `stackMode` | choice | `Stacked (default)`, `Normalize (100%)`, `Layered (overlap)` | — | always | How overlapping series are stacked (none / stacked / normalized). |

### ![](chart-icon-lollipop.svg) Lollipop Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `dotSize` | number | 20 – 300 (step 10) | `80` | always | Size of the dot mark. |

### ![](chart-icon-pyramid.svg) Pyramid Chart

**Encoding channels:** `x`, `y`, `color`

_No template-specific parameters._

### ![](chart-icon-heat-map.svg) Heatmap

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-calendar.svg) Calendar Heatmap

**Encoding channels:** `x`, `color`

_No template-specific parameters._

## Line & Area

### ![](chart-icon-line.svg) Line Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After` | — | always | Line/area interpolation (curve) method. |
| `showPoints` | toggle | on / off | `false` | always | Overlay point markers on the line. |

### ![](chart-icon-bump.svg) Bump Chart

**Encoding channels:** `x`, `y`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-slope.svg) Slope Chart

**Encoding channels:** `x`, `y`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-area.svg) Area Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After` | — | always | Line/area interpolation (curve) method. |
| `opacity` | number | 0.1 – 1 (step 0.05) | `0.7` | always | Mark fill/stroke opacity. |
| `stackMode` | choice | `Stacked (default)`, `Normalize (100%)`, `Center`, `Layered (overlap)` | — | always | How overlapping series are stacked (none / stacked / normalized). |

### ![](chart-icon-streamgraph.svg) Streamgraph

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-range-area.svg) Range Area Chart

**Encoding channels:** `x`, `y`, `y2`, `color`, `column`, `row`

_No template-specific parameters._

## Part-to-Whole

### ![](chart-icon-pie.svg) Pie Chart

**Encoding channels:** `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 0 – 60 (step 5) | `0` | always | Inner-radius (donut hole) as a percentage of the outer radius. |
| `cornerRadius` | number | 0 – 10 (step 1) | `0` | always | Rounded-corner radius for bar marks. |

### ![](chart-icon-funnel.svg) Funnel Chart

**Encoding channels:** `y`, `size`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `sort` | choice | `Descending (default)`, `Ascending`, `Original order` | — | always | Sort |
| `orient` | choice | `Vertical (default)`, `Horizontal` | — | always | Orient |
| `gap` | number | 0 – 20 (step 1) | `2` | always | Gap |

### ![](chart-icon-treemap.svg) Treemap

**Encoding channels:** `color`, `size`, `detail`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `breadcrumb` | choice | `Show (default)`, `Hide` | — | always | Breadcrumb |

### ![](chart-icon-sunburst.svg) Sunburst Chart

**Encoding channels:** `color`, `size`, `detail`, `group`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 0 – 80 (step 5) | `0` | always | Inner-radius (donut hole) as a percentage of the outer radius. |
| `labelRotate` | choice | `Radial (default)`, `Tangential`, `Horizontal` | — | always | Labels |

### ![](chart-icon-tree.svg) Tree

**Encoding channels:** `color`, `detail`, `size`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `orient` | choice | `Left → Right (default)`, `Top → Bottom` | — | always | Orient |

## Statistical

### ![](chart-icon-histogram.svg) Histogram

**Encoding channels:** `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `binCount` | number | 5 – 50 (step 1) | `10` | always | Number of histogram bins. |

### ![](chart-icon-density.svg) Density Plot

**Encoding channels:** `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `bandwidth` | number | 0.05 – 2 (step 0.05) | `0` | always | Kernel-density bandwidth (0 = auto). |

### ![](chart-icon-ecdf.svg) ECDF Plot

**Encoding channels:** `x`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `showPoints` | toggle | on / off | `false` | always | Overlay point markers on the line. |

### ![](chart-icon-parallel.svg) Parallel Coordinates

**Encoding channels:** `color`, `detail`

_No template-specific parameters._

## Financial

### ![](chart-icon-candlestick.svg) Candlestick Chart

**Encoding channels:** `x`, `open`, `high`, `low`, `close`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `showMA` | toggle | on / off | `false` | always | Show Moving Avg |
| `maWindow` | number | 3 – 30 (step 1) | `5` | always | MA Window |

## Other

### ![](chart-icon-waterfall.svg) Waterfall Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-gantt.svg) Gantt Chart

**Encoding channels:** `y`, `x`, `x2`, `color`, `detail`, `column`, `row`

_No template-specific parameters._

### ![](chart-icon-bullet.svg) Bullet Chart

**Encoding channels:** `y`, `x`, `goal`, `color`, `column`, `row`

_No template-specific parameters._

## Polar

### ![](chart-icon-radar.svg) Radar Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `shape` | choice | `Polygon (default)`, `Circle` | — | always | Grid |
| `filled` | choice | `Filled (default)`, `Outline only` | — | always | Fill the enclosed area. |
| `fillOpacity` | number | 0.05 – 0.8 (step 0.05) | `0.3` | always | Fill opacity for the area/region. |

### ![](chart-icon-rose.svg) Rose Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `alignment` | choice | `Left (default)`, `Center` | — | always | Segment alignment for radial charts. |

## Indicator

### ![](chart-icon-gauge.svg) Gauge Chart

**Encoding channels:** `size`, `column`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `min` | number | 0 – 1000 (step 10) | `0` | always | Min |
| `max` | number | 0 – 10000 (step 100) | `100` | always | Max |
| `showProgress` | choice | `Show (default)`, `Hide` | — | always | Progress |

## Flow

### ![](chart-icon-sankey.svg) Sankey Diagram

**Encoding channels:** `x`, `y`, `size`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `orient` | choice | `Horizontal (default)`, `Vertical` | — | always | Orient |
| `nodeWidth` | number | 5 – 40 (step 5) | `20` | always | Node Width |
| `nodeGap` | number | 2 – 30 (step 2) | `10` | always | Node Gap |

### ![](chart-icon-network.svg) Network Graph

**Encoding channels:** `x`, `y`, `size`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `layout` | choice | `Circular (default)`, `Force-directed` | — | always | Layout |
