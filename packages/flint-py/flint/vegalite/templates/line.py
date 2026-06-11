"""Line Chart template."""
from __future__ import annotations

from .utils import default_build_encodings, set_mark_prop


def _apply_interpolate(vg_spec, config):
    if not config or not config.get("interpolate"):
        return
    vg_spec["mark"] = set_mark_prop(vg_spec.get("mark"), "interpolate", config["interpolate"])


def _apply_show_points(vg_spec, config):
    if not config or not config.get("showPoints"):
        return
    vg_spec["mark"] = set_mark_prop(vg_spec.get("mark"), "point", True)


def _line_declare_layout(cs, table, chart_properties):
    return {
        "paramOverrides": {
            "continuousMarkCrossSection": {"x": 100, "y": 20, "seriesCountAxis": "auto"},
            "facetAspectRatioResistance": 0.5,
        },
    }


def _line_instantiate(spec, ctx):
    default_build_encodings(spec, ctx["resolvedEncodings"])
    _apply_interpolate(spec, ctx.get("chartProperties"))
    _apply_show_points(spec, ctx.get("chartProperties"))


line_chart_def = {
    "chart": "Line Chart",
    "template": {"mark": "line", "encoding": {}},
    "channels": ["x", "y", "color", "strokeDash", "detail", "opacity", "column", "row"],
    "markCognitiveChannel": "position",
    "declareLayoutMode": _line_declare_layout,
    "instantiate": _line_instantiate,
    "properties": [
        {
            "key": "interpolate", "label": "Curve", "type": "discrete",
            "options": [
                {"value": None, "label": "Default (linear)"},
                {"value": "linear", "label": "Linear"},
                {"value": "monotone", "label": "Monotone (smooth)"},
                {"value": "step", "label": "Step"},
                {"value": "step-before", "label": "Step Before"},
                {"value": "step-after", "label": "Step After"},
                {"value": "basis", "label": "Basis (smooth)"},
                {"value": "cardinal", "label": "Cardinal"},
                {"value": "catmull-rom", "label": "Catmull-Rom"},
            ],
        },
        {"key": "showPoints", "label": "Show points", "type": "binary", "defaultValue": False},
    ],
}
