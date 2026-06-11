#!/usr/bin/env python3
"""
Generate systematic test cases for ECharts backend testing.

Covers:
- All chart types supported by ECharts backend
- Various data cardinalities (small, medium, large)
- Various canvas sizes (narrow, wide, square, tall)
- Various encoding combinations (with/without color, facet, etc.)
- Edge cases (long labels, many categories, empty data)
"""
import json
import random
from pathlib import Path

random.seed(42)

OUTPUT_DIR = Path(__file__).parent / "test_cases"
OUTPUT_DIR.mkdir(exist_ok=True)

# --- Data generators ---

def gen_categorical_data(n_cats, n_groups=None, long_labels=False):
    """Generate categorical data with optional grouping."""
    cats = [f"Category {i+1}" for i in range(n_cats)]
    if long_labels:
        cats = [f"This Is A Very Long Category Label Number {i+1}" for i in range(n_cats)]
    
    rows = []
    groups = [f"Group {g+1}" for g in range(n_groups)] if n_groups else [None]
    for cat in cats:
        for grp in groups:
            row = {"category": cat, "value": random.randint(10, 100)}
            if grp:
                row["group"] = grp
            rows.append(row)
    return rows

def gen_time_series(n_points, n_series=1):
    """Generate time series data."""
    rows = []
    series_names = [f"Series {s+1}" for s in range(n_series)]
    for i in range(n_points):
        for s in series_names:
            rows.append({
                "date": f"2024-{(i//28)+1:02d}-{(i%28)+1:02d}",
                "value": random.randint(20, 80) + random.randint(-10, 10),
                "series": s
            })
    return rows

def gen_scatter_data(n_points, with_color=False, with_size=False):
    """Generate scatter plot data."""
    groups = ["A", "B", "C"]
    rows = []
    for i in range(n_points):
        row = {
            "x": round(random.gauss(50, 15), 1),
            "y": round(random.gauss(50, 15), 1),
        }
        if with_color:
            row["group"] = random.choice(groups)
        if with_size:
            row["size"] = random.randint(5, 50)
        rows.append(row)
    return rows

def gen_heatmap_data(n_x, n_y):
    """Generate heatmap data."""
    x_vals = [f"X{i+1}" for i in range(n_x)]
    y_vals = [f"Y{j+1}" for j in range(n_y)]
    rows = []
    for x in x_vals:
        for y in y_vals:
            rows.append({"x": x, "y": y, "value": random.randint(0, 100)})
    return rows

def gen_pie_data(n_slices):
    """Generate pie chart data."""
    labels = [f"Slice {i+1}" for i in range(n_slices)]
    rows = [{"label": l, "value": random.randint(10, 100)} for l in labels]
    return rows

def gen_boxplot_data(n_groups, n_per_group=30):
    """Generate data for boxplots."""
    rows = []
    for i in range(n_groups):
        center = random.randint(30, 70)
        for _ in range(n_per_group):
            rows.append({
                "group": f"Group {i+1}",
                "value": round(random.gauss(center, 10), 1)
            })
    return rows

def gen_histogram_data(n_points):
    """Generate continuous data for histograms."""
    return [{"value": round(random.gauss(50, 15), 1)} for _ in range(n_points)]

def gen_sankey_data():
    """Generate sankey/flow data."""
    nodes = ["Source A", "Source B", "Source C", "Mid 1", "Mid 2", "Target X", "Target Y"]
    links = [
        {"source": "Source A", "target": "Mid 1", "value": 20},
        {"source": "Source A", "target": "Mid 2", "value": 10},
        {"source": "Source B", "target": "Mid 1", "value": 15},
        {"source": "Source B", "target": "Mid 2", "value": 25},
        {"source": "Source C", "target": "Mid 2", "value": 30},
        {"source": "Mid 1", "target": "Target X", "value": 25},
        {"source": "Mid 1", "target": "Target Y", "value": 10},
        {"source": "Mid 2", "target": "Target X", "value": 35},
        {"source": "Mid 2", "target": "Target Y", "value": 30},
    ]
    return {"nodes": nodes, "links": links}

def gen_gauge_data():
    """Generate gauge data."""
    return [{"value": random.randint(0, 100)}]

def gen_funnel_data(n_stages):
    """Generate funnel data."""
    stages = [f"Stage {i+1}" for i in range(n_stages)]
    val = 100
    rows = []
    for s in stages:
        rows.append({"stage": s, "value": val})
        val = max(10, val - random.randint(10, 25))
    return rows

def gen_radar_data(n_axes, n_series=1):
    """Generate radar data."""
    axes = [f"Dim {i+1}" for i in range(n_axes)]
    rows = []
    for s in range(n_series):
        row = {"series": f"Series {s+1}"}
        for ax in axes:
            row[ax] = random.randint(20, 100)
        rows.append(row)
    return rows, axes

def gen_treemap_data():
    """Generate hierarchical data for treemap/sunburst."""
    return [
        {"category": "Tech", "subcategory": "Hardware", "value": 30},
        {"category": "Tech", "subcategory": "Software", "value": 45},
        {"category": "Tech", "subcategory": "Services", "value": 25},
        {"category": "Health", "subcategory": "Pharma", "value": 40},
        {"category": "Health", "subcategory": "Devices", "value": 20},
        {"category": "Finance", "subcategory": "Banking", "value": 35},
        {"category": "Finance", "subcategory": "Insurance", "value": 28},
    ]

# --- Canvas sizes ---

CANVAS_SIZES = {
    "default": {"width": 600, "height": 400},
    "narrow": {"width": 300, "height": 400},
    "wide": {"width": 800, "height": 300},
    "small": {"width": 250, "height": 200},
    "large": {"width": 1000, "height": 600},
}

# --- Test case definitions ---

def make_test_case(test_id, chart_type, data, semantic_types, encodings,
                   canvas_size=None, chart_properties=None, description=""):
    """Create a test case JSON."""
    case = {
        "test_id": test_id,
        "description": description,
        "input": {
            "data": {"values": data},
            "semantic_types": semantic_types,
            "chart_spec": {
                "chartType": chart_type,
                "encodings": encodings,
            }
        }
    }
    if canvas_size:
        case["input"]["chart_spec"]["canvasSize"] = canvas_size
    if chart_properties:
        case["input"]["chart_spec"]["chartProperties"] = chart_properties
    return case


def generate_bar_tests():
    """Generate bar chart test cases."""
    tests = []
    
    # Basic bar - few categories
    tests.append(make_test_case(
        "bar_basic_5", "Bar Chart",
        gen_categorical_data(5), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        description="Basic bar chart with 5 categories"
    ))
    
    # Many categories (overflow test)
    tests.append(make_test_case(
        "bar_many_cats_20", "Bar Chart",
        gen_categorical_data(20), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        description="Bar chart with 20 categories - label overflow test"
    ))
    
    # Long labels
    tests.append(make_test_case(
        "bar_long_labels", "Bar Chart",
        gen_categorical_data(8, long_labels=True), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        description="Bar chart with very long category labels"
    ))
    
    # With color encoding
    tests.append(make_test_case(
        "bar_colored", "Bar Chart",
        gen_categorical_data(5, n_groups=3), {"category": "Category", "value": "Quantity", "group": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "color": {"field": "group"}},
        description="Bar chart with color encoding (3 groups)"
    ))
    
    # Narrow canvas
    tests.append(make_test_case(
        "bar_narrow", "Bar Chart",
        gen_categorical_data(8), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        canvas_size=CANVAS_SIZES["narrow"],
        description="Bar chart on narrow canvas (300x400)"
    ))
    
    # Small canvas
    tests.append(make_test_case(
        "bar_small_canvas", "Bar Chart",
        gen_categorical_data(6), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        canvas_size=CANVAS_SIZES["small"],
        description="Bar chart on small canvas (250x200)"
    ))
    
    return tests


def generate_stacked_bar_tests():
    tests = []
    tests.append(make_test_case(
        "stacked_bar_basic", "Stacked Bar Chart",
        gen_categorical_data(5, n_groups=3), {"category": "Category", "value": "Quantity", "group": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "color": {"field": "group"}},
        description="Stacked bar with 5 cats × 3 groups"
    ))
    tests.append(make_test_case(
        "stacked_bar_many_groups", "Stacked Bar Chart",
        gen_categorical_data(4, n_groups=8), {"category": "Category", "value": "Quantity", "group": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "color": {"field": "group"}},
        description="Stacked bar with 8 groups (legend overflow test)"
    ))
    return tests


def generate_grouped_bar_tests():
    tests = []
    tests.append(make_test_case(
        "grouped_bar_basic", "Grouped Bar Chart",
        gen_categorical_data(4, n_groups=3), {"category": "Category", "value": "Quantity", "group": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "color": {"field": "group"}},
        description="Grouped bar with 4 cats × 3 groups"
    ))
    tests.append(make_test_case(
        "grouped_bar_many", "Grouped Bar Chart",
        gen_categorical_data(6, n_groups=5), {"category": "Category", "value": "Quantity", "group": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "color": {"field": "group"}},
        description="Grouped bar with 6 cats × 5 groups (crowding test)"
    ))
    return tests


def generate_line_tests():
    tests = []
    tests.append(make_test_case(
        "line_basic", "Line Chart",
        gen_time_series(30), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}},
        description="Basic line chart, 30 data points"
    ))
    tests.append(make_test_case(
        "line_multi_series", "Line Chart",
        gen_time_series(20, n_series=4), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}, "color": {"field": "series"}},
        description="Multi-series line chart (4 series)"
    ))
    tests.append(make_test_case(
        "line_dense", "Line Chart",
        gen_time_series(100), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}},
        description="Dense line chart (100 points) - label congestion test"
    ))
    tests.append(make_test_case(
        "line_small_canvas", "Line Chart",
        gen_time_series(20), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}},
        canvas_size=CANVAS_SIZES["small"],
        description="Line chart on small canvas"
    ))
    return tests


def generate_area_tests():
    tests = []
    tests.append(make_test_case(
        "area_basic", "Area Chart",
        gen_time_series(30), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}},
        description="Basic area chart"
    ))
    tests.append(make_test_case(
        "area_stacked", "Area Chart",
        gen_time_series(20, n_series=3), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}, "color": {"field": "series"}},
        description="Stacked area chart (3 series)"
    ))
    return tests


def generate_scatter_tests():
    tests = []
    tests.append(make_test_case(
        "scatter_basic", "Scatter Plot",
        gen_scatter_data(50), {"x": "Quantity", "y": "Quantity"},
        {"x": {"field": "x"}, "y": {"field": "y"}},
        description="Basic scatter plot (50 points)"
    ))
    tests.append(make_test_case(
        "scatter_colored", "Scatter Plot",
        gen_scatter_data(80, with_color=True), {"x": "Quantity", "y": "Quantity", "group": "Category"},
        {"x": {"field": "x"}, "y": {"field": "y"}, "color": {"field": "group"}},
        description="Scatter with color (80 points, 3 groups)"
    ))
    tests.append(make_test_case(
        "scatter_sized", "Scatter Plot",
        gen_scatter_data(40, with_color=True, with_size=True),
        {"x": "Quantity", "y": "Quantity", "group": "Category", "size": "Quantity"},
        {"x": {"field": "x"}, "y": {"field": "y"}, "color": {"field": "group"}, "size": {"field": "size"}},
        description="Bubble chart (scatter with size + color)"
    ))
    tests.append(make_test_case(
        "scatter_dense", "Scatter Plot",
        gen_scatter_data(200), {"x": "Quantity", "y": "Quantity"},
        {"x": {"field": "x"}, "y": {"field": "y"}},
        description="Dense scatter (200 points)"
    ))
    return tests


def generate_heatmap_tests():
    tests = []
    tests.append(make_test_case(
        "heatmap_basic", "Heatmap",
        gen_heatmap_data(6, 5), {"x": "Category", "y": "Category", "value": "Quantity"},
        {"x": {"field": "x"}, "y": {"field": "y"}, "color": {"field": "value"}},
        description="Basic heatmap 6×5"
    ))
    tests.append(make_test_case(
        "heatmap_large", "Heatmap",
        gen_heatmap_data(12, 10), {"x": "Category", "y": "Category", "value": "Quantity"},
        {"x": {"field": "x"}, "y": {"field": "y"}, "color": {"field": "value"}},
        description="Large heatmap 12×10"
    ))
    return tests


def generate_pie_tests():
    tests = []
    tests.append(make_test_case(
        "pie_basic", "Pie Chart",
        gen_pie_data(5), {"label": "Category", "value": "Quantity"},
        {"color": {"field": "label"}, "angle": {"field": "value"}},
        description="Basic pie chart (5 slices)"
    ))
    tests.append(make_test_case(
        "pie_many_slices", "Pie Chart",
        gen_pie_data(12), {"label": "Category", "value": "Quantity"},
        {"color": {"field": "label"}, "angle": {"field": "value"}},
        description="Pie chart with 12 slices (legend test)"
    ))
    tests.append(make_test_case(
        "pie_small", "Pie Chart",
        gen_pie_data(4), {"label": "Category", "value": "Quantity"},
        {"color": {"field": "label"}, "angle": {"field": "value"}},
        canvas_size=CANVAS_SIZES["small"],
        description="Pie chart on small canvas"
    ))
    return tests


def generate_histogram_tests():
    tests = []
    tests.append(make_test_case(
        "histogram_basic", "Histogram",
        gen_histogram_data(100), {"value": "Quantity"},
        {"x": {"field": "value"}},
        description="Basic histogram (100 values)"
    ))
    tests.append(make_test_case(
        "histogram_small_n", "Histogram",
        gen_histogram_data(20), {"value": "Quantity"},
        {"x": {"field": "value"}},
        description="Histogram with few data points (20)"
    ))
    return tests


def generate_boxplot_tests():
    tests = []
    tests.append(make_test_case(
        "boxplot_basic", "Boxplot",
        gen_boxplot_data(4), {"group": "Category", "value": "Quantity"},
        {"x": {"field": "group"}, "y": {"field": "value"}},
        description="Basic boxplot (4 groups)"
    ))
    tests.append(make_test_case(
        "boxplot_many", "Boxplot",
        gen_boxplot_data(10), {"group": "Category", "value": "Quantity"},
        {"x": {"field": "group"}, "y": {"field": "value"}},
        description="Boxplot with 10 groups"
    ))
    return tests


def generate_lollipop_tests():
    tests = []
    tests.append(make_test_case(
        "lollipop_basic", "Lollipop Chart",
        gen_categorical_data(8), {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        description="Basic lollipop (8 categories)"
    ))
    return tests


def generate_radar_tests():
    tests = []
    data, axes = gen_radar_data(5, n_series=2)
    sem = {ax: "Quantity" for ax in axes}
    sem["series"] = "Category"
    encs = {f"r{i}": {"field": axes[i]} for i in range(len(axes))}
    encs["color"] = {"field": "series"}
    tests.append(make_test_case(
        "radar_basic", "Radar Chart",
        data, sem, encs,
        description="Radar chart (5 axes, 2 series)"
    ))
    return tests


def generate_rose_tests():
    tests = []
    tests.append(make_test_case(
        "rose_basic", "Rose Chart",
        gen_pie_data(6), {"label": "Category", "value": "Quantity"},
        {"color": {"field": "label"}, "angle": {"field": "value"}},
        description="Rose chart (6 petals)"
    ))
    return tests


def generate_waterfall_tests():
    tests = []
    data = [
        {"category": "Revenue", "value": 100},
        {"category": "COGS", "value": -40},
        {"category": "Gross Profit", "value": 60},
        {"category": "OpEx", "value": -25},
        {"category": "Tax", "value": -10},
        {"category": "Net Income", "value": 25},
    ]
    tests.append(make_test_case(
        "waterfall_basic", "Waterfall Chart",
        data, {"category": "Category", "value": "Quantity"},
        {"x": {"field": "category"}, "y": {"field": "value"}},
        description="Basic waterfall chart"
    ))
    return tests


def generate_funnel_tests():
    tests = []
    tests.append(make_test_case(
        "funnel_basic", "Funnel Chart",
        gen_funnel_data(5), {"stage": "Category", "value": "Quantity"},
        {"x": {"field": "stage"}, "y": {"field": "value"}},
        description="Basic funnel (5 stages)"
    ))
    return tests


def generate_gauge_tests():
    tests = []
    tests.append(make_test_case(
        "gauge_basic", "Gauge Chart",
        gen_gauge_data(), {"value": "Percentage"},
        {"angle": {"field": "value"}},
        description="Basic gauge"
    ))
    return tests


def generate_treemap_tests():
    tests = []
    tests.append(make_test_case(
        "treemap_basic", "Treemap",
        gen_treemap_data(),
        {"category": "Category", "subcategory": "Category", "value": "Quantity"},
        {"color": {"field": "category"}, "size": {"field": "value"}, "detail": {"field": "subcategory"}},
        description="Basic treemap (2-level hierarchy)"
    ))
    return tests


def generate_sunburst_tests():
    tests = []
    tests.append(make_test_case(
        "sunburst_basic", "Sunburst Chart",
        gen_treemap_data(),
        {"category": "Category", "subcategory": "Category", "value": "Quantity"},
        {"color": {"field": "category"}, "size": {"field": "value"}, "detail": {"field": "subcategory"}},
        description="Basic sunburst (2-level hierarchy)"
    ))
    return tests


def generate_sankey_tests():
    tests = []
    sankey = gen_sankey_data()
    # Sankey needs special data format - flatten to rows
    rows = []
    for link in sankey["links"]:
        rows.append({"source": link["source"], "target": link["target"], "value": link["value"]})
    tests.append(make_test_case(
        "sankey_basic", "Sankey Diagram",
        rows, {"source": "Category", "target": "Category", "value": "Quantity"},
        {"x": {"field": "source"}, "y": {"field": "target"}, "size": {"field": "value"}},
        description="Basic sankey diagram"
    ))
    return tests


def generate_streamgraph_tests():
    tests = []
    tests.append(make_test_case(
        "streamgraph_basic", "Streamgraph",
        gen_time_series(20, n_series=4), {"date": "Date", "value": "Quantity", "series": "Category"},
        {"x": {"field": "date"}, "y": {"field": "value"}, "color": {"field": "series"}},
        description="Basic streamgraph (4 series)"
    ))
    return tests


def generate_candlestick_tests():
    tests = []
    rows = []
    for i in range(20):
        o = random.randint(90, 110)
        c = o + random.randint(-10, 10)
        h = max(o, c) + random.randint(0, 5)
        l = min(o, c) - random.randint(0, 5)
        rows.append({"date": f"2024-01-{i+1:02d}", "open": o, "close": c, "high": h, "low": l})
    tests.append(make_test_case(
        "candlestick_basic", "Candlestick Chart",
        rows, {"date": "Date", "open": "Price", "close": "Price", "high": "Price", "low": "Price"},
        {"x": {"field": "date"}, "open": {"field": "open"}, "close": {"field": "close"},
         "high": {"field": "high"}, "low": {"field": "low"}},
        description="Basic candlestick (20 trading days)"
    ))
    return tests


def generate_density_tests():
    tests = []
    tests.append(make_test_case(
        "density_basic", "Density Plot",
        gen_histogram_data(200), {"value": "Quantity"},
        {"x": {"field": "value"}},
        description="Basic density plot (200 values)"
    ))
    return tests


def generate_facet_tests():
    """Test faceting across various chart types."""
    tests = []
    
    # Bar with facet
    data = []
    for facet in ["Panel A", "Panel B", "Panel C"]:
        for cat in ["X", "Y", "Z"]:
            data.append({"category": cat, "value": random.randint(10, 80), "panel": facet})
    tests.append(make_test_case(
        "bar_faceted_3panels", "Bar Chart",
        data, {"category": "Category", "value": "Quantity", "panel": "Category"},
        {"x": {"field": "category"}, "y": {"field": "value"}, "column": {"field": "panel"}},
        description="Bar chart with 3 facet panels"
    ))
    
    # Scatter with facet
    data = []
    for facet in ["Group A", "Group B"]:
        for _ in range(30):
            data.append({"x": round(random.gauss(50, 15), 1), "y": round(random.gauss(50, 15), 1), "panel": facet})
    tests.append(make_test_case(
        "scatter_faceted", "Scatter Plot",
        data, {"x": "Quantity", "y": "Quantity", "panel": "Category"},
        {"x": {"field": "x"}, "y": {"field": "y"}, "column": {"field": "panel"}},
        description="Scatter plot with 2 facet panels"
    ))
    
    # Line with facet
    data = []
    for facet in ["Region 1", "Region 2", "Region 3", "Region 4"]:
        for i in range(12):
            data.append({"month": f"2024-{i+1:02d}", "value": random.randint(20, 80), "region": facet})
    tests.append(make_test_case(
        "line_faceted_4panels", "Line Chart",
        data, {"month": "Date", "value": "Quantity", "region": "Category"},
        {"x": {"field": "month"}, "y": {"field": "value"}, "column": {"field": "region"}},
        description="Line chart with 4 facet panels (wrapping test)"
    ))
    
    return tests


def generate_all():
    """Generate all test cases."""
    all_tests = []
    
    generators = [
        generate_bar_tests,
        generate_stacked_bar_tests,
        generate_grouped_bar_tests,
        generate_line_tests,
        generate_area_tests,
        generate_scatter_tests,
        generate_heatmap_tests,
        generate_pie_tests,
        generate_histogram_tests,
        generate_boxplot_tests,
        generate_lollipop_tests,
        generate_radar_tests,
        generate_rose_tests,
        generate_waterfall_tests,
        generate_funnel_tests,
        generate_gauge_tests,
        generate_treemap_tests,
        generate_sunburst_tests,
        generate_sankey_tests,
        generate_streamgraph_tests,
        generate_candlestick_tests,
        generate_density_tests,
        generate_facet_tests,
    ]
    
    for gen in generators:
        all_tests.extend(gen())
    
    # Save all test cases
    for tc in all_tests:
        path = OUTPUT_DIR / f"{tc['test_id']}.json"
        with open(path, 'w') as f:
            json.dump(tc, f, indent=2)
    
    # Save manifest
    manifest = [{"test_id": tc["test_id"], "chart_type": tc["input"]["chart_spec"]["chartType"],
                 "description": tc["description"]} for tc in all_tests]
    with open(OUTPUT_DIR / "manifest.json", 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated {len(all_tests)} test cases in {OUTPUT_DIR}/")
    for ct in sorted(set(tc["input"]["chart_spec"]["chartType"] for tc in all_tests)):
        n = sum(1 for tc in all_tests if tc["input"]["chart_spec"]["chartType"] == ct)
        print(f"  {ct}: {n}")


if __name__ == "__main__":
    generate_all()
