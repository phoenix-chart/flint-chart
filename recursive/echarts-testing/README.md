# ECharts Backend Testing

Systematic rendering quality tests for the Flint ECharts backend.

## Overview

This suite renders charts using `assembleECharts` + server-side ECharts (canvas-based) and grades them for layout, text, data accuracy, and visual quality.

## Structure

```
recursive/echarts-testing/
├── generate_tests.py         # Generates test cases (44 base + 12 edge cases)
├── batch_render.mts          # Renders all test cases to PNG
├── grade_charts.py           # LLM-based grading (requires OPENAI_API_KEY)
├── grading_results.json      # Latest grading results
├── test_cases/               # Input test case JSON files
│   ├── manifest.json         # Test case registry
│   └── *.json                # Individual test cases
└── rendered/                 # Output PNG images + spec JSON
    ├── *.png                 # Rendered chart images
    └── *_spec.json           # ECharts option used for rendering
```

## Running

```bash
# Generate test cases
python3 recursive/echarts-testing/generate_tests.py

# Render all charts
npx tsx recursive/echarts-testing/batch_render.mts

# Grade with LLM (optional, requires API key)
OPENAI_API_KEY=sk-... python3 recursive/echarts-testing/grade_charts.py
```

## Results Summary (56 test cases)

| Metric | Value |
|--------|-------|
| Total charts | 56 |
| Assembly + render success | 56/56 (100%) |
| Passing (score ≥ 5) | 54/56 (96%) |
| Minor issues | 2 |
| Critical failures | 0 |

### Chart Types Covered (23)

Bar, Grouped Bar, Stacked Bar, Line, Area, Scatter, Heatmap, Pie, Histogram, Boxplot, Density, Lollipop, Radar, Rose, Waterfall, Funnel, Gauge, Treemap, Sunburst, Sankey, Streamgraph, Candlestick, Faceted (bar/scatter/line)

### Edge Cases Tested

- Single data point
- Very wide canvas
- Extreme outliers
- Uneven distributions (dominant slice)
- Sparse/missing data
- Negative values
- Many axes (8-axis radar)
- Single group boxplot
- All-zero values
- Many legend items (10 groups)
- Many stages (10-stage funnel)
- Volatile candlestick data

## Bugs Found & Fixed

### Fixed in this round:

1. **Waterfall: hidden axis labels** — First/last category labels were intentionally hidden by formatter. Fixed to show all labels.
   - File: `packages/flint-js/src/echarts/templates/waterfall.ts`

2. **Sankey: right labels truncated** — Margin too small (30px) for right-side node labels. Increased to 60px.
   - File: `packages/flint-js/src/echarts/templates/sankey.ts`

3. **Long rotated labels overlap axis title** — When x-axis labels are rotated ≥45°, nameGap and grid.bottom now dynamically increase to prevent overlap.
   - File: `packages/flint-js/src/echarts/instantiate-spec.ts`

### Known minor issues (not fixed, low priority):

1. **Treemap: small gray square** — Extra empty node visible at bottom of treemap. Cosmetic issue from ECharts' default leaf behavior.

2. **Grouped bar with 10 groups** — Bars become very thin. Expected behavior for high group count.

### Test data issues found (not rendering bugs):

- Original test cases used wrong channel names (r0-r4 for radar, angle for gauge/rose, x/y for funnel, x/y for pie). Fixed to match template expectations.
- Chart type name "Box Plot" should be "Boxplot" (single word in template registry).

## Encoding Channel Reference

| Chart Type | Required Channels |
|-----------|-------------------|
| Bar | x (category), y (value) |
| Grouped Bar | x (category), y (value), color (group) |
| Stacked Bar | x (category), y (value), color (group) |
| Line | x (temporal/ordinal), y (value) |
| Area | x (temporal/ordinal), y (value) |
| Scatter | x (value), y (value), [color], [size] |
| Heatmap | x (category), y (category), color (value) |
| Pie | color (category), size (value) |
| Histogram | x (value) |
| Boxplot | x (category), y (value) |
| Radar | x (metric names), y (values), color (series) |
| Rose | x (category), y (value) |
| Waterfall | x (category), y (value) |
| Funnel | y (stage names), size (values) |
| Gauge | size (value) |
| Treemap | x (parent), y (child), size (value) |
| Sunburst | x (parent), y (child), size (value) |
| Sankey | x (source→target links), y (value) |
| Candlestick | x (date), open, close, high, low |
