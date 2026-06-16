<!--
  Skill Optimization Log
  ----------------------
  Running record of the SKILL.md optimization loop (see README.md for the method).

  HOW TO USE THIS FILE
  - At the END of every round, append a new "## Round N" entry using the
    Round Template below. Fill in every field; write "none" rather than
    leaving a blank.
  - Keep the "# Experiment Summary" section at the top up to date — it is the
    rolling, at-a-glance state of the whole experiment and the place where
    durable lessons accumulate so future runs start from what we already know.
  - One skill change per round (see README). Record exactly what changed and
    why, so a score delta can be attributed to it.
  - Newest round at the bottom; the summary at the top is always current.
-->

# Experiment Summary

_Rolling overview. Update after every round._

- **Status:** in progress <!-- not started | in progress | converged | paused -->
- **Current SKILL.md revision:** baseline + 1 (added a "Don't invent field names" guardrail covering wide-format data)
- **Rounds completed:** 1
- **Models:** generate = GPT-5.5 · test = GPT-5.5 (GPT-5-mini not deployed at this Azure resource yet) · grade = GPT-5.5 vision
- **Best result so far:** Round 0, GPT-5.5: structural 4.89/5 (49/55 perfect, 100% assembly), vision 4.25/5 (40 pass / 11 rendering / 4 data)

## Scoreboard

| Round | Skill change (1 line) | GPT-5.5 avg | GPT-5.5 perfect | Mini avg | Mini perfect | n |
|-------|-----------------------|-------------|-----------------|----------|--------------|---|
| 0     | baseline (+ harness/library fixes; skill rule added for round 1) | struct 4.89 / vision 4.25 | 49/55 | —        | —            | 55 |

## Durable lessons

_What we've learned that should survive into future experiments. Add a bullet
whenever a round teaches something general (not a one-off)._

- The library contract is "data is always pre-aggregated": an encoding
  `aggregate` only renames the referenced column (`field_sum`, `field_average`,
  `_count`); the HOST must produce that column. Any harness that injects raw
  data must reproduce this pre-aggregation or every aggregated chart renders
  blank. (Fixed in `work/_assemble.mjs`.)
- Vision grading has run-to-run variance of roughly +/- 1 flag; treat a single
  flagged image as a lead, not a verdict. Deterministic, reproducible defects
  (blank charts, leaked field names) are the reliable signal.
- Most round-0 weaknesses were library or harness issues, not skill-doc gaps.
  The skill itself scored well; route layout/label polish to the
  system-optimization loop and keep skill edits minimal and attributable.

## Open questions / TODO

- Deploy or locate a weaker test model (GPT-5-mini) at the Azure resource so we
  can compare strong vs weak authoring of `ChartAssemblyInput`. Only `gpt-5.5`
  is deployed at `fxdata-eastus2` today.
- Top/edge clipping of marks at the maximum value (no measure-axis headroom)
  was the single most common vision issue (11 of 55). This is a library layout
  decision, not a skill gap — hand it to the system-optimization loop.
- Legend overflow on high-cardinality color (5 of 55) is a known polish item
  for the system-optimization loop.

---

# Rounds

<!--
================ ROUND TEMPLATE — copy for each new round ================

## Round N — <short title> (<date>)

**Skill change.** What changed in `SKILL.md` this round (the single edit) and
the hypothesis behind it. Link the diff/section if useful.

**Benchmark.** Questions run this round: how many carried over, how many new,
which chart types added and why. Note the denominator (questions are not
fixed across rounds).

**Results.**

| Model | Avg | Perfect | Assembly OK | Chart-type acc | n |
|-------|-----|---------|-------------|----------------|---|
| GPT-5.5 |   |   |   |   |   |
| GPT-5-mini |   |   |   |   |   |

**Diagnosis.** For each notable failure, the bucket and the call:
- _Skill gap_ — …
- _Model mistake_ — …
- _flint bug_ — … (filed under `work/results/to_inspect/`)
- _Bad question/data_ — … (flagged under `work/results/poor_data/`)

**Decision for next round.** What to change (or revert), and why.

**Lessons.** Anything general worth promoting to the Durable lessons list.

========================================================================
-->

## Round 0 — baseline run (2026-06-16)

**Skill change.** None applied *to this round* (round 0 is the baseline). The
round's diagnosis motivated one edit, applied for round 1: a new
"Don't invent field names" rule in `SKILL.md` > "What you should NOT do". It
tells the author to reference only columns present in the dataset and, for
wide-format data feeding charts that cannot use the `x`/`y` array fold (pie,
arc — they bind `theta`/`color`), to reshape to long upstream rather than
guess category/value column names. Hypothesis: prevents the q033-class failure
where the model fabricated `energy_source`/`share` columns.

**Benchmark.** 55 questions (the archived seed set), spanning 12 chart types:
Bar (13), Line (11), Scatter (9), Stacked Bar (5), Histogram (4), Heatmap (3),
Area (2), Pie (2), Boxplot (2), Lollipop (2), Grouped Bar (1), Waterfall (1).
All new this round (first run). Datasets: the 50 real `work/datasets/` tables.

**Results.**

| Model | Avg | Perfect | Assembly OK | Chart-type acc | n |
|-------|-----|---------|-------------|----------------|---|
| GPT-5.5 | struct 4.89 / vision 4.25 | 49/55 (struct) | 100% | 89% | 55 |
| GPT-5-mini | n/a (not deployed at this resource) | — | — | — | — |

Vision categories: 40 pass, 11 rendering_issue, 4 data_issue. Dominant issue
theme: top/edge clipping of the max-value mark (11), then legend overflow (5),
leaked "undefined" labels (2), raw internal field name (1).

**Diagnosis.** For each notable failure, the bucket and the call:
- _Harness gap (fixed)_ — All 5 charts using `aggregate` (q009, q048, q049,
  q051, q052) rendered blank. Root cause: the library expects pre-aggregated
  data and only renames the column (`field_average` / `_count`); the harness
  injected raw rows, so the referenced column did not exist. Fixed by adding
  host-style pre-aggregation to `work/_assemble.mjs`. Re-render: 4 now 5/5,
  q052 a minor stacked-bar legend-density issue.
- _flint bug (fixed)_ — Static-series (multi-field `x`/`y` array) charts (q008,
  q015, q046, q053) leaked the synthetic value column `__flint_series_value`
  into the measure-axis title. Fixed in `vegalite/assemble.ts`: the value column
  now defaults to the title "Value" (host-overridable via
  `field_display_names`), mirroring the existing "Series" handling for the key
  column. Added 2 regression tests in `tests/static-series.test.ts` (113 pass).
- _Model mistake_ — q033 (pie): fabricated long-format columns for wide-format
  energy data and used `size` instead of `theta`. Drives the round-1 skill edit.
  q041 (temperature range by weather): chose a Gantt-style encoding that
  rendered as a dense blob; a poor chart choice for the question.
- _Library layout polish (route to system-optimization loop)_ — top/edge
  clipping with no measure-axis headroom (11 images: e.g. q024, q027, q037,
  q040, q043, q050, q054); high-cardinality legend overflow (q032 pie, q052
  stacked bar). These are deterministic layout decisions in the core pipeline,
  not skill-doc gaps.
- _Soft label noise (not a real error)_ — 6 of the 11% chart-type "misses" are
  defensible model choices vs the rigid `expected_chart_type` label (scatter vs
  bar for "compare visually", histogram vs bar for ages-at-death, line vs bar
  for a time series). Only q041 is a genuinely poor pick.

**Harness changes this round (infrastructure, not skill).**
- `work/_assemble.mjs`: reproduce host-side pre-aggregation for `aggregate`
  encodings (`field_sum` / `field_average` / `_count`).
- `work/evaluate.py`: fixed the npx path derivation (`NODE.replace("/node",…)`
  corrupted it) and raised the assemble timeout to 60s for `npx tsx` cold start.
- `work/generate.py` (new): batch-calls Azure GPT-5.5 (Entra ID) to author the
  `ChartAssemblyInput` closed-book; `max_completion_tokens` raised to 6000
  because GPT-5.5 is a reasoning model and small budgets return empty content.
- `work/grade_vision.py`: parallelized grading with a thread pool (`--workers`).

**Decision for next round.** Keep the field-fidelity skill edit; re-run the same
55 plus a few wide-format and aggregate cases to confirm the q033 class is gone,
and add coverage for chart types still untested under the skill. Do not chase
top/edge clipping here — it belongs to the system-optimization loop.

**Lessons.** Promoted to Durable lessons: the pre-aggregation contract, vision
grading variance, and "most round-0 weaknesses were library/harness, not skill."

## Round 1 — skill-edit spot-check (2026-06-16)

**Skill change under test.** The round-0 edit: "Don't invent field names"
(reference only existing columns; reshape wide→long upstream for pie/arc).

**Spot-check.** Re-generated the motivating case q033 (wide-format energy mix,
"pie for a single country") under the edited skill. Result: GPT-5.5 still
fabricated long-format columns (`energy_source`, `share_energy`) that are not in
the dataset. The prohibition alone did not change behavior.

**Why.** This case has no clean authoring path today: the pie/arc family binds
`size`(→`theta`)/`color`, but the wide→long array fold is restricted to the
`x`/`y` measure channels (`MEASURE_CHANNELS = {x, y}` in `core/static-series.ts`).
The dataset is also one row per country (30 rows), so even a correct fold would
sum across countries — the question additionally needs a single-country filter,
which the skill has no transform for. So the model, forced to produce something,
guesses a long schema.

**Decision.** Keep the field-fidelity rule (sound, low-risk general guidance),
but do not claim it fixes the wide-format-pie class. File the real fix as
backlog rather than rush a refactor at session end:
- Library enhancement (new-chart-types / system-optimization backlog): extend
  the wide→long array fold to the `size` channel so pie/arc/rose can consume
  wide-format measures (`size: [colA, colB, colC]` → slices = series key,
  angle = value). Must preserve current pie/rose behavior and add tests; mind
  the cross-row aggregation semantics (fold then aggregate per series).
- Until then, wide-format pie remains a known limitation; the honest authoring
  answer is "ask the host to reshape and filter," which is not a renderable
  benchmark output.

**Lessons.** A prose prohibition does not reliably steer a reasoning model away
from a gap when the benchmark forces an output and no valid path exists. Prefer
giving the model a concrete capability (or a worked example) over a "don't."
