# Adding a new backend

Adding a backend means implementing the `assemble<Backend>` orchestrator
plus enough templates to be useful. The existing four backends
(`vegalite/`, `echarts/`, `chartjs/`, `gofish/`) are the reference
implementations.

## Skeleton

```
src/<backend>/
├── index.ts             public barrel
├── assemble.ts          orchestrator: input → Phase 0 → Phase 1 → instantiate
├── instantiate-spec.ts  Phase 2: traverse encodings + layout → backend spec
└── templates/
    ├── index.ts         template registry
    ├── bar.ts
    ├── line.ts
    └── …
```

## Contract

`assemble<Backend>(input: ChartAssemblyInput) → <BackendSpec>`

1. Call `resolveSemantics(input)` from `core/` → `ChannelSemantics[]`.
2. Call `computeLayout(channelSemantics, data, options)` from `core/`.
3. Look up the template by `chartType`, call its `build()` (or
   per-backend equivalent), pass the resolved encodings + layout.
4. Return the native spec.

The orchestrator should not contain backend-specific decisions about
zero baselines, formatting, or color — those live in `core/` and have
already been resolved by step 1.

## Templates

A backend's templates encode only **shape**, not **decisions**. If you
find yourself branching on `field.type === 'temporal'` in a template,
the decision belongs in `core/`.

## Wire up

1. Add to `src/index.ts` barrel:
   ```ts
   export * from './<backend>';
   ```
2. Add the entry to `tsup.config.ts` so it gets its own `./dist/<backend>/`
   subpath bundle.
3. Add a `./<backend>` subpath export to `package.json#exports`.
4. Add to `agent-skills/mcp-server/src/index.ts` so MCP clients can call it.
5. Add a renderer component to `site/src/components/` and
   wire it into `TripleChart` (or rename it).
6. Add at least one `gen<Backend>*Tests` generator to `src/test-data/`.

## Acceptance

A backend is "done" when:

- Bar, Line, Area, Scatter, Pie render visually correct across the
  gallery's standard test cases.
- The smoke test in `tests/smoke.test.ts` (or a backend-specific one)
  asserts a sensible output shape.
- Snapshot diffs against committed baselines are stable.
