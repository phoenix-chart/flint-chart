# Flint-Chart: A Visualization Library for Agent Developers

> You're building an AI agent that creates charts. Every approach you've
> tried is brittle — prompt-engineered Vega-Lite that breaks when users
> edit fields, sizing heuristics that fail on new data shapes, retry
> loops that burn tokens. **Flint-chart** is a library that eliminates
> this brittleness.
>
> For the semantic type system, see
> [design-semantics.md](design-semantics.md). For the axis layout
> compression models, see
> [design-stretch-model.md](design-stretch-model.md).

---

## TL;DR

If you're building an AI agent that creates visualizations, you face a
fundamental problem. You can have your agent generate simple chart specs
that users can edit — but they look bad (wrong sizing, misleading
encodings). Or you can have it generate polished specs — but they're
brittle (hard-coded values break on every field swap, and every edit
requires another LLM call). Either way, you're encoding design knowledge
in prompts — and **prompts are not a reliable way to encode design
knowledge.** Your agent may or may not follow them, and the result varies
across models, prompt versions, and even runs. Worse, if you need to
support multiple charting backends (Vega-Lite for composition, ECharts
for interactivity, Chart.js for lightweight embedding), **every prompt,
every example, every post-processing rule must be duplicated per
backend** — multiplying the brittleness.

**Flint-chart** is a library that moves design knowledge out of your
prompts and into deterministic code. Instead of generating low-level
charting code, your agent outputs a minimal semantic description: chart
type, field assignments, and a **semantic type** per field (e.g.,
`Revenue`, `Rank`, `CategoryCode`). Flint-chart's compiler
deterministically derives all low-level parameters — axis sizing,
zero-baseline behavior, formatting, color schemes, bespoke mark
templates — producing charts that look good *and* stay editable without
calling your agent again. The quality is consistent because it comes from
the library, not from the model.

Because the semantic layer is **library-agnostic**, the same spec compiles
to multiple rendering backends — Vega-Lite, ECharts, and Chart.js
today, with Plotly or D3 tomorrow — without re-deriving any design rules
and without duplicating any prompts. The expensive work (semantic
reasoning, layout computation) is done once; only the final instantiation
step differs per backend.

---

## The Problem

### What you deal with today

You're building an agent that needs to create charts. Maybe it's a data
analysis copilot, a dashboard generator, or an automated reporting
pipeline. At some point your agent has to produce a visualization — and
that's where the brittleness starts.

The typical approach: your agent generates Vega-Lite (or ECharts options,
or Plotly traces) directly. You write prompt templates with examples,
add post-processing logic for edge cases, build retry loops for malformed
output. It works for your demo. Then real users arrive with real data,
and the charts break in ways you didn't anticipate.

Here is what goes wrong:

1. **Inconsistency across runs.** Your agent produces variable output
   quality — incorrect encodings, broken layouts, poor aesthetic defaults.
   You tune prompts for one chart type and break another. Even with
   detailed prompts specifying exact sizing rules, formatting conventions,
   and encoding guidelines, **your agent may or may not follow them** —
   and the degree of compliance varies across models, prompt versions,
   context length, and even individual runs. Weaker models (the ones you
   want to use for cost) struggle with anything beyond basic charts; even
   frontier models fail on composition, faceting, and layered designs.
   Design knowledge encoded in prompts is inherently unreliable.

2. **The quality–editability trap.** If your agent generates simple code,
   users can edit it (swap a field, change chart type) — but the chart
   looks mediocre. If your agent generates polished code, the chart looks
   great — but every user edit breaks it, forcing another round-trip to
   your agent. You can't have both, and neither option makes users happy.

3. **Expensive and slow for what it does.** Only frontier models
   *sometimes* produce correct specs for non-trivial charts, because the
   parameter space (axis types, domain settings, sizing, formatting, mark
   config) is large and inter-dependent. Even then, compliance with your
   design guidelines is probabilistic — you're paying frontier-model
   prices for output that still needs validation and retry. Your agent is
   spending its most expensive tokens on visualization plumbing instead of
   the data computation that actually matters.

4. **Ugly failure modes that you can't catch.** When your agent's output
   breaks, the chart doesn't degrade gracefully — it produces extreme
   dimensions (10,000 px wide from high-cardinality facets), crashes the
   renderer, or silently misrepresents the data. The charting library
   gives only low-level errors that neither you, your users, nor your
   agent can act on.

### The brittleness cascade

Every fix you apply to your agent's visualization pipeline creates new
problems:

| What you try | What breaks next |
|-------------|------------------|
| Add sizing logic to prompts | Hard-coded for this data shape; breaks on different cardinality |
| Add more VL examples to prompts | Token count balloons; model cost rises; unrelated examples confuse the model |
| Post-process the output (fix widths, rotate labels) | You're now maintaining VL manipulation code that couples to every chart type |
| Validate output and retry on failure | More LLM calls, more latency, more cost; retry loops don't fix *semantic* errors (wrong encoding type) |
| Constrain output with JSON schema | Schema can enforce structure but not *correctness* — `{"type": "quantitative"}` is valid JSON for a CategoryCode field but produces a meaningless chart |
| Support a second charting library (e.g., ECharts for interactivity) | All your prompt templates, post-processing, and validation must be duplicated for the new API |

This is the **agent developer's treadmill**: you keep patching
visualization edge cases instead of building the data analysis features
that differentiate your product.

### Why the obvious approaches don't work

#### Approach 1: Have your agent generate minimal VL (rely on defaults)

**Result: The spec is simple and editable, but the charts look bad —
and bespoke charts are impossible.**

This is the "keep it simple" approach: your agent generates just field
names, mark type, and data. The spec is easy for users to edit — swap a
field name and the chart re-renders. But the *quality* of what renders is
poor, because VL's defaults are generic heuristics that ignore both data
characteristics and semantic meaning.

**Sizing failures** — the chart is the wrong size for the data:

| Scenario | VL default | What's wrong |
|----------|-----------|-------------|
| **Bar chart, 80 products** | `step: 20` → 1600 px wide | Overflows any container. Forces horizontal scrolling; unusable without a giant monitor. |
| **Grouped bar, 30 × 5** | 30 × 5 × 20 = 3000 px | Grouped bars multiply the problem: each product group has 5 sub-bars at 20 px each. |
| **Bars on temporal X (daily)** | VL doesn't auto-band temporal | Bars overlap or collapse to 1 px. Temporal axes are continuous; VL has no step-based sizing for them. |
| **Line chart, 15 series** | Fixed `height: 300` | 15 lines in 300 px → ~20 px per series. Unreadable spaghetti. |
| **Scatter, 2000 points** | Fixed 400 × 300 | Total mark area (156K px²) exceeds canvas area (120K px²). A solid blob. |
| **80 product labels** | No auto-rotation | Labels overlap into an unreadable smear. |

**Composition makes it worse.** These problems compound — every
single-view sizing failure gets multiplied by the number of facets, and
`xOffset` (grouped bars) adds another multiplicative factor:

| Scenario | VL default | What's wrong |
|----------|-----------|-------------|
| **80 products, 4 facets** | 4 × 1600 px subplots | 6400 px total — comparison between facets is impossible because they're screens apart. |
| **Grouped bar, 30 × 5, faceted × 4** | Facet × xOffset × step all multiply | 4 facets × 30 products × 5 groups × 20 px = 12,000 px. No way to express "fit everything within 800 px." |
| **Facet columns + subplot width** | Must hard-code both `columns` and `width` | Interdependent: 4 columns → each subplot 190 px (unreadable). 2 columns → wider but taller. VL has no coordination mechanism. |

**Semantic failures** — the chart misrepresents the data:

The same number can mean completely different things, and VL defaults
can't tell the difference.

`17329487239` could be a **Unix timestamp**, a **Customer ID**, **Revenue
($)**, or a **sensor reading** — each requiring different encoding type,
zero behavior, formatting, and color scheme. VL sees a number and defaults
to `quantitative`. If it's a customer ID, you get a continuous axis from
0 to 17 billion with a single dot. If it's a timestamp, you get raw
numbers instead of dates.

`1, 2, 3, 4, 5` could be **Rank**, **Star rating**, **Quantity**,
**Category code** (1=North, 2=South…), or a **Likert score** — each
needing different zero behavior, scale direction, tick formatting, and
chart compatibility. VL treats all as `quantitative, zero: true,
ascending`. For Rank, this means rank 1 (best) at the bottom, zero
wasted, ticks at "2.5" — absurd.

You can't solve this in your agent's prompt or in post-processing.
Simple heuristics don't help: Rank, Rating, Quantity, Category code,
and Likert are all integers with identical cardinality. The only way to
know the correct encoding is to know what the data *means*.

**Bespoke charts are out of reach.** This approach can't produce bump
charts, candlestick charts, streamgraphs, waterfall charts, or radar
plots. Minimal VL generation only covers basic bar / line / scatter / area.

**Bottom line:** The simple approach keeps your agent cheap and fast, but
your users get wrong-sized, semantically misleading charts limited to
basic types.

#### Approach 2: Have your agent generate polished VL

**Result: The charts look great once, but every user edit breaks them —
and your agent gets called for every interaction.**

This is the "invest tokens in quality" approach. Your agent generates
detailed VL with tuned sizing, formatting, and encoding. It achieves
quality precisely by **hard-coding values tuned to the current data**:

| Hard-coded value | Breaks when… |
|------------------|-------------|
| `"width": 800` | User filters to 5 products (massive empty bars) or adds 200 (unreadable) |
| `"labelAngle": -45` | User swaps X to Region (3-letter labels don't need rotation) |
| `"domain": [0, 950000]` | User swaps Y to Temperature (wrong by 6 orders of magnitude) |
| `"mark.size": 8` | User switches to scatter with 1000 points (dots overlap completely) |
| `"scale.zero": true` | User swaps Y to Rank (zero-based rank wastes space, reads inverted) |
| `"format": "$,.0f"` | User swaps Y to Percentage (shows "$48" instead of "48%") |

The better your agent's output, the *more* hard-coded constants it
contains, and the *harder* the chart is to edit. This creates a vicious
cycle: **high-quality generation → brittle spec → forced regeneration
on every edit → high cost and latency → poor exploration experience.**
As the agent developer, you're paying for this cycle in API costs, user
frustration, and engineering time spent on retry logic.

**The parameters live at different levels and must coordinate.** A polished
VL spec scatters its configuration across multiple layers that all couple
to each other:

| Level | Examples | Coordinates with |
|-------|---------|-----------------|
| **Global** | `width`, `height`, `autosize`, `padding` | Step size, facet columns, mark size |
| **Per-axis** | `scale.zero`, `scale.domain`, `scale.type`, `axis.format`, `axis.labelAngle` | Global width (label overflow), mark type (zero behavior), encoding type |
| **Per-mark** | `mark.size`, `mark.strokeWidth`, `mark.opacity` | Global dimensions (overlap), data cardinality |
| **Composition** | `facet.columns`, `resolve.scale`, `xOffset.step` | Global width (subplot size), per-axis step (bar width), label config |

Editing any one parameter without adjusting the others produces a
broken chart. Change `width` from 800 to 400? The label angle, step
size, and font size were tuned for 800 — now labels overlap. Add a
facet column? The per-subplot width halves, so bars become unreadable
unless you also shrink the step, rotate labels, and adjust font size.
Switch from bar to scatter? `scale.zero`, `mark.size`, and `domain`
all need updating, but `width` and `labelAngle` might also change
because scatter points have different spatial needs than bars.

This coordination is **the core brittleness problem for agent developers.**
You can't encode it in a prompt. A rule-based post-processor would need
to enumerate the full cross-product of parameter interactions. Neither is
practical — which is why every edit becomes another LLM call from your
agent.

**Structural rewrites are the worst case.** Swapping Product→Year and
Revenue→Rank transforms a bar chart into a bump chart: the mark changes
from bar to line+circle (layered), X type changes from nominal to ordinal,
Y gets reversed with `zero: false` and domain padding, a color channel
appears, and width/height both change. No single-parameter edit path
exists — it's a complete structural rewrite.

**The alternative: call your agent for every edit.** This works, but:

- **Expensive for you.** ~500–1000 tokens per call × 10–15 edits in a
  session = significant API cost. Each call takes 2–5 seconds.
- **Forces you to use expensive models.** Only frontier models reliably
  handle bespoke charts with their layered marks, data transforms, and
  complex scale configurations.
- **The $F \times C$ combinatorial problem.** With 15 fields and 5 chart
  types, there are 75 possible configurations. Your agent handles each one
  individually — dozens of calls per exploration session.

**Bottom line:** Polished VL generation looks good once, but the spec is
too complex to edit, and regeneration per edit is slow, expensive, and
requires frontier models.

---

## The Solution

The core insight: **design knowledge belongs in the library, not in your
prompts.** Your agent may or may not follow a detailed prompt — and even
when it does, the result varies across models and runs. Flint-chart
eliminates this uncertainty by encoding all visualization design decisions
in deterministic code. Your agent generates a minimal spec, and the
library handles everything else — consistently, every time, regardless of
which model produced the spec.

### What your agent does differently

- **A simple output contract.** Your agent outputs a small JSON: chart
  type, field assignments, and a semantic type per field. No axis config,
  no sizing, no formatting, no mark layering. This is easy for any model
  to produce reliably — even cheap, fast models. The contract is small
  enough that compliance is near-certain, unlike detailed prompts with
  dozens of design rules that models follow inconsistently.

- **Automatic, consistent quality.** The library compiles that JSON into
  a polished chart with correct sizing, formatting, zero-baseline
  behavior, color schemes, and label handling — every time, deterministically.
  The design knowledge is built into the compiler, not hoped for from the
  model. Your agent doesn't need to know Vega-Lite (or ECharts, or
  Chart.js) at all.

- **User edits without calling your agent.** Users can swap fields, change
  chart types, add facets — and the chart re-derives all low-level config
  automatically. **90% of edits need zero LLM calls.** Your agent is only
  invoked for the initial chart creation and for data transformations.

- **Bespoke charts at no extra prompt cost.** Grouped bars, bump charts,
  streamgraphs, candlesticks, ridge plots — they all take the same ~7-line
  spec as a basic bar chart. The templates in the library handle the mark
  layering, custom transforms, and specialized encodings.

- **Actionable error messages.** When a chart configuration is wrong, the
  library produces semantic explanations (*"Pyramid chart requires exactly
  2 categories; 'Region' has 5"*) that your agent can read and repair —
  no VL stack traces, no silent misrepresentation.

- **Multi-backend output from one spec.** The same semantic spec compiles
  to Vega-Lite, ECharts, or Chart.js. Your deployment context
  picks the backend; your agent and your prompts don't change.

- **The generated output is still accessible.** Flint-chart compiles to
  standard Vega-Lite (or ECharts options, or Chart.js configs). If a user
  needs to fine-tune a specific visual detail, they can edit the generated
  output directly. The library handles the 98% of decisions derivable from
  semantics; users override the remaining 2%.

### At a glance

| Property | Approach 1 (defaults) | Approach 2 (polished VL) | Flint-chart |
|----------|-----------------------|--------------------------|--------------|
| **Looks good** | ✗ | ✓ | ✓ |
| **Editable** | ✓ (simple spec) | ✗ (brittle, hard-coded) | ✓ (semantic spec) |
| **Bespoke charts** | ✗ | Sometimes (frontier model) | ✓ (templates) |
| **Cost per user edit** | 0 (no agent call) | 1 agent call ($, latency) | 0 (no agent call) |
| **Agent complexity** | Low (just fields + mark) | High (coordinate 10–30 params) | Low (fields + semantic types) |
| **Model requirement** | N/A | Frontier for bespoke | Any (classification only) |

### How your agent integrates

```
1. Your agent generates:  chart spec  +  semantic types for each field
                          (small JSON)    (e.g., Revenue, Year, Company)
   └─→ This is what your agent's prompt produces. ~7–12 lines.
   └─→ No VL knowledge, no sizing, no formatting.

2. User edits to explore:  swap field / change chart type / add facet
   └─→ flint-chart re-derives all config from semantic types  (NO agent call!)
   └─→ Chart looks good automatically  (98% of edits)

3. (Rare) Fine-tune:  user asks agent to edit underlying VL/ECharts
                       for detailed style customization  (2% of edits)
```

The chart spec is intentionally minimal — a small
JSON object returned alongside the data transformation code, so that
precious tokens go where they matter most: data computation and
transformation, not visualization plumbing.

---

## System Architecture

### Design Principles

1. **VL-free analysis.** Layout computation, overflow filtering, and
   semantic resolution operate on abstract channel names (`x`, `y`,
   `color`, `group`, `size`) — never on Vega-Lite encoding objects.
   This keeps the core logic backend-agnostic.

2. **Minimal spec surface.** The input is: chart type + field assignments +
   semantic types (~7–12 lines). The compiler derives all low-level
   parameters deterministically.

3. **Templates absorb VL complexity.** Bespoke charts (lollipop, bump,
   candlestick, waterfall, etc.) are defined as template skeletons with
   an `instantiate()` hook. The user/LLM never touches layered marks,
   custom transforms, or scale configurations.

4. **No UI dependencies.** Zero React, Redux, or framework imports.
   Pure TypeScript library usable from any context.

### Two-Stage Pipeline

Each backend has its own `assemble*()` entry point (`assembleVegaLite`,
`assembleECharts`, `assembleChartjs`), but they all
follow the same two-stage structure. The analysis stage is shared;
only the instantiation stage is backend-specific.

```
assembleVegaLite(input: ChartAssemblyInput)   // or assembleECharts, assembleChartjs
       │
       ▼
 ══ ANALYSIS (backend-free, shared core) ═════════════════════
       │
       ├── Phase 0:  resolveSemantics()     → ChannelSemantics
       │     Infers encoding type, zero-baseline, color scheme,
       │     format, aggregation default, scale type, domain,
       │     temporal format for each channel from semantic types
       │     + data characteristics.
       │
       ├── Step 0a:  template.declareLayoutMode()  → LayoutDeclaration
       │     Template hook: declares axis flags (banded?),
       │     type overrides, param overrides, overflow strategy.
       │
       ├── Step 0b:  convertTemporalData()  → converted data
       │     Parses temporal string values into Date objects.
       │
       ├── Step 0c:  filterOverflow()       → OverflowResult
       │     Truncates discrete channels that exceed the canvas
       │     budget. Produces filtered data, nominal counts,
       │     truncation warnings.
       │
       └── Phase 1:  computeLayout()        → LayoutResult
             Computes subplot width/height, step sizes, label
             sizing, facet columns/rows. Uses spring model for
             banded axes, gas-pressure model for continuous axes.
       │
       ▼
 ══ INSTANTIATE (backend-specific) ═══════════════════════════
       │
       ├── build*Encodings()                        (per backend)
       │     Translates abstract channel semantics into
       │     backend encoding objects.
       │
       ├── template.instantiate()
       │     Template-specific spec construction.
       │     (e.g., pie remaps size→theta, bar adjusts marks)
       │
       ├── restructureFacets()                      (VL/ECharts)
       │     Restructures column/row into facet spec for
       │     layered charts. Computes facet columns.
       │
       ├── applyLayoutToSpec()
       │     Applies width/height/step/config/formatting from
       │     LayoutResult to the backend spec.
       │
       └── Post-layout adjustments
             Facet binning, independent y-scales, tooltips.
       │
       ▼
   Return: complete backend spec + warnings
```

The compiler operates in three conceptual phases. Phases 0 and 1 contain
~90% of the design logic and are **identical across all backends**. Phase 2
is a thin translation layer — typically 50–100 lines per chart type.

```
Phase 0 (shared):  Resolve semantic types → encoding types, zero behavior,
                   formatting, color schemes, sort order
Phase 1 (shared):  Compute layout → spring/pressure model → canvas size,
                   step sizes, label rotation, overflow warnings
Phase 2 (per-backend):  Instantiate → translate layout into VL spec,
                        ECharts option, or Chart.js config
```

Three design decisions make this architecture work: semantic types as the
contract between your agent and the library (Phase 0), parametric physics
for layout (Phase 1), and a library-agnostic multi-backend framework
(Phase 2).

---

## How It Works

### 1. Semantic types as the contract

The root cause of your agent's brittleness is that charting APIs scatter
the semantic contract between data and chart across dozens of low-level
parameters. Consider a column containing `17234982372` — it could be a
Unix timestamp, a monetary value, a serial number, or a group ID. Today,
your agent must decide the encoding type (`temporal`, `quantitative`,
`nominal`), set axis formatting, configure zero-baseline behavior, choose
sizing — and these become hard-coded constants in the output that break
when the user edits anything.

**The fix:** instead of asking your agent to set these low-level details,
ask it to communicate one thing: **what does this data mean?** — expressed
through a fine-grained semantic type system (e.g., `Revenue`, `Rank`,
`Temperature`, `Year`). From the semantic type plus data characteristics
(cardinality, range, distribution), flint-chart's compiler automatically
derives everything:

```
Semantic type
    ↓
    ├── Encoding type     (Revenue → quantitative, Rank → ordinal, Month → ordinal)
    ├── Zero baseline     (Revenue → true, Temperature → false, Rank → false)
    ├── Domain padding    (Rank → 8%, Temperature → 5%, Revenue → 0%)
    ├── Scale direction   (Rank → reversed, others → normal)
    ├── Axis formatting   (Revenue → "$,.0f", Percentage → ".0%", Year → "%Y")
    ├── Sort order        (Month → calendar order, Product → by value)
    ├── Color scheme      (Company → categorical, Revenue → sequential)
    └── Sizing model      (nominal → spring, quantitative → per-axis stretch)
```

Your agent's only job is **semantic classification** — assigning a type
like `"Revenue"`, `"Rank"`, `"Temperature"`, or `"Month"` to each data
field. This is one of the easiest tasks for any LLM (even small, fast
models do it reliably).

**Semantic types survive user edits.** When the user swaps Y from
Revenue to Temperature, flint-chart re-derives all parameters from
`"Temperature"` instead of `"Revenue"` and gets the right answer. No
hard-coded constant goes stale because there are no hard-coded constants.
**Your agent is not called.**

**The $F \times C$ problem becomes $F + C$.** Your agent classifies each
field once ($F$ decisions), the user picks a chart type ($C$ choices),
and flint-chart handles the cross-product. Instead of 75 configurations
that each need an agent call, the system needs 15 type assignments (done
once) and handles all 75 deterministically.

→ Full semantic type system details:
[design-semantics.md](design-semantics.md)

### 2. Parametric physics instead of manual heuristics

The layout challenge is **coordinating sizing across axes, layers, mark
types, and facets** — parameters that are deeply interdependent (e.g.,
facet count affects subplot width, which affects bar width, which affects
label rotation).

The conventional approach — whether done by your agent, by hand-coded
post-processing, or by the charting library's defaults — is
**heuristic-based**: a pile of if/else rules and magic numbers
(`if bars > 30, rotate labels; if width > 800, shrink step`). These
heuristics are brittle because they don't compose: every new chart type,
every new facet structure, every new mark combination requires new rules.
You're always guessing thresholds, and the guesses break on data shapes
you didn't anticipate.

Flint-chart replaces this with a **parametric physics-inspired model**.
Instead of guessing layout constants, you control the system through a
small set of physics parameters with intuitive physical meaning:

| Parameter | Physical meaning | What it controls |
|-----------|-----------------|------------------|
| $\ell_0$ (rest length) | Natural spacing between items when unconstrained | Default bar/cell width before any compression |
| $k$ (spring stiffness) | Resistance to compression | How aggressively items shrink to fit the canvas |
| $\ell_{\min}$ (min length) | Hard floor — items never compress below this | Minimum readable bar/cell width |
| $W_{\max}$ (max canvas) | Maximum allowed canvas width | Upper bound on chart dimensions |
| $\beta_f$ (facet stretch) | How much extra canvas a facet adds | Trade-off between subplot density and total chart width |
| $P$ (pressure) | Outward force from continuous data density | How much a dense scatter/line plot stretches its canvas |

These parameters **compose naturally**. A faceted grouped bar chart doesn't
need special-case rules — the spring model runs per subplot, facet stretch
adjusts the container, and the parameters interact through the same physics
equations regardless of chart type. Change one parameter (e.g., raise
$\ell_{\min}$ to guarantee wider bars) and the system re-equilibrates
automatically — no cascade of broken heuristics.

**Spring Model (Discrete Axes).** Applies to banded marks (bar, histogram,
heatmap, boxplot, grouped bar). Models the axis as $N$ springs in a box:

$$\ell = \frac{\kappa \cdot \ell_0 + L_0 / N}{1 + \kappa}$$

Three regimes: **Fits** (items at natural size), **Elastic** (items
compress + axis stretches), **Overflow** (items at minimum, excess
truncated).

**Gas-Pressure Model (Continuous Axes).** Applies to positional marks
(scatter, line, area, bump). Each axis stretches based on 1D crowding
pressure:

$$s = \min\!\big(1 + \beta_c,\; p^{\,\alpha_c}\big)$$

Two pressure modes: **positional** (unique pixel positions × √σ / dim)
and **series-count** (nSeries × σ / dim for line/area Y axes).

**Facet Model.** Second-level stretch for faceted charts. Each subplot
runs its own sizing model internally; the facet layer determines subplot
count, columns, and overall canvas growth.

→ Full layout model details:
[design-stretch-model.md](design-stretch-model.md)

### 3. Library-agnostic multi-backend architecture

Both semantic types and physics-based sizing are **library-agnostic** —
they reason about data meaning and visual density, not about any
particular charting API. This means the same compiler logic targets
multiple rendering backends without re-deriving the design rules.

As an agent developer, you may need to deploy to different contexts —
a lightweight mobile app, a desktop analytics tool, a static report.
No single charting library fits all of them:

| Backend | Strengths | Weaknesses |
|---------|-----------|------------|
| **Vega-Lite** | Grammar of graphics; declarative composition; strong faceting and layering | Heavy runtime (~400 KB); limited interactivity beyond tooltips; poor mobile performance |
| **ECharts** | Rich interactivity (zoom, brush, dataZoom); Canvas + SVG dual renderer; strong CJK locale support | Imperative option-bag API; no grammar-of-graphics composition; verbose config for layered designs |
| **Chart.js** | Lightweight (~60 KB); Canvas-native (fast for large datasets); simple API; massive plugin ecosystem | No faceting; limited statistical charts; no declarative composition |

**These are not interchangeable APIs with different syntax — they use
fundamentally different visual representation models and data models.**
Adapting between them is highly non-trivial:

- **Vega-Lite** is a *grammar of graphics*: a chart is a composition of
  independent encoding channels (x, y, color, size, shape) bound to data
  fields through scales. Layering and faceting are declarative
  compositional operators. Data flows through a transform pipeline into
  a single flat table.

- **ECharts** is an *option bag*: a chart is a top-level config object
  with `series[]` arrays, each containing its own data, mark type, and
  axis bindings. There are no encoding channels — you configure axis
  objects directly and reference them by index. Layering means adding
  series entries; faceting has no native concept.

- **Chart.js** is a *dataset-oriented canvas renderer*: a chart has a
  single chart type, a `labels` array for the categorical axis, and
  `datasets[]` with parallel value arrays. There is no independent
  encoding model — color, border, and point style are per-dataset
  properties, not data-driven channels. Composition beyond basic
  stacking doesn't exist.

These differences mean you can't transliterate a spec from one library
to another — you must *re-think* the chart in each library's conceptual
model. Without a backend-agnostic library, supporting multiple renderers
means **duplicating your entire agent pipeline per backend** — prompts,
examples, post-processing, validation, retry logic, sizing heuristics.
This is the $B \times T \times R$ explosion: $B$ backends × $T$
templates × $R$ rules.

**Flint-chart collapses this to $T + (B \times I)$.** The $T$ templates
and $R$ rules live in shared Phases 0–1, and each backend only implements
$I$ instantiation functions — thin translators that map the
already-computed layout into the target library's config format. Adding a
new backend means writing instantiation code, not re-implementing the
design system.

**What this means for you:**

- **Deployment flexibility.** A mobile app uses Chart.js (60 KB); a
  desktop analytics tool uses Vega-Lite (full composition). Your agent
  generates one spec; the deployment target picks the backend.

- **Capability coverage.** Radar and gauge charts are native in ECharts
  but missing from Vega-Lite. Faceted compositions are native in Vega-Lite
  but painful in Chart.js. Flint-chart routes each chart type to the
  backend that handles it best — your agent doesn't need to know which.

- **Rendering trade-offs handled for you.** Canvas renderers handle 10K+
  points without DOM pressure; SVG renderers produce crisper output for
  publication. The choice depends on dataset size — not on your prompts.

- **Vendor independence.** When flint-chart is the contract — not the
  backend API — swapping or upgrading a renderer is a localized change,
  not a rewrite of your entire pipeline.

- **New backends are easy to add — even by coding agents.** Adding a
  backend is a *mechanical translation* task: given the computed layout
  and a target library's API, write the instantiation functions. This
  is exactly what coding agents (Copilot, Cursor, Codex) excel at — they
  can scaffold a new backend from existing ones as reference. Developers
  and designers then enhance the generated adapters with domain-specific
  design knowledge: animation defaults, theme integration, accessibility,
  or library-specific optimizations. The result is a
  **human-in-the-loop backend pipeline** where the mechanical work is
  automated and design expertise is applied where it matters most.

### 4. Error handling

When your agent generates raw VL and the chart fails, failures are either
**catastrophic** (the chart crashes or renders at 2000 px × 80 px) or
**silent** (the chart misrepresents the data). VL gives only low-level
errors that neither your agent nor your user can act on.

With flint-chart, your agent gets **structured, semantic error messages**
that it can parse and repair automatically.

**Semantic validation — flint-chart catches errors before rendering:**

| Violation | What flint-chart detects | What raw VL does |
|-----------|--------------------------|-----------------|
| **Chart–data incompatibility** | *"Pyramid chart requires exactly 2 categories; 'Region' has 5"* | Renders a broken layered bar chart. No error. |
| **Redundant encoding** | *"Revenue is mapped to both Y and color — color adds no information"* | Renders silently with a meaningless gradient legend. |
| **Field–channel mismatch** | *"Product has 80 values — too many for a color encoding"* or *"Group is a CategoryCode — use nominal, not quantitative"* | Renders 80 indistinguishable colors, or maps numeric categories to a continuous gradient. No warning. |
| **Missing required encoding** | *"Candlestick chart requires Open, High, Low, Close fields"* | Crashes or renders partial marks. No explanation. |

**Overflow detection — flint-chart explains *why* a chart was clipped:**

| Scenario | Flint-chart response | Raw VL result |
|----------|----------------------|---------------|
| **80 products × 4 facets** | *"X axis clipped: 80 products compressed from 20 px to 8 px per bar; canvas stretched to 800 px (max). Consider filtering to top 20."* | 6400 px wide, or 400 px with 5 px bars. No explanation. |
| **720 temporal cells** | *"Heatmap X axis: 720 hourly cells compressed to 1.1 px each. Consider aggregating to daily."* | 14,400 px wide, or 0.5 px cells — a solid color band. |
| **50 facets × 10 categories** | *"Facet overflow: 50 subplots cannot fit readable bars. Showing top 12 facets; 38 truncated."* | 50 squished facets with 0.8 px bars. Technically renders but useless. |

---

## Abstract Channels

The library defines its own channel vocabulary, distinct from VL encoding
channels. This decouples user/AI intent from rendering specifics.

| Channel | Purpose | VL translation |
|---------|---------|----------------|
| `x`, `y` | Positional axes | Direct mapping |
| `x2`, `y2` | Range endpoints (ranged dot, waterfall) | Direct mapping |
| `color` | Color encoding | Direct mapping |
| `group` | Grouped subdivision (e.g., grouped bar) | VL `color` + `xOffset`/`yOffset` |
| `size` | Mark size (scatter) or slice weight (pie) | Scatter: VL `size` with sqrt scale; Pie: VL `theta` |
| `shape` | Mark shape | Direct mapping |
| `opacity` | Opacity | Direct mapping |
| `column`, `row` | Faceting | VL `facet`/`column`/`row` |
| `detail` | Detail level without visual change | Direct mapping |
| `latitude`, `longitude` | Geo coordinates | Direct mapping |
| `open`, `high`, `low`, `close` | Candlestick price channels | Layered rule + rect encoding |
| `radius` | Radar chart radius | VL `radius` with sqrt scale |

### The `group` channel

First-class channel for grouped bar charts. The analysis stage resolves
its semantics (type, color scheme) without any VL knowledge. The grouping
axis is auto-detected: whichever of `x`/`y` is discrete gets subdivided.

During instantiation, `buildVLEncodings()` translates:
- `group` → VL `color` encoding (for coloring)
- `group` → VL `xOffset` or `yOffset` encoding (for position subdivision)

This avoids the old `additionalEncodings` hack and keeps the analysis
stage completely VL-free.

### The `size` channel

Abstract channel for two distinct visual mappings:
- **Scatter plot**: maps to VL `size` with adaptive `sqrt` scale range
  based on canvas area and point count.
- **Pie chart**: `pie.ts` instantiate remaps `size` → VL `theta`,
  stripping the sqrt scale (theta is linear area).

---

## Core Types

### `ChannelSemantics`

Phase 0 output for a single channel. Combines user input with resolved
decisions. This is the central IR — all four backends read the same
`ChannelSemantics` record.

```typescript
interface ChannelSemantics {
    // --- Identity ---
    field: string;
    semanticAnnotation: SemanticAnnotation;

    // --- Encoding type ---
    type: 'quantitative' | 'nominal' | 'ordinal' | 'temporal';

    // --- Formatting ---
    format?: FormatSpec;
    tooltipFormat?: FormatSpec;
    temporalFormat?: string;

    // --- Aggregation ---
    aggregationDefault?: 'sum' | 'average';

    // --- Scale ---
    zero?: ZeroDecision;
    scaleType?: 'linear' | 'log' | 'sqrt' | 'symlog';
    nice?: boolean;
    domainConstraint?: DomainConstraint;
    tickConstraint?: TickConstraint;

    // --- Ordering ---
    ordinalSortOrder?: string[];
    cyclic?: boolean;
    reversed?: boolean;
    sortDirection?: 'ascending' | 'descending';

    // --- Color ---
    colorScheme?: ColorSchemeRecommendation;

    // --- Histogram ---
    binningSuggested?: boolean;

    // --- Stacking ---
    stackable?: 'sum' | 'normalize' | false;
}
```

21 fields total (2 required: `field`, `type`; plus `semanticAnnotation`).

### `LayoutDeclaration`

Template's layout intent, returned by `declareLayoutMode()`:

```typescript
interface LayoutDeclaration {
    axisFlags?: {
        x?: { banded: boolean };
        y?: { banded: boolean };
    };
    resolvedTypes?: Record<string, 'nominal' | 'ordinal' | 'quantitative' | 'temporal'>;
    paramOverrides?: Partial<AssembleOptions>;
    binnedAxes?: Record<string, boolean | { maxbins?: number }>;
    overflowStrategy?: OverflowStrategy;
}
```

No `grouping` field — grouping is auto-detected from `channelSemantics.group`
+ which axis is discrete.

No `additionalEncodings` — the `group` channel + auto-detection replaces
the old approach entirely.

### `LayoutResult`

Phase 1 output — all layout decisions:

```typescript
interface LayoutResult {
    subplotWidth: number;
    subplotHeight: number;
    xStep: number;
    yStep: number;
    xStepUnit?: 'item' | 'group';
    yStepUnit?: 'item' | 'group';
    xContinuousAsDiscrete: number;
    yContinuousAsDiscrete: number;
    xNominalCount: number;
    yNominalCount: number;
    xLabel: LabelSizingDecision;
    yLabel: LabelSizingDecision;
    facet?: { columns: number; rows: number; subplotWidth: number; subplotHeight: number };
    truncations: TruncationWarning[];
}
```

### `InstantiateContext`

Everything a template's `instantiate()` receives:

```typescript
interface InstantiateContext {
    channelSemantics: Record<string, ChannelSemantics>;
    layout: LayoutResult;
    table: any[];
    resolvedEncodings: Record<string, any>;  // VL encoding objects
    encodings: Record<string, ChartEncoding>;
    chartProperties?: Record<string, any>;
    canvasSize: { width: number; height: number };
    semanticTypes: Record<string, string>;
    chartType: string;
}
```

### `ChartTemplateDef`

Template definition — pure data, no UI dependencies:

```typescript
interface ChartTemplateDef {
    chart: string;                           // display name
    template: any;                           // VL spec skeleton
    channels: string[];                      // available encoding channels
    markCognitiveChannel: MarkCognitiveChannel;  // 'position' | 'length' | 'area' | 'color'

    declareLayoutMode?: (cs, data, props) => LayoutDeclaration;
    instantiate: (spec, context: InstantiateContext) => void;
    properties?: ChartPropertyDef[];
}
```

### `OverflowStrategy`

Customizable per-template. The default strategy in `filter-overflow.ts` handles:
connected marks (keep all for continuity), user sorts, auto-sorts,
bar sum-aggregate, numeric sort, first-N.

```typescript
type OverflowStrategy = (
    channel: string,
    fieldName: string,
    uniqueValues: any[],
    maxToKeep: number,
    context: OverflowStrategyContext,
) => any[];
```

---

## Semantic Type System

Semantic types classify fields by what they *mean* (not just their data
type), organized in a three-tier hierarchy (T0 → T1 → T2):

```
T0 Family        T1 Category           T2 Types (examples)
─────────        ───────────           ──────────────────
Temporal ────┬── DateTime ──────────── DateTime, Date, Time, Timestamp
             ├── DateGranule ────────── Year, Quarter, Month, Week, Day, Hour, ...
             └── Duration ──────────── Duration

Measure ─────┬── Amount ────────────── Amount, Price, Revenue, Cost
             ├── Physical ──────────── Quantity, Temperature
             ├── Proportion ────────── Percentage
             ├── SignedMeasure ──────── Profit, PercentageChange, Sentiment, Correlation
             └── GenericMeasure ────── Count, Number

Discrete ────┬── Rank ──────────────── Rank
             ├── Score ─────────────── Score, Rating
             └── Index ─────────────── Index

Geographic ──┬── GeoCoordinate ─────── Latitude, Longitude
             └── GeoPlace ──────────── Country, State, City, Region, ZipCode, Address

Categorical ─┬── Entity ────────────── PersonName, Company, Product, Category, Name, ...
             ├── Coded ─────────────── Status, Type, Boolean, Direction
             └── Binned ────────────── Range, AgeGroup

Identifier ──┴── ID ────────────────── ID
```

**46 registered types** across 6 T0 families and 17 T1 categories.

Each type entry in the registry carries orthogonal dimensions that drive
visualization decisions:
- **visEncodings** — encoding type candidates (quantitative, ordinal, nominal, temporal)
- **aggRole** — aggregation role (`additive`, `intensive`, `signed-additive`, `dimension`, `identifier`)
- **domainShape** — domain shape (`open`, `bounded`, `fixed`, `cyclic`)
- **diverging** — diverging nature (`none`, `conditional`, `inherent`)
- **formatClass** — format class (`currency`, `percent`, `unit-suffix`, `date`, `integer`, `plain`, ...)
- **zeroBaseline** — zero baseline policy (`meaningful`, `arbitrary`, `contextual`, `none`)
- **zeroPad** — domain padding fraction

→ Full details: [design-semantics.md](design-semantics.md)

---

## Template Catalog

### Vega-Lite (29 chart types)

| Category | Charts |
|----------|--------|
| **Scatter & Point** | Scatter Plot, Regression, Ranged Dot Plot, Boxplot, Strip Plot |
| **Bar** | Bar Chart, Grouped Bar Chart, Stacked Bar Chart, Histogram, Heatmap, Lollipop Chart, Pyramid Chart |
| **Line & Area** | Line Chart, Bump Chart, Area Chart, Streamgraph |
| **Part-to-Whole** | Pie Chart, Rose Chart, Waterfall Chart |
| **Statistical** | Density Plot, Candlestick Chart, Radar Chart |
| **Map** | US Map, World Map |

### ECharts (27 chart types)

| Category | Charts |
|----------|--------|
| **Scatter & Point** | Scatter Plot, Regression, Ranged Dot Plot, Boxplot, Strip Plot |
| **Bar** | Bar Chart, Grouped Bar Chart, Stacked Bar Chart, Histogram, Heatmap, Lollipop Chart, Pyramid Chart |
| **Line & Area** | Line Chart, Bump Chart, Area Chart, Streamgraph |
| **Part-to-Whole** | Pie Chart, Funnel Chart, Treemap, Sunburst Chart |
| **Polar** | Radar Chart, Rose Chart |
| **Financial** | Candlestick Chart |
| **Indicator** | Gauge Chart |
| **Flow** | Sankey Diagram |
| **Other** | Waterfall Chart, Density Plot |

### Chart.js (10 chart types)

| Category | Charts |
|----------|--------|
| **Scatter & Point** | Scatter Plot |
| **Bar** | Bar Chart, Grouped Bar Chart, Stacked Bar Chart, Histogram |
| **Line & Area** | Line Chart, Area Chart |
| **Part-to-Whole** | Pie Chart |
| **Polar** | Radar Chart, Rose Chart |

**68 template definitions** across 3 backends.

Each template defines:
1. **`template`** — spec skeleton (mark + encoding structure)
2. **`channels`** — available encoding channels
3. **`markCognitiveChannel`** — how the mark encodes value (`position`, `length`, `area`, `color`)
4. **`declareLayoutMode()`** — optional hook for layout intent
5. **`instantiate()`** — build final backend spec from resolved context

---

## Public API

All backends share the same input type (`ChartAssemblyInput`)
and follow the same calling convention:

```typescript
import { assembleVegaLite, assembleECharts, assembleChartjs } from './lib/flint-chart';

const input: ChartAssemblyInput = {
    chartType: 'Scatter Plot',
    encodings: { x: { field: 'weight' }, y: { field: 'mpg' }, color: { field: 'origin' } },
    table: myData,
    semanticTypes: { weight: 'Quantity', mpg: 'Quantity', origin: 'Country' },
    canvasSize: { width: 400, height: 300 },
};

const vlSpec   = assembleVegaLite(input);  // → Vega-Lite JSON spec
const ecSpec   = assembleECharts(input);   // → ECharts option object
const cjsSpec  = assembleChartjs(input);   // → Chart.js config object
```

**`ChartAssemblyInput` fields:**
- `chartType` — template name (e.g., `"Grouped Bar Chart"`)
- `encodings` — channel → `ChartEncoding` (field, aggregate, sort, scheme).
  A bare string is shorthand for `{ field: <string> }`, so
  `{ x: 'weight', y: 'mpg' }` is equivalent to
  `{ x: { field: 'weight' }, y: { field: 'mpg' } }`. The shorthand also works
  inside static-series arrays: `{ y: ['sales', 'profit'] }`.
- `table` — array of row objects
- `semanticTypes` — field name → semantic type string (e.g., `"Revenue"`, `"Year"`)
- `canvasSize` — `{ width, height }` in pixels
- `options` — `AssembleOptions` (layout tuning, all have defaults)

**Output:** Complete backend-specific spec, ready to render.
May include `_warnings: ChartWarning[]` for overflow/truncation diagnostics.

---

## Overflow & Warning System

When discrete channels overflow the canvas budget, the library:

1. Computes the max items that fit (from spring model equilibrium)
2. Applies the overflow strategy (default or template-custom) to choose
   which values to keep
3. Filters the data to only kept values
4. Emits `TruncationWarning` with: channel, field, kept values, omitted
   count, placeholder string
5. Emits `ChartWarning` for the UI

The default overflow strategy priority:
1. Connected marks (line, area) → keep all (truncation breaks continuity)
2. User-specified sort → keep top/bottom N by sort order
3. Quantitative opposite axis → sort by opposite, keep top N
4. Bar with count aggregate → sum-aggregate and keep top N
5. Numeric field → numeric sort, keep first N
6. Fallback → keep first N in data order

---

## File Map

### Core (shared across all backends)

| File | Lines | Role |
|------|-------|------|
| `core/types.ts` | 686 | All type definitions (ChannelSemantics, ChartAssemblyInput, etc.) |
| `core/field-semantics.ts` | 1,040 | Field semantic resolution (T0/T1/T2 tiered logic) |
| `core/semantic-types.ts` | 921 | Semantic type system (hierarchy, zero decisions, color schemes) |
| `core/type-registry.ts` | 197 | Type registry (46 types, 6 T0 families) |
| `core/resolve-semantics.ts` | 476 | Phase 0: channel semantic resolution + temporal conversion |
| `core/compute-layout.ts` | 1,001 | Phase 1: backend-free layout computation |
| `core/decisions.ts` | 919 | Reusable decision functions (elastic budget, step, facet, label, gas pressure) |
| `core/filter-overflow.ts` | 296 | Phase 0c: backend-free overflow filtering |
| `core/recommendation.ts` | 1,178 | Chart recommendation engine |
| `core/index.ts` | 120 | Core re-exports |

### Vega-Lite backend

| File | Lines | Role |
|------|-------|------|
| `vegalite/assemble.ts` | 758 | VL two-stage pipeline coordinator |
| `vegalite/instantiate-spec.ts` | 719 | `applyLayoutToSpec`, `applyTooltips` |
| `vegalite/recommendation.ts` | 194 | VL-specific recommendation |
| `vegalite/templates/*.ts` | ~2,500 | 15 template files (30 chart types) |

### ECharts backend

| File | Lines | Role |
|------|-------|------|
| `echarts/assemble.ts` | 710 | ECharts two-stage pipeline coordinator |
| `echarts/instantiate-spec.ts` | 660 | ECharts spec instantiation |
| `echarts/facet.ts` | 251 | ECharts facet support |
| `echarts/recommendation.ts` | 101 | ECharts-specific recommendation |
| `echarts/templates/*.ts` | ~4,800 | 23 template files (28 chart types) |

### Chart.js backend

| File | Lines | Role |
|------|-------|------|
| `chartjs/assemble.ts` | 213 | Chart.js two-stage pipeline coordinator |
| `chartjs/instantiate-spec.ts` | 158 | Chart.js spec instantiation |
| `chartjs/recommendation.ts` | 34 | Chart.js recommendation |
| `chartjs/templates/*.ts` | ~1,400 | 8 template files (10 chart types) |

### Top-level

| File | Lines | Role |
|------|-------|------|
| `index.ts` | 60 | Public API re-exports (all backends) |

**Total: ~21,000 lines** across 87 `.ts` files (excluding test-data).

---

## Architectural Boundaries

```
┌─────────────────────────────────────────────────┐
│              ANALYSIS (core/ — backend-free)     │
│                                                  │
│  resolveSemantics  →  ChannelSemantics           │
│  declareLayoutMode →  LayoutDeclaration          │
│  convertTemporalData                             │
│  filterOverflow    →  OverflowResult             │
│  computeLayout     →  LayoutResult               │
│                                                  │
│  Inputs:  abstract channels, data, semantic types│
│  Outputs: types, decisions, layout numbers       │
│  Imports: NO backend-specific syntax             │
├─────────────────────────────────────────────────┤
│   INSTANTIATE (vegalite/ | echarts/ | chartjs/)  │
│                                                  │
│  Each backend has its own:                       │
│    build*Encodings  →  backend encoding objects   │
│    template.instantiate → backend spec            │
│    restructureFacets → backend facet structure    │
│    applyLayoutToSpec → backend config/sizing      │
│                                                  │
│  Inputs:  ChannelSemantics + LayoutResult + data │
│  Outputs: complete backend-specific spec         │
│  Backend code ONLY constructs its own syntax     │
└─────────────────────────────────────────────────┘
```

The boundary is enforced by function signatures: analysis-stage functions
accept `ChannelSemantics` and `LayoutDeclaration` — never backend encoding
objects or spec structures. All backends (Vega-Lite, ECharts,
Chart.js) share the same analysis stage and read the same
`ChannelSemantics` IR. Adding a new backend only requires implementing
the instantiation layer — no analysis code changes.

---

## In Practice: Four Examples

Four examples that progressively demonstrate the gap between your agent
generating charting code directly versus outputting a minimal semantic spec.
In every case, the flint-chart spec is the same shape: chart type + field
assignments + semantic types (~7–12 lines).

### Example 1: Simple bar chart — no advantage yet

**Task:** Bar chart of Revenue by 5 Regions.

**With flint-chart:** Chart type, two field encodings, two semantic types.

**With your agent generating VL directly:** Mark type, two field encodings
with explicit `type` annotations.

The two are nearly identical. VL's defaults happen to work: 5 bars fit
comfortably, `zero: true` is correct, alphabetical sort is acceptable.
**No win here — and that's the point.** Flint-chart isn't designed to help
with cases your agent already handles well.

### Example 2: Lollipop chart — templates eliminate prompt complexity

**Task:** Lollipop chart of Revenue by Product (top 10), colored by Group
(values: 1, 2, 3, 4, 5 — categorical groups encoded as numbers).

**With flint-chart:** Chart type = "Lollipop Chart", three field encodings
(x, y, color), three semantic types (`Revenue`, `Product`,
`CategoryCode`). Same ~10 lines as any chart.

**What your agent's prompt must produce if generating VL directly:**

| VL parameter | What and why |
|-------------|-------------|
| Layered spec structure | Must use `layer: [...]` — a lollipop is two marks, not one |
| Rule mark config | `mark.type: "rule"`, `strokeWidth`, `color` for the stem |
| Circle mark config | `mark.type: "circle"`, `size`, `color` for the dot |
| Duplicated encoding | Both layers need identical `x`, `y`, and `color` encodings |
| Sort | `sort: "-x"` on the Y axis to rank products by value |
| Zero baseline | `scale.zero: true` on the X axis (Revenue is zero-meaningful) |
| Step size | VL default step (20 px) works here for 10 items, but breaks if data grows |
| Axis formatting | `axis.format: "~s"` for compact numbers |
| Color encoding type | Group values are `1, 2, 3, 4, 5` — VL defaults to `quantitative`, producing a continuous blue gradient. Must set `"type": "nominal"` for categorical colors. |
| Color scale scheme | Must override to categorical palette (`"category10"`) — but only after fixing the type. |

The color problem is especially insidious: VL sees numbers and defaults to
`quantitative` with a sequential color scheme. Groups 1 and 2 get nearly
identical shades of blue — visually indistinguishable. The chart *renders*
without error but the color encoding is meaningless. With flint-chart,
`CategoryCode` → nominal → categorical palette, and groups get distinct
hues automatically.

### Example 3: Faceted bar chart — physics layout vs. hard-coded sizing

**Task:** Revenue by Product (80 products), faceted by Region (4 regions).

**With flint-chart:** Chart type, three field encodings (x, y, column),
three semantic types. Same ~12 lines.

**What your agent must hard-code if generating VL directly:**

| Problem | What VL requires | Why it's hard |
|---------|-----------------|---------------|
| **Canvas size** | Hard-code `width` per subplot + `columns` for facet wrap | VL default: 20 px × 80 = 1600 px per subplot → 4 facets = 6400 px total. Must override, but numbers depend on each other. |
| **Step / bar width** | Hard-code `step` or `width` | With `width: 380` for 80 bars, each bar is ~4.75 px — unreadable. Must add `labelAngle: -90`, `labelLimit: 60`, `labelFontSize: 9`. |
| **Facet wrapping** | Hard-code `columns` | 4 columns → each subplot 190 px (unreadable). 1 column → page 4× taller. The right choice depends on bar count, label length, container size. |
| **Scale resolution** | `resolve.scale.x: "independent"` | Each facet may have different products — shared scale wastes space. |

Your agent's prompt can't express these dependencies — each value must be
hard-coded, and they all break when the data changes.

With flint-chart, the spring model handles all four automatically:
- Facet stretch ($\beta_f$) determines overall canvas growth.
- Each subplot's spring model: 80 products × $\ell_0 = 20$ px overflows →
  items compress to $\ell = 8$ px, subplot stretches to fit.
- Label rotation and truncation derived from count and string lengths.
- Result: readable bars (8 px, not 2 px), controlled total width (not
  6400 px), facet columns balanced. Your agent doesn't touch any of this.

### Example 4: Heatmap with temporal × category — semantic types vs. guessing

**Task:** Heatmap of event counts — UTC timestamps (hourly, 30 days) on X,
Category (15 event types) on Y, count as color.

**With flint-chart:** Chart type = "Heatmap", three encodings (x, y,
color), three semantic types (`DateTime`, `Category`, `Count`). ~12 lines.

**What your agent must get right if generating VL directly** — 11
decisions, all stemming from needing to know what the data *means*:

| Decision | What VL requires | What flint-chart derives |
|----------|-----------------|--------------------------|
| X encoding type | `"type": "temporal"` — must recognize timestamp is a date, not a number | `DateTime` → temporal |
| Time formatting | `"format": "%m/%d %H:%M"` — must pick format for hourly granularity | `DateTime` + hourly range → appropriate format |
| UTC scale | `"scale": { "type": "utc" }` — must know timestamps are UTC | `DateTime` → UTC handling |
| Time unit | `"timeUnit": "yearmonthdatehoursminutes"` — verbose, error-prone | Derived from data range + granularity |
| Label rotation | `"labelAngle": -45` — must guess from label width | Auto from label count + string length |
| Y encoding type | `"type": "nominal"` — must decide Category isn't quantitative | `Category` → nominal |
| Color zero baseline | `"scale.zero": true` — Count should start from 0 | `Count` → zero-meaningful → `zero: true` |
| Color scheme | `"scheme": "blues"` — sequential scheme for counts | `Count` → quantitative sequential → blues |
| Color format | `"format": "d"` — integer formatting for counts | `Count` → integer → `"d"` |
| Cell step size | VL default: 720 × 20 = 14,400 px wide. Must hard-code width. | Spring model: 720 cells → equilibrium at ~800 px |
| Canvas width | Hard-code `"width": 800` after manually computing 720 cells | Derived automatically from cell count + compression |

That's **11 decisions your agent must make correctly**, all derived
automatically from three semantic type annotations.

If the timestamp column contained Unix epoch numbers (e.g., `1739600400`),
VL would default to `quantitative` — a continuous axis from 0 to 1.7
billion. The semantic type `DateTime` tells the compiler to treat it as
temporal regardless of the raw data format.
