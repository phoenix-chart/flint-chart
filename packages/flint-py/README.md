# flint-py

A standalone Python port of the Flint (agents-chart) semantic chart compiler. It
takes the same `ChartAssemblyInput` shape as the TypeScript `assembleVegaLite()`
function and produces an identical Vega-Lite specification.

The project intentionally mirrors the TypeScript source tree under
`src/lib/agents-chart/` (which we refer to as "the JS source"):

```
flint/
├── core/                  ← target-agnostic
│   ├── types.py
│   ├── type_registry.py
│   ├── semantic_types.py
│   ├── field_semantics.py
│   ├── decisions.py
│   ├── resolve_semantics.py
│   ├── color_decisions.py
│   ├── filter_overflow.py
│   └── compute_layout.py
└── vegalite/              ← Vega-Lite backend
    ├── assemble.py
    ├── instantiate_spec.py
    └── templates/
        ├── ...
```

## Usage

```python
from flint.vegalite import assemble_vegalite

spec = assemble_vegalite({
    "data": {"values": rows},
    "semantic_types": {"weight": "Quantity", "mpg": "Quantity"},
    "chart_spec": {
        "chartType": "Scatter Plot",
        "encodings": {"x": {"field": "weight"}, "y": {"field": "mpg"}},
        "canvasSize": {"width": 400, "height": 300},
    },
    "options": {"addTooltips": True},
})
```

## Testing

The TypeScript source is treated as ground truth. The vitest test at
`tests/frontend/unit/lib/agents-chart/flint_py_extract.test.ts` walks every
gallery test case, runs `assembleVegaLite`, and dumps both the input and the
resulting Vega-Lite spec into `flint-py/tests/fixtures/<slug>/`.

`flint-py/tests/test_fixtures.py` then runs the Python `assemble_vegalite()` on
each input and asserts deep equality against the recorded JS spec.

```bash
# 1. Regenerate fixtures from the JS reference (re-run after changing TS source).
cd /Users/chenwang/research/data-formulator
npx vitest run tests/frontend/unit/lib/agents-chart/flint_py_extract.test.ts

# 2. Run the Python compatibility tests.
cd flint-py
uv pip install -e .[test]
uv run pytest -q
```
