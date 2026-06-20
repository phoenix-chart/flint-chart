# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial spin-out from Data Formulator (`src/lib/agents-chart/`).
- Modern repo layout: `src/`, `tests/`, `examples/`, `agent-skills/`, `docs/`.
- Dual ESM + CJS build via `tsup`.
- Vitest test runner, ESLint flat config, Prettier, EditorConfig.
- Vega-Lite, ECharts, and Chart.js backends behind a single
  `ChartAssemblyInput` contract.
- Demo gallery and live-editor scaffolds under `examples/`.
- Agent skill bundle and MCP server stub under `agent-skills/`.
