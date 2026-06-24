# agent-skills/

Agent skill for **flint-chart** — teaches LLMs and IDE agents how to produce
correct, idiomatic `ChartAssemblyInput` JSON, then use it in the right
workflow: MCP rendering, project integration, or backend compilation.

## How agents should use flint-chart

The whole point of flint-chart is that LLMs **don't have to know low-level
chart knobs**. The agent contract is:

1. Pick a `chartType` from the registry.
2. Map fields to channels (`x`, `y`, `color`, …).
3. Annotate each field with a **semantic type** (`Quantity`, `Price`,
   `Country`, `Date`, …).

That's it. Sizing, zero baselines, color schemes, number formatting,
sort order — all derived deterministically by the compiler.

When the user wants more than a spec, the skill also tells the agent how to:

- validate and render charts with the Flint MCP server;
- install `flint-chart` and the needed renderer peer dependencies;
- call `assembleVegaLite`, `assembleECharts`, or `assembleChartjs` in JS/TS;
- use the Python package when it is published in a later release.

See [flint-chart-author/SKILL.md](flint-chart-author/SKILL.md) for the full
contract, worked examples, and the validation checklist.
