<!--
  System Optimization Log
  -----------------------
  Running record of the rendering/system optimization loop (see README.md for
  the method).

  HOW TO USE THIS FILE
  - At the END of every round, append a new "## Round N" entry using the Round
    Template below. Fill in every field; write "none" rather than leaving a
    blank.
  - Keep the "# Experiment Summary" section at the top up to date. It is the
    rolling, at-a-glance state of system robustness and the place where durable
    lessons (recurring layout/semantic failure modes and their fixes) accumulate
    so future rounds start from what we already know.
  - One coherent library change per round, so a result delta can be attributed
    to it. Refactors must pass the regression guardrails in README.
  - Newest round at the bottom; the summary at the top is always current.
-->

# Experiment Summary

_Rolling overview. Update after every round._

- **Status:** not started <!-- not started | in progress | converged | paused -->
- **Rounds completed:** 0
- **Models:** plan/generate = GPT-5.5 · system = deterministic assemblers · grade = GPT-5.5 vision
- **Regression gallery:** not yet pinned
- **Open defect classes:** none recorded yet

## Defect scoreboard

_Per round: cases rendered, defects found, defects fixed. A round is good when
new stress tests stop finding new defect classes._

| Round | Theme | Cases | Defects found | Fixed | Module touched |
|-------|-------|-------|---------------|-------|----------------|
| —     | —     | —     | —             | —     | —              |

## Open defect classes

_Found but not yet fixed, with the suspected module._

- **Measure-axis top/edge clipping (no headroom).** Marks at the maximum value
  sit on the plot boundary and read as clipped. Most common issue in the
  skill-optimization round-0 vision grade (11 of 55 images: e.g. scatter,
  lollipop, boxplot, histogram, bar). Suspected module: `core/compute-layout`
  / scale-`nice`/padding decisions (`core/resolve-semantics` `resolveNice`).
  Fix idea: add a small top padding (or `nice`) to the point/bar measure axis
  so the extreme mark is not flush to the frame. Source:
  `loops/skill-optimization/rendered/round_00/gpt-5.5/grades.json`.
- **High-cardinality legend overflow.** Pie with many thin slices (q032) and
  stacked bars with many color categories (q052) produce dense, truncated
  legends. Suspected module: `core/compute-layout` legend sizing /
  `filter-overflow`. Fix idea: cap legend entries or shrink/wrap consistently.

## Durable lessons

_Recurring layout/semantic failure modes and the fix pattern, worth carrying
forward._

- Wide-format data into charts that bind `theta`/`color` (pie, arc, rose) has no
  authoring path: the wide→long array fold is limited to `x`/`y`
  (`core/static-series.ts` `MEASURE_CHANNELS = {x, y}`). Candidate enhancement:
  extend the fold to the `size` channel. (Surfaced by skill-optimization q033.)

## Open questions / TODO

- Pin the regression gallery (representative cases x all backends) before the
  first refactor round.

---

# Rounds

<!--
================ ROUND TEMPLATE (copy for each new round) ================

## Round N: <theme> (<date>)

**Target and hypothesis.** The weakness theme chosen this round and what is
likely to break and why.

**Tests generated.** How many cases, real vs synthetic, which stressors they
dial, and across which backends.

**Findings (vision grade).**

| Severity | Count | Defect (1 line) | Backend(s) | Suspected module |
|----------|-------|-----------------|------------|------------------|
|          |       |                 |            |                  |

**Diagnosis.** For each notable defect, the bucket and the call:
- _Library defect_: … (module)
- _Backend quirk_: …
- _Bad test/data_: …

**Change made.** The single library change (or refactor) this round and the
hypothesis it tests. Note files touched.

**Regression check.** Unit suite result, and the regression-gallery diff
(before/after) result. Confirm nothing else moved.

**Decision for next round.** Where to push next, or what to revert.

**Lessons.** Anything general worth promoting to the Durable lessons list.

========================================================================
-->
