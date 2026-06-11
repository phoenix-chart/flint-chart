---
name: flint-chart-port
description: Port an existing hand-written Vega-Lite / ECharts / Chart.js spec to a flint-chart ChartAssemblyInput. USE WHEN the user has a working spec but wants editability — re-encoding fields, swapping chart type, or sharing a single spec across backends. Output is the minimal input that recreates the chart while letting flint-chart re-derive low-level params.
---

# flint-chart: port an existing spec

## Goal

Convert a hand-written chart spec into the **smallest** `ChartAssemblyInput`
that reproduces the same intent. The flint-chart compiler will re-derive
sizing, formatting, and color from semantic types — so most of the
spec's low-level knobs are not needed in the input.

## Procedure

1. **Identify chart type.** Map the mark / series-type to a flint-chart
   `chartType` string (see [flint-chart-author](../flint-chart-author/SKILL.md)
   for the registry).

2. **Extract data.** Inline rows go into `data.values`; URL goes into
   `data.url`. Strip any data transforms; if a `calculate` /
   `aggregate` is essential, prefer pre-computing it (flint-chart
   supports `aggregate` on channels but not arbitrary transforms).

3. **Extract field → channel mapping.** For each visual channel
   (`x`, `y`, `color`, …), pick the bound field name. Drop scale /
   axis / legend config.

4. **Infer semantic type from formatting hints.** This is the key
   translation step:

   | Hint in source spec | Likely semantic type |
   |---|---|
   | `format: "$,.0f"` or `"$.2f"` | `Price` / `Revenue` |
   | `format: ".0%"` | `Percentage` |
   | temporal type + `timeUnit: year` | `Year` |
   | `scale: { reverse: true }` on rank-like field | `Rank` |
   | diverging color scheme | `Temperature` / `Profit` / `Anomaly` |
   | named geo levels (US states, countries) | `State` / `Country` |
   | otherwise quantitative | `Quantity` |
   | otherwise nominal | `Category` |

5. **Drop everything else.** Axis titles, font sizes, tick counts,
   color ranges, padding — flint-chart will recompute these. If the
   user *must* keep one, leave a note in the response (don't bake it
   into the input).

## Example

Input Vega-Lite spec:

```json
{
  "data": { "values": [{ "month": "2024-01", "rev": 1200 }] },
  "mark": "bar",
  "encoding": {
    "x": { "field": "month", "type": "temporal", "timeUnit": "yearmonth" },
    "y": { "field": "rev", "type": "quantitative", "axis": { "format": "$,.0f" } }
  },
  "width": 400,
  "height": 200
}
```

Ported flint-chart input:

```json
{
  "data": { "values": [{ "month": "2024-01", "rev": 1200 }] },
  "semantic_types": { "month": "Month", "rev": "Revenue" },
  "chart_spec": {
    "chartType": "Bar Chart",
    "encodings": { "x": { "field": "month" }, "y": { "field": "rev" } },
    "canvasSize": { "width": 400, "height": 200 }
  }
}
```

Both the temporal binning and the currency formatting are recovered from
`Month` + `Revenue`.

## When NOT to port

- One-off charts that won't be re-encoded → keep the original spec.
- Specs with custom transforms (regression, kernel density, etc.) that
  flint-chart doesn't model — port the shell, but keep the transform
  layer in the user's hand-edited output spec.
