<!--
  New Chart Types Log
  -------------------
  Running record of the chart-type discovery loop (see README.md for the method).

  HOW TO USE THIS FILE
  - At the END of every round, append a new "## Round N" entry using the Round
    Template below. Fill in every field; write "none" rather than leaving a
    blank.
  - Keep the "# Experiment Summary" section at the top up to date. It is the
    rolling, at-a-glance state of coverage and the place where durable lessons
    (per-backend feasibility limits) accumulate so future rounds start from what
    we already know.
  - One coherent batch of types per round, so a coverage delta can be attributed
    to it.
  - Newest round at the bottom; the summary at the top is always current.
-->

# Experiment Summary

_Rolling overview. Update after every round._

- **Status:** in progress <!-- not started | in progress | converged | paused -->
- **Rounds completed:** 1
- **Backends:** Vega-Lite (broadest) · ECharts · Chart.js (core, no plugins)
- **Sources swept so far:** FT Visual Vocabulary; data-to-viz.com; The Data
  Visualisation Catalogue; Vega-Lite / ECharts / Chart.js galleries.

## Coverage scoreboard

_Registered chart types per backend at the end of each round. Read live counts
from `site/src/shared/chart-categories.ts`._

| Round | Types added (1 line) | Vega-Lite | ECharts | Chart.js | n |
|-------|----------------------|-----------|---------|----------|---|
| 1     | Slope Chart, Connected Scatter Plot | 28 | 28 | 18 | 2 |
| 2     | Range Area Chart | 29 | 29 | 19 | 1 |
| 3     | Violin Plot (VL only) | 30 | 29 | 19 | 1 |

## Backlog and conditional candidates

_Types triaged but not implemented, with the blocker. Promote when the blocker
clears._

- **Range / Band Area** — _shipped in Round 2_ (VL native `area` y/y2; ECharts
  transparent stacked base + translucent delta; Chart.js paired lines with
  `fill:{target}`).
- **Violin Plot** (Conditional): Include for VL (own KDE → mirrored area);
  ECharts conditional (precomputed KDE polygons); Chart.js reject (plugin only).
- **Violin Plot** — _Vega-Lite shipped in Round 3_ (native `density` transform +
  mirrored `area`, `x:density stack:center`). **ECharts conditional / Chart.js
  reject** — see `uncertain-candidates.md` (ECharts needs `renderItem`; Chart.js
  needs a plugin).
- **Waffle, Marimekko/Mosaic, Ridgeline, Hexbin, Chord** (Backlog): heavier
  layout math or non-serializable layouts; Chart.js can't do most. See
  `work/candidates.md`.
- **Diverging/Tornado Bar, Step Line** (Reject as new types): better expressed
  as a Bar property (diverging baseline + sort) and a Line `interpolate:'step'`.
- **Cross-backend porting backlog:** Funnel→VL/Chart.js, Bump/Bullet/Lollipop→
  Chart.js, Calendar/Parallel→VL.

## Durable lessons

_Per-backend feasibility limits and mapping tricks worth carrying forward._

- ECharts: prefer serializable options; `renderItem` functions do not survive
  the JSON code modal; `registerMap` is a runtime side effect.
- Chart.js: core only (no plugins); native floating bars take a `[lo, hi]`
  tuple; no date adapter, so temporal axes need a linear epoch-ms scale with a
  tick callback.
- **Connection order ≠ x order.** A trajectory chart (connected scatter) needs a
  dedicated `order` channel so the line follows the sequence, not the x value.
  Added `"order"` to `core/types.ts` `channels` + the `""` channelGroup; VL uses
  an `order` encoding, ECharts/Chart.js pre-sort the series data by it.
- **End markers at axis bounds clip.** Points sitting exactly on a scale max get
  cut off in all three backends. Fix non-invasively with scale padding /
  `clip:false` (ECharts series, Chart.js datasets) rather than changing the zero
  contract.
- **Zero-baseline vs trajectory framing.** For change/trajectory charts (slope,
  connected scatter) the *change* is the read, not absolute level, so fit-data
  framing (`zero:false`) reads better — but it diverges from the engine default.
  Treat "always fit-data for these types" as an open product choice (below).
- **Fitted axes must pad on BOTH bounds.** When an axis is fit-data (non-zero)
  and the chart maps a paired positional bound on it (`y`+`y2`, `x`+`x2`), the
  domain-padding pass must union both fields' values or the band/span clips at
  the far bound. Fixed once in `echarts/instantiate-spec.ts` for all such types.
- **ECharts stacking goes wrong across zero.** A stacked series that can take
  negative values is routed into a separate negative stack and collapses to the
  zero line; set `stackStrategy:'all'` so stacking is cumulative regardless of
  sign (needed for range bands / stacked areas with negatives).
- **KDE charts need a padded extent.** For violin/ridgeline and any shared-extent
  KDE, pad the density extent by ~`1.5 × bandwidth` (use the *largest* per-group
  auto/NRD bandwidth) or wide-bandwidth groups render flat clipped caps at the
  extent edge instead of tapering to a point. Mirrors Vega/seaborn auto "cut".
- **Include/Conditional/Reject is genuinely per-backend.** The same type can be a
  native VL transform (Violin = `density`+mirrored area), a `renderItem`-only job
  in ECharts, and a plugin in Chart.js. Decide and record per backend; ship where
  the idiom is serializable, surface the rest in `uncertain-candidates.md`.

## Open questions / TODO

- **Zero-baseline contract for trajectory charts.** Slope keeps fit-data y
  (`zero:false`) for VL; connected scatter keeps the engine's sibling-Scatter
  zero decision and fixes clipping via padding/`clip:false`. Decide whether
  slope and connected scatter should *both* always fit-data for tighter framing.
- **Range / Band Area** — shipped in Round 2. Next Include candidate is Violin
  (VL); see backlog.

---

# Rounds

<!--
================ ROUND TEMPLATE (copy for each new round) ================

## Round N: <short title> (<date>)

**Sources swept.** Which galleries/libraries/catalogues were surveyed this
round, and what was harvested into `work/candidates.md` (count).

**Triage.** The verdict split this round.

| Verdict | Count | Types |
|---------|-------|-------|
| Include     |   |   |
| Conditional |   |   |
| Backlog     |   |   |
| Reject      |   |   |

**Implemented.** Types added, the backends they landed in, and the idiom used.

**Tests.** Structural tests added (count, suite total) and the render variants
inspected.

**Deferred.** What was Conditional/Backlog/Reject and the reason for each.

**Backend bugs found.** Any assembler/template bug surfaced while testing, and
where it was fixed or filed.

**Lessons.** Anything general worth promoting to the Durable lessons list.

========================================================================
-->

## Round 1: Change & trajectory (2026-06-16)

**Sources swept.** FT Visual Vocabulary (analytical-intent taxonomy), data-to-
viz.com (data-shape taxonomy), The Data Visualisation Catalogue, and the
Vega-Lite / ECharts / Chart.js galleries. Harvested 11 candidates into
`work/candidates.md` against a fresh baseline gap map (VL 26 · ECharts 26 ·
Chart.js 16 gallery entries; true cross-backend gaps: slope, connected scatter,
range/band area, violin, ridgeline, waffle, marimekko, diverging bar, hexbin,
chord, step line).

**Triage.**

| Verdict | Count | Types |
|---------|-------|-------|
| Include     | 2 | Slope Chart, Connected Scatter Plot |
| Conditional | 2 | Range/Band Area (Include next round), Violin (VL incl. / others cond.) |
| Backlog     | 5 | Waffle, Marimekko, Ridgeline, Hexbin, Chord |
| Reject      | 2 | Diverging/Tornado Bar (Bar property), Step Line (Line property) |

**Implemented.** A coherent "change & trajectory over a continuum" batch, both
landing in all three backends (position cognitive channel):

- **Slope Chart** — two-period value change, one straight line per category with
  end-point markers. VL: `line` + `point:true`, `interpolate:"linear"`, 2-band
  ordered x. ECharts: 2-category x-axis, one `line` series per category,
  `smooth:false`, `showSymbol:true`. Chart.js: 2-label category x with
  `offset:true`, one dataset per category, `tension:0`. Mirrors Bump Chart.
- **Connected Scatter Plot** — x/y points joined by a straight line in `order`
  sequence (a trajectory that may self-cross). Introduced a new `order` channel
  in `core/types.ts`. VL: layered `line`+`point` with `order` encoding. ECharts:
  `line` series sorted by order, `showSymbol:true`. Chart.js: `scatter` dataset
  with `showLine:true`, points pre-sorted by order.

**Tests.** +65 structural tests (slope 32, connected scatter 33); suite went
111 → 178, all green. Vision: every gallery/test case rendered to PNG per backend
(VL via `vl_convert`; ECharts SSR-SVG→resvg; Chart.js @napi-rs/canvas) and
reviewed by Azure `gpt-5.5`. Variants inspected: ordinal vs temporal periods,
low/high cardinality, negative/zero-crossing values, self-crossing figure-eight
and backtracking paths, index vs date order, single-series and `detail`-grouped
edge cases. Build + site typecheck + lint all green.

**Deferred.** Range/Band Area held to Round 2 (needs a `y2`/band channel; kept
the batch coherent on pure-position types). Violin Conditional (VL KDE area
feasible; ECharts precomputed-KDE polygons; Chart.js plugin-only reject). Waffle/
Marimekko/Ridgeline/Hexbin/Chord backlogged (layout math or non-serializable
layouts; Chart.js can't do most). Diverging-bar and step-line rejected as
properties of existing types. Full reasons in `work/candidates.md`.

**Backend bugs found.** None in the assemblers. Two rendering pitfalls handled in
the new templates: (1) end markers sitting on a scale max clipped in all three
backends — fixed with scale padding / `clip:false` (ECharts series, Chart.js
datasets); (2) narrow/tall framing tuned via cross-section / band-size param
overrides. A new `order` channel was added to `core/types.ts` to drive
connection order independent of x.

**Lessons.** Promoted to Durable lessons: the `order`-channel pattern for
trajectory charts, end-markers-clip-at-bounds fix, and the zero-baseline-vs-
trajectory-framing tension (left as an open product question).

## Round 2: Range bands (2026-06-16)

**Sources swept.** No new survey — Range/Band Area was promoted from the Round 1
Conditional queue, where it had been held back to keep Round 1 coherent on
pure-position types. It was the top backlog item with a clear cross-backend idiom.

**Triage.**

| Verdict | Count | Types |
|---------|-------|-------|
| Include     | 1 | Range Area Chart |
| Conditional | 0 | — |
| Backlog     | 0 | — |
| Reject      | 0 | — |

**Implemented.** **Range Area Chart** (band / high–low / area-range) in all three
backends — a translucent band between a lower bound (`y`) and upper bound (`y2`)
over a continuum; the value axis fits the band and is never anchored at zero.
Reused the existing `y2` channel (no new channel needed). markCognitiveChannel
`'area'`.

- **Vega-Lite** — native `mark:"area"` with `encoding.y` (low) + `encoding.y2`
  (high), `opacity≈0.5`, `scale.zero=false`, and `y.stack=null` when `color` is
  present so multiple bands overlap rather than stack.
- **ECharts** — per band a transparent stacked base (lower bound;
  `lineStyle.opacity:0`, `itemStyle.color:'transparent'` so it consumes no palette
  slot) + a translucent stacked delta (`high−low`) on the same `stack` → a ribbon
  between bounds. Fully serializable (no `renderItem`); custom low–high tooltip.
- **Chart.js** — per band a lower-bound line dataset (`fill:false`) + upper-bound
  line dataset (`fill:{target:<lowerIndex>}`) with translucent `backgroundColor`,
  no point markers; legend filters lower datasets so each band gets one entry.

**Tests.** +33 structural tests (`tests/range-area.test.ts`); suite 178 → 211, all
green. Vision: all 16 gallery/test images rendered per backend (VL `vl_convert`;
ECharts SSR-SVG→resvg; Chart.js @napi-rs/canvas) and reviewed by Azure `gpt-5.5` —
every image returned `band_between_bounds:true, filled_to_axis:false`, no issues,
including the critical ECharts band-not-to-zero check and a zero-crossing band.
Variants inspected: temporal daily low/high, multi-city color bands, numeric-x
confidence band, ordinal quarterly band, zero-crossing anomaly band, narrowing→
widening forecast cone, high-cardinality and column-faceted bands. Build + site
typecheck + lint all green.

**Deferred.** Nothing new deferred; backlog unchanged (Violin conditional next;
Waffle/Marimekko/Ridgeline/Hexbin/Chord backlog; cross-backend porting backlog).

**Backend bugs found.** Two real defects surfaced by VLM rendering and fixed at
the root cause: (1) the ECharts value-axis domain-padding pass computed the fitted
domain from only the `y` (lower) field, clipping the band's top — fixed in
`echarts/instantiate-spec.ts` to include the paired `y2`/`x2` bound when present
(also strictly correct for gantt spans; gantt-bullet tests stay green); (2) a
zero-crossing band collapsed to the zero line because ECharts routes a negative
base into a separate negative stack — fixed with `stackStrategy:'all'` on both
band series so stacking is cumulative regardless of sign.

**Lessons.** Promoted to Durable lessons: for any fitted (non-zero) value axis,
domain padding must consider BOTH positional bounds on that axis (`y`+`y2`,
`x`+`x2`), not just the primary field; and ECharts stacking needs
`stackStrategy:'all'` whenever a stacked series can go negative.

## Round 3: Distribution shape — Violin (2026-06-16)

**Sources swept.** No new survey — a targeted gap-fill. The distribution family
already had Histogram, Density Plot, and Boxplot in VL+ECharts; Violin was the one
canonical distribution chart missing everywhere. Confirmed the gap by listing the
three backends' `templates/` and the gallery.

**Triage.** Decided per backend (the idioms diverge sharply here):

| Verdict | Backend | Reason |
|---------|---------|--------|
| Include     | Vega-Lite | native `density` transform → mirrored `area` (`x:density, stack:"center"`); no plugin |
| Conditional | ECharts | KDE is reusable (`echarts/density.ts` already computes a vega-matched Gaussian `kde()`), but a *filled mirrored violin polygon* spanning both axes needs `custom`/`renderItem`, which the JSON code modal can't show → deferred, surfaced in `uncertain-candidates.md` |
| Reject      | Chart.js | violin needs a plugin (`chartjs-chart-boxplot`/violin); core-only constraint |

**Implemented.** **Violin Plot — Vega-Lite only.** Native VL violin: a `density`
transform grouped by category + `mark:"area"` with `x` mapped to `density` and
`stack:"center"` for the symmetric mirror; the measure sits on the shared `value`
(y) axis; one violin per category via VL faceting; a `bandwidth` property reusing
`density.ts`'s wiring. Channel mapping mirrors Boxplot — `x` = category, `y` =
measure, `color` = category (optional), `row` = optional outer facet. **`column`
is consumed internally** for the per-category violin panels (the standard VL
violin layout), so it is not offered as a user facet (documented in the def and
SKILL.md).

**Tests.** +23 structural tests (`tests/violin.test.ts`): density transform keyed
on the measure with category `groupby`, mirrored `x.stack==="center"`, measure on
the `value` axis, `bandwidth` feeds the transform, one violin per category, hidden
density-axis ticks/labels, plus a gallery compile sweep. Suite 211 → 234, all
green. Vision: all 8 cases rendered via `vl_convert` and reviewed by Azure
`gpt-5.5`. Variants: multi-class scores (bimodal/skewed/tight/broad), explicit
bimodal sensor (two humps), zero-crossing returns, uneven group sizes, 6-category
spacing, single violin, color=category, and a `row`-faceted case. Build + site
typecheck + lint all green.

**Deferred.** ECharts Violin (renderItem-only) and Chart.js Violin (plugin) — both
appended to `uncertain-candidates.md` with the blocker and a possible serializable
ECharts hack to evaluate (stacked transparent-base band per category on a `value`
axis, the range-area technique applied to KDE). Not implemented this round per the
"surface uncertain candidates" directive.

**Backend bugs found.** None in the assemblers. One render defect fixed in the new
template: with a shared density `extent`, a wide-bandwidth group (auto NRD ≈ 3× the
others) hit the extent boundary and rendered flat clipped caps instead of tapering
to a point — fixed by padding the shared extent by `max(range×0.05, 1.5 ×
effectiveBandwidth)` (effectiveBandwidth = user bandwidth, else the max per-group
NRD), matching Vega/seaborn's auto-bandwidth "cut".

**Lessons.** Promoted to Durable lessons: KDE violins/ridgelines need the shared
density extent padded by ~1.5× the (largest) bandwidth or wide-bandwidth groups
clip at the extent edge; and the per-backend Include/Conditional/Reject split is
real — a native VL transform becomes a renderItem requirement in ECharts and a
plugin in Chart.js.