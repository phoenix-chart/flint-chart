# Vega-Lite chart reference

> This page is generated from the live chart-template registry (`scripts/gen-chart-reference.ts`). Do not edit it by hand — run `npm run gen:reference`.

The Vega-Lite backend is the reference implementation and ships the widest set of chart types. In addition to each template's own parameters, position-based charts automatically gain the cross-cutting axis controls (`logScale_*`, `includeZero_*`, `xAxisType`/`yAxisType`) and faceted charts gain `independentYAxis`.

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

**33 chart types** across 6 categories.

## Points

### ![](chart-icon-scatter.svg) Scatter Plot

**Encoding channels:** `x`, `y`, `color`, `size`, `shape`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `opacity` | number | 0.1 – 1 (step 0.05) | `1` | always | Mark fill/stroke opacity. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-linear-regression.svg) Regression

**Encoding channels:** `x`, `y`, `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `regressionMethod` | choice | `Linear`, `Logarithmic`, `Exponential`, `Power`, `Quadratic`, `Polynomial` | `Linear` | always | Regression fit method. |
| `polyOrder` | number | 2 – 10 (step 1) | `3` | always | Polynomial order for the regression fit. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-connected-scatter.svg) Connected Scatter Plot

**Encoding channels:** `x`, `y`, `order`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-dot-plot-horizontal.svg) Ranged Dot Plot

**Encoding channels:** `x`, `y`, `color`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-strip-plot.svg) Strip Plot

**Encoding channels:** `x`, `y`, `color`, `size`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `stepWidth` | number | 10 – 100 (step 5) | `20` | always | Jitter spread width. |
| `pointSize` | number | 0 – 150 (step 5) | `0` | always | Point/marker size. |
| `opacity` | number | 0 – 1 (step 0.05) | `0` | always | Mark fill/stroke opacity. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

## Bars

### ![](chart-icon-column.svg) Bar Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `cornerRadius` | number | 0 – 15 (step 1) | `0` | always | Rounded-corner radius for bar marks. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `xAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the x-axis as a continuous time scale or discrete bands. |
| `yAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the y-axis as a continuous time scale or discrete bands. |

### ![](chart-icon-column-grouped.svg) Grouped Bar Chart

**Encoding channels:** `x`, `y`, `group`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-column-stacked.svg) Stacked Bar Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `stackMode` | choice | `Stacked (default)`, `Normalize (100%)`, `Center`, `Layered (overlap)` | — | conditional | How overlapping series are stacked (none / stacked / normalized). |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-lollipop.svg) Lollipop Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `dotSize` | number | 20 – 300 (step 10) | `80` | always | Size of the dot mark. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `xAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the x-axis as a continuous time scale or discrete bands. |
| `yAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the y-axis as a continuous time scale or discrete bands. |

### ![](chart-icon-waterfall.svg) Waterfall Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `cornerRadius` | number | 0 – 8 (step 1) | `0` | always | Rounded-corner radius for bar marks. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-gantt.svg) Gantt Chart

**Encoding channels:** `y`, `x`, `x2`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-bullet.svg) Bullet Chart

**Encoding channels:** `y`, `x`, `goal`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

## Distributions

### ![](chart-icon-histogram.svg) Histogram

**Encoding channels:** `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `binCount` | number | 5 – 50 (step 1) | `10` | always | Number of histogram bins. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-density.svg) Density Plot

**Encoding channels:** `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `bandwidth` | number | 0.05 – 2 (step 0.05) | `0` | always | Kernel-density bandwidth (0 = auto). |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-ecdf.svg) ECDF Plot

**Encoding channels:** `x`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `showPoints` | toggle | on / off | `false` | always | Overlay point markers on the line. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-violin.svg) Violin Plot

**Encoding channels:** `x`, `y`, `color`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `bandwidth` | number | 0.05 – 2 (step 0.05) | `0` | always | Kernel-density bandwidth (0 = auto). |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-box-plot.svg) Boxplot

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-pyramid.svg) Pyramid Chart

**Encoding channels:** `x`, `y`, `color`

_No template-specific parameters._

### ![](chart-icon-candlestick.svg) Candlestick Chart

**Encoding channels:** `x`, `open`, `high`, `low`, `close`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

## Lines & Areas

### ![](chart-icon-line.svg) Line Chart

**Encoding channels:** `x`, `y`, `color`, `strokeDash`, `detail`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After`, `Basis (smooth)`, `Cardinal`, `Catmull-Rom` | — | always | Line/area interpolation (curve) method. |
| `showPoints` | toggle | on / off | `false` | always | Overlay point markers on the line. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |
| `xAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the x-axis as a continuous time scale or discrete bands. |
| `yAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the y-axis as a continuous time scale or discrete bands. |

### ![](chart-icon-bump.svg) Bump Chart

**Encoding channels:** `x`, `y`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-slope.svg) Slope Chart

**Encoding channels:** `x`, `y`, `color`, `detail`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-area.svg) Area Chart

**Encoding channels:** `x`, `y`, `color`, `opacity`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After`, `Basis (smooth)`, `Cardinal`, `Catmull-Rom` | — | always | Line/area interpolation (curve) method. |
| `opacity` | number | 0.1 – 1 (step 0.05) | `0.7` | always | Mark fill/stroke opacity. |
| `stackMode` | choice | `Stacked (default)`, `Normalize (100%)`, `Center`, `Layered (overlap)` | — | conditional | How overlapping series are stacked (none / stacked / normalized). |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `xAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the x-axis as a continuous time scale or discrete bands. |
| `yAxisType` | choice | `Temporal`, `Discrete` | — | conditional | Interpret the y-axis as a continuous time scale or discrete bands. |

### ![](chart-icon-streamgraph.svg) Streamgraph

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After`, `Basis (smooth)`, `Cardinal`, `Catmull-Rom` | — | always | Line/area interpolation (curve) method. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-range-area.svg) Range Area Chart

**Encoding channels:** `x`, `y`, `y2`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `interpolate` | choice | `Default (linear)`, `Linear`, `Monotone (smooth)`, `Step`, `Step Before`, `Step After`, `Basis (smooth)` | — | always | Line/area interpolation (curve) method. |
| `opacity` | number | 0.1 – 1 (step 0.05) | `0.5` | always | Mark fill/stroke opacity. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

## Circular

### ![](chart-icon-pie.svg) Pie Chart

**Encoding channels:** `size`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 0 – 100 (step 5) | `0` | always | Inner-radius (donut hole) as a percentage of the outer radius. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-rose.svg) Rose Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `innerRadius` | number | 0 – 100 (step 5) | `0` | always | Inner-radius (donut hole) as a percentage of the outer radius. |
| `padAngle` | number | 0 – 0.1 (step 0.005) | `0` | always | Angular gap between radial segments. |
| `alignment` | choice | `Left (default)`, `Center` | — | always | Segment alignment for radial charts. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-radar.svg) Radar Chart

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `filled` | toggle | on / off | `true` | always | Fill the enclosed area. |
| `fillOpacity` | number | 0 – 0.5 (step 0.05) | `0.15` | always | Fill opacity for the area/region. |
| `strokeWidth` | number | 0.5 – 4 (step 0.5) | `1.5` | always | Line stroke width. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

## Tables & Maps

### ![](chart-icon-heat-map.svg) Heatmap

**Encoding channels:** `x`, `y`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `showTextLabels` | toggle | on / off | `false` | always | Render value labels on the marks. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-bar-table.svg) Bar Table

**Encoding channels:** `y`, `x`, `color`, `column`, `row`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `maxRows` | number | 5 – 100 (step 1) | `20` | always | Maximum number of table rows to display. |
| `showPercent` | toggle | on / off | `false` | conditional | Show each value as a percentage of the total. |
| `independentYAxis` | toggle | on / off | `false` | conditional | Give each facet its own independent y-scale. |

### ![](chart-icon-kpi-card.svg) KPI Card

**Encoding channels:** `metric`, `value`, `goal`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `layout` | choice | `Horizontal`, `Vertical`, `Grid` | `Grid` | always | Layout |
| `style` | toggle | on / off | `true` | always | Card style |
| `behindThreshold` | number | 0 – 1 (step 0.05) | `0.5` | conditional | Behind threshold |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-world-map.svg) Map

**Encoding channels:** `longitude`, `latitude`, `color`, `size`, `opacity`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `region` | choice | `Auto-detect`, `United States`, `World` | `Auto-detect` | always | Region |
| `projection` | choice | `Default`, `Mercator`, `Equal Earth`, `Orthographic (Globe)`, `Stereographic`, `Conic Equal Area`, `Conic Equidistant`, `Azimuthal Equidistant`, `Mollweide` | `Default` | conditional | Projection |
| `projectionCenter` | choice | `Default`, `World (Atlantic) [0, 0]`, `World (Pacific) [150, 0]`, `China [105, 35]`, `USA [-98, 39]`, `Europe [10, 50]`, `Japan [138, 36]`, `India [78, 22]`, `Brazil [-52, -14]`, `Australia [134, -25]`, `Russia [100, 60]`, `Africa [20, 0]`, `Middle East [45, 28]`, `Southeast Asia [115, 5]`, `South America [-60, -15]`, `North America [-100, 45]`, `UK [-2, 54]`, `Germany [10, 51]`, `France [2, 47]`, `Korea [128, 36]` | — | conditional | Center |
| `logScale_x` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the x-axis. |
| `logScale_y` | toggle | on / off | `false` | conditional | Use a log/symlog scale on the y-axis. |
| `includeZero_x` | toggle | on / off | `false` | conditional | Anchor the x-axis at zero. |
| `includeZero_y` | toggle | on / off | `false` | conditional | Anchor the y-axis at zero. |

### ![](chart-icon-us-map.svg) Choropleth

**Encoding channels:** `id`, `color`, `detail`

| Parameter | Control | Domain | Default | Availability | Description |
|---|---|---|---|---|---|
| `region` | choice | `Auto-detect`, `United States`, `World` | `Auto-detect` | always | Region |
