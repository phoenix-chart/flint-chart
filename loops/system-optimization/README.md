# System Optimization Loop

How we iteratively stress-test flint-chart's rendering to find and fix rendering
defects, with a focus on the semantic-type-driven and layout decisions that the
library makes for **existing** chart types. The system under test is the library
itself (the assemblers and the deterministic logic that derives sizing, zero
baselines, color schemes, formatting, legend and axis layout, and overflow from
semantic types), not the authoring skill and not the set of chart types.

This loop runs the same shape as the skill-optimization loop (plan, generate
tests, render, grade with vision, diagnose, revise, repeat), with two
differences: the thing we edit each round is the library code, and the test data
can be **synthetic, designed to probe reliability** rather than only real
datasets.

This file describes the *method only*. Synthetic data generators, render
scripts, screenshots, and run artifacts are work items and live under
[`work/`](work/). The running record of each round is in [`log.md`](log.md).

## System under test

The deterministic pipeline in `packages/flint-js/src/core/` turns a semantic
spec into abstract decisions that each backend renders:

- `semantic-types.ts` + `type-registry.ts`: classify each field's semantic type.
- `field-semantics.ts`: resolve what a field *is* (identity, format, domain,
  scale hint, ordering) from its annotation plus the actual values.
- `resolve-semantics.ts`: per-channel decisions (encoding type, color scheme,
  temporal format, ordinal sort, tick constraints, axis reversal, nice rounding,
  interpolation, stacking).
- `color-decisions.ts`: colormap choice from field/channel semantics and data
  stats.
- `compute-layout.ts`: axis lengths, step sizes, subplot dimensions, label
  sizing, and overflow truncation from data density and axis classification.
- `filter-overflow.ts`: which discrete values to keep when there are too many
  for the canvas.
- `decisions.ts`: shared pure decision functions.

These feed the three backends (`vegalite/`, `echarts/`, `chartjs/`) and their
per-type templates. The loop's job is to confirm these decisions produce
legible, correct, cross-backend-consistent renderings across a wide range of
data, and to fix them when they do not.

## Step 0: seed the data pool

Two pools, used together:

- **Real datasets** from `../visbench` (Spider, TidyTuesday, vega-datasets), to
  keep the tests grounded in shapes that occur in practice.
- **Synthetic data** designed to probe library reliability: parameterized
  generators that dial a single stressor (cardinality, label length, value
  range, temporal span, missingness, semantic type) to its edges. See the
  stressor catalogue in `work/stressors.md`.

Synthetic data is the point of this loop: it lets us reach the corners that real
datasets rarely hit, where layout and semantic decisions break.

## Models to use

- **Plan and generate tests:** GPT-5.5. Each round it reviews prior findings,
  picks a weakness to push on, and designs the test cases and synthetic data
  that target it.
- **System under test:** the flint-chart assemblers themselves. They are
  deterministic, so there is no model here; we render the same spec across all
  three backends.
- **Grade:** GPT-5.5 vision, inspecting the rendered images (not just the spec
  JSON). Rendering defects are visual, so grading must be visual.

## The loop

1. **Plan the round's target.** Review prior rounds' findings in `log.md` and
   choose one weakness theme to push on (for example: legend placement at high
   category counts, temporal tick density, long category labels, zero-baseline
   correctness for diverging data, color scheme by semantic type, facet grid
   layout, canvas-size consistency across backends, overflow truncation). State
   the hypothesis: what is likely to break and why.
2. **Generate targeted tests.** Build test cases (chartType x encodings x data)
   that exercise the theme, using real or synthetic data dialed to stress it.
   Cover the cardinalities and semantic types that matter. Tag each case with
   the stressor it probes so results are attributable.
3. **Render across backends.** Assemble each case to Vega-Lite, ECharts, and
   Chart.js and render to PNG headlessly: Vega-Lite via `vl_convert`; ECharts
   via the SSR SVG renderer (`echarts.init({ renderer: 'svg', ssr: true })` then
   `@resvg/resvg-js` to PNG); Chart.js via `@napi-rs/canvas` (register a TTF such
   as DejaVuSans, set `responsive: false`, `animation: false`).
4. **Grade with vision.** Score each rendering for defects: clipping or
   overflow, overlapping or illegible labels, a legend off-canvas or covering
   data, a missing or wrong axis, a wrong zero baseline, wrong color semantics,
   inconsistent canvas size or aspect across backends, distorted plots. Capture
   per-defect notes plus the screenshot.
5. **Diagnose.** Bucket each defect:
   - *Library defect*: localized to a core module (layout, semantics, color,
     overflow) or a specific template. This is what we fix.
   - *Backend quirk*: a limitation of one renderer; decide whether to work
     around it in our template.
   - *Bad test/data*: the case itself is unreasonable; fix or drop it.
6. **Fix, or refactor if needed.** Make the smallest change that fixes the
   defect *class*, not the single instance. If a class reveals a structural
   problem, refactor the responsible subsystem, but only behind the regression
   guardrails below.
7. **Verify and record.** Re-render the failing cases plus the regression set,
   confirm the defect is gone and nothing else regressed, run the full unit
   suite, then append a round entry to `log.md` and promote durable lessons.

## Stressor catalogue (what synthetic data targets)

Design generators that dial one stressor at a time. The full catalogue lives in
`work/stressors.md`; the themes:

- **Cardinality:** 1, 2, a handful, dozens, hundreds of categories or series.
- **Labels:** very long names, multi-word, unicode, numeric-looking strings.
- **Values:** negatives, zero-crossing, huge ranges, tiny ranges, outliers,
  and missing/null/NaN.
- **Temporal:** sub-day to multi-year spans, irregular spacing, a single point.
- **Semantic types:** nominal vs ordinal vs quantitative vs temporal vs
  geographic, ordinal sort order, and the types that should flip a zero
  baseline, color scheme, or number/date format.
- **Layout:** legend placement vs category count, facet grids (row and column)
  at varying counts, canvas-size consistency across backends, axis-label fit,
  banded step sizing, overflow behaviour.
- **Cross-backend consistency:** the same spec should read consistently across
  Vega-Lite, ECharts, and Chart.js.

## What counts as a defect worth fixing

- It is a rendering defect, not a data or spec mistake.
- It hurts legibility or correctness, or it breaks cross-backend consistency.
- It generalizes to a class of inputs, not a single pixel nit on one case.

## Refactor guardrails (do not break the rest)

Changes to shared core modules touch every chart, so each round must protect the
existing behaviour:

1. The full suite stays green: `npm run test -w packages/flint-js`.
2. A pinned **regression gallery** (a fixed set of representative cases across
   all backends and chart types) is re-rendered before and after the change and
   visually compared. No new defects allowed.
3. Prefer additive, localized changes. When a refactor touches `compute-layout`,
   `resolve-semantics`, `color-decisions`, or `filter-overflow`, render the whole
   regression set both ways and diff the results before keeping it.
4. Land one coherent change per round so a result delta is attributable, and
   record what moved in `log.md`.

## Where the system lives

- Assemblers: `packages/flint-js/src/{vegalite,echarts,chartjs}/` (the
  `assemble*` entry points and per-type `templates/`).
- Deterministic decisions: `packages/flint-js/src/core/` (the modules listed
  under "System under test").
- Existing regression tests to build on: `packages/flint-js/tests/`
  (`static-series-gallery.test.ts`, `boxplot-label-fit.test.ts`, the per-type
  tests).
- Render and grade scripts: `work/` (reuse the headless render paths and the
  Azure vision grader from `../skill-optimization/work/grade_vision.py`).
- Python parity: mirror any cross-cutting decision fix into `packages/flint-py`.

**Finish when** newly planned stress tests stop surfacing new defect classes,
the regression gallery stays clean across rounds, and the semantic-type and
layout decisions look robust across backends and across the stressor catalogue.
Robustness is the bar, not a fixed round count; stop pushing once the system
holds up under deliberately adversarial data.
