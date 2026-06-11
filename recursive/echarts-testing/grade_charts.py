"""
LLM-based chart grading for ECharts rendered images.
Uses GPT-5.5 to evaluate each rendered chart for quality.

Grading criteria:
1. Layout correctness (axes, margins, no overlap/clipping)
2. Text readability (labels, legends, axis titles)
3. Data representation accuracy (correct chart type, values match data)
4. Visual quality (colors, proportions, aesthetics)

Output: JSON report with scores and notes per chart.
"""

import os
import json
import base64
import sys
from pathlib import Path

# Use OpenAI API for GPT-5.5
try:
    from openai import OpenAI
except ImportError:
    print("Installing openai...")
    os.system(f"{sys.executable} -m pip install openai -q")
    from openai import OpenAI

RENDERED_DIR = Path(__file__).parent / "rendered"
TEST_CASES_DIR = Path(__file__).parent / "test_cases"
OUTPUT_FILE = Path(__file__).parent / "grading_results.json"

GRADING_PROMPT = """You are a chart quality inspector. Evaluate this rendered chart image.

Test case info:
- Chart type: {chart_type}
- Description: {description}
- Data fields: {fields}
- Canvas size: {width}x{height}

Grade the chart on these criteria (1-5 each):
1. **Layout** — Are axes/margins correct? No clipping/overlap? Good use of space?
2. **Text** — Are all labels readable? No overlap? Properly rotated if needed?
3. **Data accuracy** — Does the chart correctly represent the data? Right chart type shown?
4. **Visual quality** — Good colors, proportions, aesthetics?

Respond in JSON format:
{{
  "layout": <1-5>,
  "text": <1-5>,
  "data_accuracy": <1-5>,
  "visual_quality": <1-5>,
  "overall": <1-5>,
  "issues": ["list of specific issues found, empty if none"],
  "category": "pass" | "rendering_issue" | "test_data_issue"
}}

Be strict. A score of 5 means no issues at all. 4 means minor issues. 3 means noticeable problems. 2 means significant issues. 1 means fundamentally broken.
"""


def encode_image(image_path: Path) -> str:
    """Read image and return base64 encoding."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_test_info(test_id: str) -> dict:
    """Load test case metadata."""
    tc_path = TEST_CASES_DIR / f"{test_id}.json"
    if tc_path.exists():
        tc = json.load(open(tc_path))
        inp = tc.get("input", {})
        chart_spec = inp.get("chart_spec", {})
        data_values = inp.get("data", {}).get("values", [])
        fields = list(data_values[0].keys()) if data_values else []
        return {
            "chart_type": chart_spec.get("chartType", "Unknown"),
            "description": tc.get("description", ""),
            "fields": ", ".join(fields),
            "data_count": len(data_values),
        }
    return {"chart_type": "Unknown", "description": "", "fields": "", "data_count": 0}


def get_canvas_size(test_id: str) -> tuple:
    """Get canvas size from rendered spec."""
    spec_path = RENDERED_DIR / f"{test_id}_spec.json"
    if spec_path.exists():
        spec = json.load(open(spec_path))
        return spec.get("_width", 0), spec.get("_height", 0)
    return (0, 0)


def grade_chart(client: OpenAI, test_id: str) -> dict:
    """Grade a single chart using GPT-5.5."""
    image_path = RENDERED_DIR / f"{test_id}.png"
    if not image_path.exists():
        return {"error": f"Image not found: {image_path}"}

    info = get_test_info(test_id)
    width, height = get_canvas_size(test_id)

    prompt = GRADING_PROMPT.format(
        chart_type=info["chart_type"],
        description=info["description"],
        fields=info["fields"],
        width=width,
        height=height,
    )

    b64_image = encode_image(image_path)

    try:
        response = client.chat.completions.create(
            model="gpt-5.5",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{b64_image}",
                                "detail": "high",
                            },
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=500,
        )

        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        result["test_id"] = test_id
        return result
    except Exception as e:
        return {"test_id": test_id, "error": str(e)}


def main():
    # Find all rendered PNGs
    png_files = sorted(RENDERED_DIR.glob("*.png"))
    test_ids = [p.stem for p in png_files]

    print(f"Found {len(test_ids)} charts to grade")

    # Check for API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Try to read from common locations
        key_paths = [
            Path.home() / ".openai_key",
            Path.home() / ".env",
        ]
        for kp in key_paths:
            if kp.exists():
                content = kp.read_text().strip()
                if content.startswith("sk-"):
                    api_key = content
                    break
                for line in content.split("\n"):
                    if line.startswith("OPENAI_API_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"')
                        break

    if not api_key:
        print("ERROR: No OPENAI_API_KEY found. Set it as environment variable.")
        print("Usage: OPENAI_API_KEY=sk-... python grade_charts.py")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    results = []
    for i, test_id in enumerate(test_ids):
        print(f"  [{i+1}/{len(test_ids)}] Grading {test_id}...", end=" ", flush=True)
        result = grade_chart(client, test_id)
        results.append(result)

        if "error" in result:
            print(f"ERROR: {result['error'][:60]}")
        else:
            overall = result.get("overall", "?")
            category = result.get("category", "?")
            issues = result.get("issues", [])
            print(f"Score: {overall}/5 [{category}]" + (f" Issues: {issues}" if issues else ""))

    # Save results
    json.dump(results, open(OUTPUT_FILE, "w"), indent=2)
    print(f"\nResults saved to {OUTPUT_FILE}")

    # Summary
    scored = [r for r in results if "overall" in r]
    if scored:
        avg = sum(r["overall"] for r in scored) / len(scored)
        passes = sum(1 for r in scored if r.get("category") == "pass")
        render_issues = [r for r in scored if r.get("category") == "rendering_issue"]
        data_issues = [r for r in scored if r.get("category") == "test_data_issue"]

        print(f"\n=== Summary ===")
        print(f"Average score: {avg:.2f}/5")
        print(f"Passing: {passes}/{len(scored)}")
        print(f"Rendering issues: {len(render_issues)}")
        print(f"Test data issues: {len(data_issues)}")

        if render_issues:
            print(f"\nCharts with rendering issues:")
            for r in render_issues:
                print(f"  - {r['test_id']}: {r.get('issues', [])}")


if __name__ == "__main__":
    main()
