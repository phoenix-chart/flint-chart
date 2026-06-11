"""Port of tests/frontend/unit/lib/agents-chart/vegalite/bandedLabelAngle.test.ts."""
from __future__ import annotations

from flint.vegalite import assemble_vegalite

CANVAS = {"width": 400, "height": 300}


def test_rotates_many_wide_numeric_labels_on_banded_ordinal_x_axis():
    values = [{"bucket": 1_000_000 + i * 125_000, "count": 10 + (i % 7)} for i in range(30)]
    spec = assemble_vegalite({
        "data": {"values": values},
        "semantic_types": {"bucket": "Quantity", "count": "Quantity"},
        "chart_spec": {
            "chartType": "Bar Chart",
            "encodings": {"x": {"field": "bucket", "type": "ordinal"}, "y": {"field": "count"}},
            "canvasSize": CANVAS,
        },
    })
    assert spec["config"]["axisX"]["labelAngle"] == -45


def test_keeps_few_short_numeric_labels_horizontal():
    values = [
        {"bucket": 1, "count": 10},
        {"bucket": 2, "count": 20},
        {"bucket": 3, "count": 15},
    ]
    spec = assemble_vegalite({
        "data": {"values": values},
        "semantic_types": {"bucket": "Quantity", "count": "Quantity"},
        "chart_spec": {
            "chartType": "Bar Chart",
            "encodings": {"x": {"field": "bucket", "type": "ordinal"}, "y": {"field": "count"}},
            "canvasSize": CANVAS,
        },
    })
    assert spec["config"]["axisX"]["labelAngle"] == 0


def test_continuous_quantitative_x_axis_left_to_vl_overlap_handling():
    values = [{"bucket": 1_000_000 + i * 125_000, "count": 10 + (i % 7)} for i in range(25)]
    spec = assemble_vegalite({
        "data": {"values": values},
        "semantic_types": {"bucket": "Quantity", "count": "Quantity"},
        "chart_spec": {
            "chartType": "Bar Chart",
            "encodings": {"x": {"field": "bucket"}, "y": {"field": "count"}},
            "canvasSize": CANVAS,
        },
    })
    assert (spec.get("config", {}).get("axisX") or {}).get("labelAngle") is None
