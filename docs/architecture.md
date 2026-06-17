# Architecture

Flint is a library-agnostic intermediate language for visualization. All `assemble*()` entry points share the same **compiler frontend** and **optimizer**; only the **code generator** is backend-specific.

For motivation and spec examples, see [Overview](/documentation/overview). For input types, see [API reference](/documentation/api-reference).

---

## Table of Contents

- [§1 Design principles](#1-design-principles)
- [§2 Three-stage pipeline](#2-three-stage-pipeline)
- [§3 Stage 1 — Compiler frontend](#3-stage-1-compiler-frontend)
- [§4 Stage 2 — Optimizer](#4-stage-2-optimizer)
- [§5 Stage 3 — Code generator](#5-stage-3-code-generator)
- [§6 Inputs](#6-inputs)
- [§7 Overflow and warnings](#7-overflow-and-warnings)
- [§8 Repository layout](#8-repository-layout)
- [§9 Related](#9-related)

---

# §1 Design principles

1. **Semantics first** — `semantic_types` guide parsing, aggregation, zero baseline, diverging detection, and format — not raw storage types alone.
2. **Minimal chart surface** — `chart_spec` supplies chart type and channel bindings (~10 lines). Axes, scales, legends, and step sizes are compiler-derived.
3. **Dynamic templates** — Each `chartType` maps to a `ChartTemplateDef` whose `instantiate()` consumes the full compilation context and adapts to cardinality and semantics (paper §5.3).
4. **No UI dependencies** — Pure TypeScript (`packages/flint-js`); Python port (`packages/flint-py`). Usable from agents, notebooks, servers, or this site.

Roughly **90%** of design logic lives in Stages 1–2 and is identical across backends.

---

# §2 Three-stage pipeline

![Overview of the Flint architecture](figs/overview.png)

| Stage | Role | Implementation | Key outputs |
|-------|------------|----------------|-------------|
| **1. Compiler frontend** | Resolve encoding properties | Phase 0 — `resolveChannelSemantics()` | `ChannelSemantics` per channel |
| **2. Optimizer** | Fit layout to canvas | Phase 1 — `computeLayout()`, `filterOverflow()` | `LayoutResult`, truncated data |
| **3. Code generator** | Emit library-native spec | Phase 2 — `build*Encodings()`, `template.instantiate()` | VL / EC / CJS / GoFish spec |

```text
assembleVegaLite(input)   // or assembleECharts, assembleChartjs, assembleGoFish
       │
       ▼
══ STAGE 1 — COMPILER FRONTEND (core/) ═════════════════════════
       │
       ├── resolveChannelSemantics()     semantic_types + data → ChannelSemantics
       ├── computeZeroDecision()         per quantitative axis (needs template mark)
       ├── declareLayoutMode()           template layout intent (optional)
       └── convertTemporalData()         semantic-driven date parsing
       │
       ▼
══ STAGE 2 — OPTIMIZER (core/) ══════════════════════════════════
       │
       ├── computeChannelBudgets() + filterOverflow()
       └── computeLayout()
             • Discrete axes — elastic budget (bars, heatmap cells)
             • Continuous axes — gas-pressure stretch (scatter, line)
             • Global — facet grid, aspect ratio, radial / area models
       │
       ▼
══ STAGE 3 — CODE GENERATOR (per backend) ═══════════════════════
       │
       ├── build*Encodings()             backend encoding objects
       ├── template.instantiate()        dynamic template hook
       ├── restructureFacets()           VL / ECharts faceting
       └── applyLayoutToSpec()           step, width/height, padding
       │
       ▼
   Native spec + optional warnings
```

Canonical orchestration: `packages/flint-js/src/vegalite/assemble.ts`.

---

# §3 Stage 1 — Compiler frontend

Resolution happens in two layers (detail: [Semantic types §4](/documentation/semantic-types#4-compilation-pipeline)):

### Field properties

Per column, independent of chart: format class, aggregation role, domain shape, diverging hints, canonical order. Driven by `type-registry.ts` and optional inline annotations (`intrinsicDomain`, `unit`, `sortOrder`).

### Channel properties

Chart-context grounding: the same `YearMonth` field may be temporal on `x` in a line chart but categorical on `color` in another view. Channel semantics prevent treating year-month integers as quantitative magnitudes.

**IR:** `ChannelSemantics` — flat, backend-agnostic record consumed by layout and all templates.

Tiered types (T0 → T1 → T2) allow graceful degradation when agents supply coarse labels.

---

# §4 Stage 2 — Optimizer

The optimizer receives `canvasSize` and produces a `LayoutResult` so the chart fits without unreadable compression.

### Local optimization

Each layout dimension (x, y, group, facet column/row, radius) is a flexible container:

| Encoding class | Behavior |
|----------------|----------|
| Discrete (bars, heatmap cells) | Compress toward minimum readable step; stretch canvas if needed |
| Continuous (scatter, line) | Stretch when mark density exceeds overlap budget |

### Global optimization

Aspect ratio (banking-to-45° for connected marks), facet row/column wrapping, and non-Cartesian charts (treemap, gauge, pie) sized from component counts.

Implementation models: [Layout model](/documentation/layout-model) — §2 elastic budget, §3 gas pressure, §4 circumference, §5 area.

---

# §5 Stage 3 — Code generator

Backend generators translate optimized context into library-native syntax. Each `chartType` registers a **dynamic template**:

| `ChartTemplateDef` field | Role |
|--------------------------|------|
| `chart` | Public name (`"Grouped Bar Chart"`) — matches `chart_spec.chartType` |
| `template` | Native spec skeleton |
| `channels` | Allowed encodings |
| `markCognitiveChannel` | `position` / `length` / `area` / `color` — zero baseline and stretch class |
| `declareLayoutMode?` | Axis flags before layout |
| `instantiate()` | Emit spec from `InstantiateContext` |

Registries: `vlTemplateDefs`, `ecTemplateDefs`, `cjsTemplateDefs`, `gfTemplateDefs`. Lookup: `vlGetTemplateDef(name)`, etc.

New backends add Stage 3 only — frontend and optimizer unchanged. See [Adding a backend](/documentation/adding-a-backend).

---

# §6 Inputs

| Part | API | Specifies |
|------|-----|-----------|
| Raw data | `data` | Row table for parsers and layout |
| **dataSpec** | `semantic_types` | Field meaning; reused across charts on the same dataset |
| **chartSpec** | `chart_spec` | `chartType` + `encodings`; cheap to edit during exploration |

LLM agents typically infer `semantic_types` once, then iterate on `chart_spec` — matching the paper's game-market case study: line → heatmap → grouped bar → waterfall → sunburst on one semantic layer.

---

# §7 Overflow and warnings

When discrete cardinality exceeds the canvas budget, the optimizer filters data and attaches `ChartWarning` metadata instead of rendering an unusable chart. Strategy priority and `_warnings` inspection: [API reference §8](/documentation/api-reference#8-overflow-and-warnings).

---

# §8 Repository layout

```text
packages/flint-js/src/
├── core/           resolve-semantics, field-semantics, compute-layout, type-registry, types
├── vegalite/       Stage 3 — Vega-Lite templates + assembleVegaLite
├── echarts/        Stage 3 — ECharts templates + assembleECharts
├── chartjs/        Stage 3 — Chart.js templates + assembleChartjs
├── gofish/         Stage 3 — GoFish templates + assembleGoFish
└── test-data/      gallery fixtures (TEST_GENERATORS)

packages/flint-py/  Python port (Vega-Lite backend today)
site/               demo site (gallery, editor, documentation)
```

---

# §9 Related

- [Overview](/documentation/overview) — motivation and spec examples
- [API reference](/documentation/api-reference) — `ChartAssemblyInput`, assemblers, options
- [Semantic types](/documentation/semantic-types) — type hierarchy and resolution rules
- [Layout model](/documentation/layout-model) — stretch and facet models
- [Paper (PDF)](https://github.com/microsoft/flint-chart/blob/main/docs/figs/AgChart.pdf)
- [Adding a chart template](/documentation/adding-a-chart-template) — extend Stage 3
