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

## Backlog and conditional candidates

_Types triaged but not implemented, with the blocker. Promote when the blocker
clears._

- **Range / Band Area** (Include, next round): high–low band over a continuum;
  needs a `y2`/band channel. Top of the Round 2 queue.
- **Violin Plot** (Conditional): Include for VL (own KDE → mirrored area);
  ECharts conditional (precomputed KDE polygons); Chart.js reject (plugin only).
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

## Open questions / TODO

- **Zero-baseline contract for trajectory charts.** Slope keeps fit-data y
  (`zero:false`) for VL; connected scatter keeps the engine's sibling-Scatter
  zero decision and fixes clipping via padding/`clip:false`. Decide whether
  slope and connected scatter should *both* always fit-data for tighter framing.
- **Range / Band Area** is the next Include — start Round 2 there (needs the
  `y2`/band channel).

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