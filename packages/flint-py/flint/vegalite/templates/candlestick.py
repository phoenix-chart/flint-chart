"""Candlestick Chart template."""
from __future__ import annotations


def _candlestick_declare(cs, table, chart_properties):
    return {"axisFlags": {"x": {"banded": True}}}


def _candlestick_instantiate(spec, ctx):
    encs = ctx["resolvedEncodings"]
    x = encs.get("x")
    open_ = encs.get("open")
    high = encs.get("high")
    low = encs.get("low")
    close = encs.get("close")
    column = encs.get("column")
    row = encs.get("row")

    if "encoding" not in spec:
        spec["encoding"] = {}
    if x:
        spec["encoding"]["x"] = x
        if x.get("type") in ("nominal", "ordinal"):
            spec["encoding"]["x"]["sort"] = None
    if column:
        spec["encoding"]["column"] = column
    if row:
        spec["encoding"]["row"] = row

    spec["encoding"]["y"] = {
        "type": "quantitative",
        "scale": {"zero": False},
        "axis": {"title": None},
    }

    spec["title"] = {
        "text": "Price", "anchor": "start", "fontSize": 11,
        "fontWeight": "normal", "color": "#666",
    }

    if low:
        spec["layer"][0]["encoding"]["y"] = {"field": low["field"]}
    if high:
        spec["layer"][0]["encoding"]["y2"] = {"field": high["field"]}
    if open_:
        spec["layer"][1]["encoding"]["y"] = {"field": open_["field"]}
    if close:
        spec["layer"][1]["encoding"]["y2"] = {"field": close["field"]}

    if open_ and open_.get("field") and close and close.get("field"):
        spec["encoding"]["color"] = {
            "condition": {
                "test": f"datum['{open_['field']}'] < datum['{close['field']}']",
                "value": "#06982d",
            },
            "value": "#ae1325",
        }

    # Compute bar width from x-axis cardinality
    table = ctx.get("table") or []
    canvas = ctx.get("canvasSize") or {}
    plot_width = canvas.get("width") or 400
    x_field = (spec.get("encoding") or {}).get("x", {}).get("field")
    if x_field and table:
        seen = set()
        for r in table:
            seen.add(r.get(x_field))
        cardinality = max(1, len(seen))
        bar_size = max(2, min(20, round(plot_width * 0.6 / cardinality)))
    else:
        bar_size = 14

    layer1_mark = spec["layer"][1].get("mark") or {}
    if isinstance(layer1_mark, str):
        layer1_mark = {"type": layer1_mark}
    spec["layer"][1]["mark"] = {**layer1_mark, "size": bar_size}


candlestick_chart_def = {
    "chart": "Candlestick Chart",
    "template": {
        "encoding": {},
        "layer": [
            {"mark": "rule", "encoding": {}},
            {"mark": {"type": "bar", "size": 14}, "encoding": {}},
        ],
    },
    "channels": ["x", "open", "high", "low", "close", "column", "row"],
    "markCognitiveChannel": "position",
    "declareLayoutMode": _candlestick_declare,
    "instantiate": _candlestick_instantiate,
}
