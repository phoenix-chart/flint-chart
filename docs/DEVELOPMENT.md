# DEVELOPMENT

How to build, test, and extend **flint-chart** locally.

## Prerequisites

- Node 18+ (see [`packages/flint-js/.nvmrc`](../packages/flint-js/.nvmrc) — `nvm use` if you have nvm)
- npm 9+ (workspaces)

## First-time setup

```bash
git clone https://github.com/microsoft/flint-chart
cd flint-chart
npm install    # root workspace: packages/flint-js, site, agent-skills
```

## Daily commands

Run from the **repository root**:

| Command | What it does |
|---------|----------------|
| `npm run typecheck` | Typecheck `packages/flint-js` |
| `npm run test` | Vitest in `packages/flint-js` |
| `npm run build` | Build `packages/flint-js` → `dist/` |
| `npm run site` | Demo site at http://localhost:5274/ |
| `npm run site:build` | Production build → `site/dist/` |
| `npm run mcp:build` | Build MCP server workspace |

The demo site aliases `flint-chart` to `packages/flint-js/src` via Vite, so
library edits hot-reload in the gallery and editor without rebuilding `dist/`.

## Repo layout

```
flint-chart/
├── packages/
│   ├── flint-js/          npm package `flint-chart`
│   │   ├── src/core/      semantics, layout, types
│   │   ├── src/vegalite/  Vega-Lite backend
│   │   ├── src/echarts/   ECharts backend
│   │   ├── src/chartjs/   Chart.js backend
│   │   ├── src/gofish/    GoFish backend
│   │   └── src/test-data/ gallery fixtures
│   └── flint-py/          PyPI package `flint`
├── site/                  landing, gallery, editor, docs browser
├── docs/                  architecture + site documentation sources
├── agent-skills/          AI agent skill (SKILL.md)
└── shared/test-data/      JSON fixtures (JS + Python)
```

## How a chart gets assembled

1. **Phase 0 — semantic resolution** (`packages/flint-js/src/core/resolve-semantics.ts`)
2. **Phase 1 — layout** (`packages/flint-js/src/core/compute-layout.ts`)
3. **Phase 2 — instantiation** (per-backend `assemble.ts` + templates)

See [Architecture](/documentation/architecture) on the site.

## Adding things

- [Adding a chart template](/documentation/adding-a-chart-template)
- [Adding a semantic type](/documentation/adding-a-semantic-type)
- [Adding a backend](/documentation/adding-a-backend)

## Tests

- **Smoke tests:** `packages/flint-js/tests/smoke.test.ts`
- **Visual coverage:** [gallery](/wall) driven by `TEST_GENERATORS` in test-data

## Release

See [release-process.md](release-process.md). Published package: `packages/flint-js` on npm as `flint-chart`.
