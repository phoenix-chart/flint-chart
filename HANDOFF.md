# Handoff Notes for the Next Agent

Hi — the previous agent (working in the `data-formulator` workspace) seeded this repo. Quick orientation so you don't re-discover what's already known.

## Current state of the repo

- **`README.md`, `core/`, `chartjs/`, `echarts/`, `gofish/`, `vegalite/`, `gallery/`, `test-data/`, `docs/`, `index.ts`** — extracted from `data-formulator/src/lib/agents-chart/` via `git subtree split` with **full history (~85 commits)** preserved. Treat these as the source of truth.
- **`df-reference/`** — a snapshot (no DF history) of files from Data Formulator that you'll need when building the standalone gallery / wiring up infra. **Read [`df-reference/README.md`](df-reference/README.md) first** — it lists every file, what's DF-only, and what to strip.
- Local `main` is **1 merge commit ahead of `origin/main`** and has not been pushed. Decide whether to push as-is, or restructure first and push then.

## Known gotchas

1. **Broken external imports.** Files under `test-data/*` and `gallery/*` import from `'../../../data/types'` and `'../../../components/ComponentType'`. These paths don't exist here. The core library (`core/`, `vegalite/`, `echarts/`, `chartjs/`, `gofish/`) is unaffected. To fix: vendor `df-reference/data/types.ts` and the relevant `Channel`/`EncodingItem`/`FieldItem` types from `df-reference/components/ComponentType.tsx` into `test-data/`, then rewrite the imports. See `df-reference/README.md` "Critical fix" section.

2. **README.md merge.** The original empty repo had a `README.md` with setup instructions (commit `8641814`). It was overwritten with the Flint README during the subtree merge. If you want to preserve any of that setup content, check `git log README.md` and recover from `8641814`.

3. **No build/test/publish infra yet.** No `package.json`, `tsconfig.json`, `vitest.config.ts`, etc., at the repo root. `df-reference/infra/` has DF's versions as starting points — they need React/MUI/redux pieces stripped.

4. **Gallery is DF-coupled.** The gallery components in `df-reference/gallery/` use `assembleVegaChart` (a DF wrapper), redux-style `EncodingItem` shapes, MUI theme tokens, and DF asset imports. They're scaffolding, not ship-ready. Rewrite to use `assembleVegaLite` directly. See the "How to use this when building the standalone Flint gallery" section in the reference README.

5. **Chart icons.** All 39 `chart-icon-*.{png,svg}` are in `df-reference/assets/` and ready to import as-is — just wire up paths.

## The plan (from the Data Formulator side)

The spin-out plan lives at `data-formulator/design-docs/30-flint-spinout-plan.md`. **Key non-goal: Data Formulator is not modified.** DF keeps its own in-tree copy of Flint and is unaware of this repo. There's no urgency to publish to npm; first goal is "buildable, testable, gallery runs locally."

Suggested next steps (in order):
1. Resolve the broken imports (#1 above) so `tsc` runs clean over `core/` + backends + `test-data/`.
2. Add `package.json` + `tsconfig.json` + `vitest.config.ts` (use `df-reference/infra/` as a starting point, strip React/MUI/redux deps for the library tsconfig).
3. Decide repo structure: keep current flat layout, or move source under `src/` as proposed in §4 of the spin-out plan.
4. Stand up `examples/gallery/` from `df-reference/gallery/` + `df-reference/assets/`.
5. Once gallery runs against the local library, **delete `df-reference/`** — it's scaffolding only.

## What I (the prior agent) deliberately did not do

- Did not push to `origin/main`.
- Did not modify any file under `core/`, `vegalite/`, `echarts/`, `chartjs/`, `gofish/`, `gallery/`, `test-data/`, `docs/`, or `index.ts`. Those are exactly as extracted.
- Did not touch `data-formulator/` source. The temporary `flint-extract` branch in DF was deleted after the subtree was pulled here.
- Did not pick a package name. `@microsoft/flint` is the working assumption; `flint-vis` or `flint-chart` (matching the repo name) are alternatives.

Good luck.
