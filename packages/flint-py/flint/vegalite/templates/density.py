"""Density Plot template."""
from __future__ import annotations


def _density_instantiate(spec, ctx):
    encs = ctx["resolvedEncodings"]
    x = encs.get("x")
    color = encs.get("color")
    column = encs.get("column")
    row = encs.get("row")
    if x and x.get("field"):
        spec["transform"][0]["density"] = x["field"]
        spec["encoding"]["x"]["title"] = x["field"]
    if color and color.get("field"):
        spec["transform"][0]["groupby"] = [color["field"]]
        existing_color = (spec.get("encoding") or {}).get("color") or {}
        spec["encoding"]["color"] = {**existing_color, **color}
    if column:
        spec["encoding"]["column"] = column
    if row:
        spec["encoding"]["row"] = row
    config = ctx.get("chartProperties")
    if config and config.get("bandwidth") and config["bandwidth"] > 0:
        spec["transform"][0]["bandwidth"] = config["bandwidth"]


density_plot_def = {
    "chart": "Density Plot",
    "template": {
        "mark": "area",
        "transform": [{"density": "__field__"}],
        "encoding": {
            "x": {"field": "value", "type": "quantitative"},
            "y": {"field": "density", "type": "quantitative"},
        },
    },
    "channels": ["x", "color", "column", "row"],
    "markCognitiveChannel": "area",
    "instantiate": _density_instantiate,
    "properties": [
        {"key": "bandwidth", "label": "Bandwidth", "type": "continuous",
         "min": 0.05, "max": 2, "step": 0.05, "defaultValue": 0},
    ],
}
