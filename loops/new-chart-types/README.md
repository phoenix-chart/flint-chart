# New Chart Types Loop

How we discover chart types used in other visualization libraries and enrich the
flint-chart backends with the ones worth supporting. The goal is to grow
coverage deliberately: survey what the wider ecosystem offers, decide what fits
the Flint semantic model, then implement, test, and document each addition to
the same bar as the existing types.

This file describes the *method only*. Candidate lists, render scripts, and run
artifacts are work items and live under [`work/`](work/). The running record of
each round is in [`log.md`](log.md).

## What "a chart type" means here

Flint compiles one semantic spec (`chartType` + channel→field mapping + semantic
types) into Vega-Lite, ECharts, and Chart.js. A chart type is a registered
template that maps marks and channels to a backend-native option. So a new type
must earn its place as a distinct semantic template, not as a restyle of an
existing one (a donut is `"Pie Chart"` with `innerRadius > 0`, not a new type).

Current registered coverage (the baseline each round starts from):

- Vega-Lite: the broadest backend, every registered type.
- ECharts: the statistical and dashboard set, plus its own idioms (gauge,
  funnel, treemap, sunburst, sankey, parallel coordinates, graph, tree).
- Chart.js: the lightweight core set (no plugins).

Read the live counts and names from `site/src/shared/chart-categories.ts` and the
`agent-skills/SKILL.md` chart table at the start of every round.

## Step 0: inventory the baseline

Before discovering anything new, write down what already exists: the per-backend
coverage matrix (which `chartType` is registered in which backend) from the
template registries and the gallery. This is the gap map the round works
against, and it keeps us from "discovering" a type we already ship.

## Where we discover new chart types

Sweep these sources and collect candidates into `work/candidates.md`. For each
source, extract the analytical task the chart serves, the data shape it expects,
and the marks/channels it uses (not just its name).

**Grammar-of-graphics galleries** (closest to how Flint thinks, easiest to map):

- Vega-Lite and Vega example galleries
- Observable Plot gallery
- ggplot2 / plotnine

**Charting libraries** (idiomatic chart types and their option shapes):

- Apache ECharts examples (our own ECharts backend's upstream)
- Chart.js and the `chartjs-chart-*` plugin ecosystem (boxplot, financial,
  geo, matrix, sankey, treemap, funnel, wordcloud)
- Plotly, Highcharts, AmCharts, Nivo, Recharts, D3 graph gallery

**BI tools** (what analysts actually reach for):

- Tableau "Show Me" catalog, Power BI visuals, Superset, Looker

**Visualization catalogues and taxonomies** (breadth and naming):

- The Data Visualisation Catalogue (datavizcatalogue.com)
- From Data to Viz (data-to-viz.com), keyed by data shape
- Financial Times Visual Vocabulary (keyed by analytical intent)
- Data Viz Project (datavizproject.com)
- Xenographics (novel/edge types, mostly for the backlog)

Use web search/fetch to pull current examples. Prefer sources that show the
underlying data so the channel mapping is unambiguous.

## Criteria for inclusion

Score each candidate against this rubric. Record the scores and the verdict in
`work/candidates.md`.

1. **Distinct purpose.** It serves an analytical task or insight not already
   covered by a registered type. If it is a styling variant of an existing type,
   it is a *property*, not a new type.
2. **IL-expressible.** It maps cleanly onto Flint marks + channels + a single
   cognitive channel (position, length, angle, color, ...). If it needs an
   imperative escape hatch to exist, it probably does not fit the model yet.
3. **Backend feasibility.** It is implementable in at least one target backend
   without unsafe or heavyweight dependencies. Prefer:
   - ECharts: serializable options (stacked/floating bars, scatter overlays);
     avoid `renderItem` functions, which the code modal cannot show as JSON, and
     flag side effects like `registerMap`.
   - Chart.js: core `chart.js` only. Native floating bars `[lo, hi]` are fine;
     boxplot/financial/geo/matrix need plugins, so mark those conditional.
4. **Data generality.** It works across a range of cardinalities and semantic
   types, not one bespoke dataset.
5. **Prevalence/demand.** It appears across multiple libraries or catalogues, or
   is frequently requested. Pure novelties go to the backlog.
6. **Maintainable.** Reasonable template size, and the look stays deterministic
   from semantic types (no hand-tuned per-case values).

**Verdict.** Include when it is distinct, IL-expressible, feasible in at least
one backend, and general. Otherwise file it as:

- *Conditional*: good but blocked on a dependency or a model extension (record
  the blocker, e.g. "needs chartjs-chart-geo").
- *Backlog*: niche or low-demand; revisit later.
- *Reject*: redundant or not IL-expressible (record the reason).

A type can be Include for one backend and Conditional for another. Decide per
backend, since the idioms and dependency limits differ.

## The loop

1. **Discover.** Sweep the sources above and fill `work/candidates.md` with
   name, source links, the task it serves, an example data shape, and a
   marks/channels sketch.
2. **Triage.** Score every candidate against the criteria and assign a verdict
   per backend (Include / Conditional / Backlog / Reject) with a reason.
3. **Design.** For each Include, map it to Flint marks + channels, choose the
   cognitive channel, pick target backends, and sketch the per-backend idiom and
   any dependency constraint. Mirror an existing template that uses the same
   shape (floating bars → `waterfall.ts`; banded horizontal → `lollipop.ts`).
4. **Implement.** Add the template(s) and wire them in:
   - Template: `packages/flint-js/src/{vegalite,echarts,chartjs}/templates/<type>.ts`
     implementing `ChartTemplateDef`.
   - Registry: add to the matching `templates/index.ts` category array.
   - Test data: add or reuse a generator in `packages/flint-js/src/test-data/`
     and register its key in `test-data/index.ts` `TEST_GENERATORS`. Generators
     are reused across backends; the gallery `backend` field selects the
     assembler.
   - Gallery: add `createChart(...)` entries in
     `site/src/shared/chart-categories.ts` and an icon under
     `site/src/assets/chart-icons/`.
   - Python parity: mirror in `packages/flint-py` when the type belongs there.
5. **Test.** Two layers, both required:
   - *Structural*: unit tests in `packages/flint-js/tests/<type>.test.ts` that
     assemble each new type and assert series/datasets, float tuples, colors,
     and axis flags. Keep the full suite green.
   - *Vision*: render PNGs and inspect them across data variants (temporal vs
     numeric, low vs high cardinality, negatives/zero-crossing). Headless paths:
     Vega-Lite via `vl_convert`; ECharts via the SSR SVG renderer
     (`echarts.init({ renderer: 'svg', ssr: true })` → `@resvg/resvg-js` → PNG);
     Chart.js via `@napi-rs/canvas` (register a TTF such as DejaVuSans, set
     `responsive: false`, `animation: false`). Iterate until each renders
     correctly.
6. **Document.** Update `agent-skills/SKILL.md` (chart table row + the per-backend
   coverage notes) so the authoring skill knows the new type and its channels.
   Refresh gallery labels, and append a round entry to `log.md`.
7. **Ship.** Build flint-js and the site, run the full test suite, then
   fast-forward to `main` via the worktree workflow (one feature branch, copy the
   changed files in, build/test, commit with the co-author trailer, push, FF
   `main`).

## What each round produces

- New or updated templates registered in the backends and the gallery.
- Structural tests plus reviewed render PNGs for every new type.
- An updated SKILL.md chart table.
- A `log.md` round entry recording what was surveyed, what was added, what was
  deferred (with reasons), and any backend bug found along the way.

**Finish when** the backends cover the high-value, IL-expressible chart types
from the surveyed sources, and the remaining candidates are either inherently
backend-incompatible (recorded in the backlog with rationale) or low-demand
novelties. Coverage is deliberately uneven across backends: a type lands where
its idiom is natural, and is left out where it is not.
