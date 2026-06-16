# Uncertain chart-type candidates — needs a human decision

Charts surfaced by the discovery loop that *might* be worth adding but are
**uncertain** (ambiguous fit to the Flint IL model, questionable cross-backend
feasibility, debatable distinctness, or low/uncertain demand). The loop does NOT
implement these on its own — it parks them here for @Chenglong-MS to decide.

Triaged Backlog/Conditional items live in `work/candidates.md` (gitignored);
this file is the committed, human-facing surface for genuinely uncertain calls.

How to read a row: **Verdict-if-yes** = what I'd build if you greenlight it;
**Why uncertain** = the specific doubt I want you to resolve.

---

## Open decisions

### Violin Plot — _VL shipped (Round 3); ECharts/Chart.js still open_
- Sources: FT Visual Vocabulary (Distribution); data-to-viz.
- **Resolved:** Vega-Lite violin shipped in Round 3 (native `density` transform →
  mirrored `area`, `x:density stack:"center"`, `bandwidth` prop). Completes the
  distribution family (Histogram, Density, Boxplot, Violin) for VL.
- **Still uncertain — ECharts:** the KDE itself is reusable (`echarts/density.ts`
  already computes a vega-matched Gaussian `kde()`), but a *filled mirrored violin
  polygon* spanning both axes idiomatically needs a `custom`/`renderItem` series,
  which the JSON code modal can't render. A possible **serializable** hack worth a
  spike: per category, a transparent stacked base at `center − density` plus a
  translucent delta of `2·density` on a `value` x-axis (the Round 2 range-area band
  technique applied to KDE samples). Unproven; may look blocky at low sample steps.
- **Still uncertain — Chart.js:** violin needs a plugin (`chartjs-chart-boxplot`);
  the core-only constraint rejects it.
- Decision needed: (a) greenlight a spike on the ECharts serializable-band violin,
  or (b) leave ECharts/Chart.js violin unsupported (coverage stays VL-only)?

### Marimekko / Mosaic Plot
- Sources: data-to-viz (two categorical); datavizcatalogue "Mekko".
- Verdict-if-yes: VL + ECharts via computed variable-width `rect` (x/x2 from
  category totals); Chart.js cannot do variable-width bars.
- Why uncertain: layout math is heavy and per-case; risk of non-deterministic
  look; Chart.js gap. Distinct from Stacked Bar but niche.
- Decision needed: worth the complexity, or leave on the backlog?

### Waffle Chart
- Sources: FT (Part-to-whole); datavizcatalogue.
- Verdict-if-yes: VL (computed 10x10 cell grid) + ECharts (pictorial grid);
  Chart.js none.
- Why uncertain: overlaps Pie/Treemap intent; demand unclear.

### Ridgeline / Joy Plot
- Sources: FT (Distribution); data-to-viz.
- Verdict-if-yes: VL faceted/overlapping density; ECharts offset areas.
- Why uncertain: overlaps Density + facet; mostly an arrangement, low demand.

### Hexbin Plot
- Verdict-if-yes: VL only, and only with a precomputed binning transform.
- Why uncertain: no native hexbin anywhere; needs a binning step outside the
  current pipeline.

### Chord Diagram
- Verdict-if-yes: ECharts circular graph, but idiomatic chord ribbons need
  non-serializable custom rendering.
- Why uncertain: blocked on the serializability constraint; Sankey/Network
  already cover most flow needs.

---

_New uncertain finds from later survey rounds get appended below with the same
fields, and called out in the round summary._
