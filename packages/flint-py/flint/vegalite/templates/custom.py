"""Custom Chart templates — pass-through encoding builders."""
from __future__ import annotations

from .utils import default_build_encodings


def _make_def(chart, mark, channels, cognitive):
    def _inst(spec, ctx):
        default_build_encodings(spec, ctx["resolvedEncodings"])

    return {
        "chart": chart,
        "template": {"mark": mark, "encoding": {}},
        "channels": channels,
        "markCognitiveChannel": cognitive,
        "instantiate": _inst,
    }


custom_point_def = _make_def(
    "Custom Point", "point",
    ["x", "y", "color", "opacity", "size", "shape", "column", "row"],
    "position",
)
custom_line_def = _make_def(
    "Custom Line", "line",
    ["x", "y", "color", "opacity", "detail", "column", "row"],
    "position",
)
custom_bar_def = _make_def(
    "Custom Bar", "bar",
    ["x", "y", "color", "opacity", "size", "shape", "column", "row"],
    "length",
)
custom_rect_def = _make_def(
    "Custom Rect", "rect",
    ["x", "y", "x2", "y2", "color", "opacity", "column", "row"],
    "area",
)
custom_area_def = _make_def(
    "Custom Area", "area",
    ["x", "y", "x2", "y2", "color", "column", "row"],
    "area",
)
