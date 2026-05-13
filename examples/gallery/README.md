# examples/gallery

Visual gallery of every chart template in `flint-chart`, rendered across
all four backends (Vega-Lite, ECharts, Chart.js, GoFish).

This app is a thin shell that pulls test cases from
[`flint-chart/test-data`](../../src/test-data/) and renders each one
side-by-side with each backend's assembler.

## Run locally

```bash
# from repo root
npm install               # installs the library deps
npm --prefix examples/gallery install
npm run gallery           # convenience: starts vite dev server
```

Opens on http://localhost:5173.

## Deploy to GitHub Pages

```bash
npm run gallery:build
# examples/gallery/dist/ → publish under /flint-chart/gallery/
```

The `vite.config.ts` `base` defaults to `/flint-chart/gallery/`. Override
with `VITE_BASE_PATH=/ npm run build` for a root-level deploy.

## Status (scaffold)

The current shell:

- ✅ lists every generator from `TEST_GENERATORS`
- ✅ renders the first 6 cases per group across the three browser backends
- ⏳ no sidebar tree / page navigation (use `gallery-tree.ts` next)
- ⏳ no spec-disclosure pane
- ⏳ no GoFish renderer (it's imperative — needs `<canvas>` glue)

Contributions welcome — see [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).
