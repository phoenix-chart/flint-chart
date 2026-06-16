#!/usr/bin/env python3
"""
Vision grading for rendered chart PNGs via Azure OpenAI (Entra ID auth).

Reads Azure config from the repo-root .env (AZURE_API_BASE, AZURE_MODELS,
AZURE_API_VERSION) and authenticates with DefaultAzureCredential — no API key.
Calls the chat-completions REST endpoint directly (urllib) so it does not depend
on the openai SDK.

For every <name>.png in the input dir (optionally with a sibling <name>.json
Vega-Lite spec for context), it asks a vision model to score the render on
Layout / Text / Data accuracy / Visual quality and flag concrete issues, then
writes a JSON report and prints a summary.

Usage:
  python3 recursive/grade_vision.py --dir /tmp/vis [--out /tmp/vis/grades.json]
"""
import os
import sys
import json
import time
import base64
import argparse
import urllib.request
import urllib.error
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


GRADING_PROMPT = """You are a strict chart-rendering inspector. Evaluate this rendered chart image for VISUAL/RENDERING quality only.

Context:
- Chart type: {chart_type}
- Notes: {notes}
- Canvas: {canvas}

Look specifically for rendering problems: clipped or cut-off marks/labels, overlapping or unreadable text, axis labels colliding, legend overflowing or detached, bars/ticks misaligned with their rows, illegible density, wrong or missing axis titles, color bands that obscure the data, or anything that would make a viewer misread the chart.

Score each 1-5 (5 = flawless, 4 = minor nit, 3 = noticeable problem, 2 = significant, 1 = broken):
- layout: axes, margins, spacing, alignment, no clipping/overlap
- text: readability of all labels/legends/titles
- data_accuracy: the marks plausibly and correctly represent the described data and chart type
- visual_quality: colors, proportions, overall clarity

Respond with ONLY a JSON object, no prose:
{{"layout":<1-5>,"text":<1-5>,"data_accuracy":<1-5>,"visual_quality":<1-5>,"overall":<1-5>,"issues":["concrete issue", "..."],"category":"pass"|"rendering_issue"|"data_issue"}}
"""


def get_token() -> str:
    from azure.identity import DefaultAzureCredential
    return DefaultAzureCredential().get_token(
        "https://cognitiveservices.azure.com/.default"
    ).token


def grade_image(base: str, dep: str, ver: str, token: str, png: Path, ctx: dict):
    data_url = "data:image/png;base64," + base64.b64encode(png.read_bytes()).decode()
    prompt = GRADING_PROMPT.format(
        chart_type=ctx.get("chart_type", "unknown"),
        notes=ctx.get("notes", ""),
        canvas=ctx.get("canvas", ""),
    )
    body = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_completion_tokens": 1200,
        "response_format": {"type": "json_object"},
    }
    url = f"{base}/openai/deployments/{dep}/chat/completions?api-version={ver}"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
            content = d["choices"][0]["message"]["content"]
            return json.loads(content), None
        except urllib.error.HTTPError as e:
            msg = f"HTTP {e.code}: {e.read().decode()[:300]}"
            if e.code in (429, 500, 503) and attempt < 2:
                time.sleep(5 * (attempt + 1))
                continue
            return None, msg
        except Exception as e:
            if attempt < 2:
                time.sleep(3)
                continue
            return None, f"{type(e).__name__}: {str(e)[:300]}"
    return None, "exhausted retries"


def spec_context(name: str, spec_path: Path) -> dict:
    ctx = {"chart_type": name, "notes": "", "canvas": ""}
    if not spec_path.exists():
        return ctx
    try:
        spec = json.loads(spec_path.read_text())
    except Exception:
        return ctx
    w = spec.get("width"); h = spec.get("height")
    if w or h:
        ctx["canvas"] = f"{w}x{h}"
    # Derive a tiny data-shape note from inline values if present.
    def find_values(o):
        if isinstance(o, dict):
            if isinstance(o.get("data"), dict) and isinstance(o["data"].get("values"), list):
                return o["data"]["values"]
            for v in o.values():
                r = find_values(v)
                if r:
                    return r
        elif isinstance(o, list):
            for v in o:
                r = find_values(v)
                if r:
                    return r
        return None
    vals = find_values(spec)
    if vals:
        keys = list(vals[0].keys()) if isinstance(vals[0], dict) else []
        ctx["notes"] = f"{len(vals)} rows, fields {keys}"
    return ctx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    load_env(REPO / ".env")
    base = os.environ["AZURE_API_BASE"].rstrip("/")
    dep = os.environ["AZURE_MODELS"]
    ver = os.environ.get("AZURE_API_VERSION", "2025-04-01-preview")
    print(f"Azure: {base} | deployment {dep} | api-version {ver}")

    token = get_token()
    d = Path(args.dir)
    pngs = sorted(d.glob("*.png"))
    if not pngs:
        print("no PNGs in", d)
        sys.exit(1)

    results = {}
    flagged = []
    for png in pngs:
        name = png.stem
        ctx = spec_context(name, png.with_suffix(".json"))
        grade, err = grade_image(base, dep, ver, token, png, ctx)
        if err:
            print(f"  ERROR  {name}: {err}")
            results[name] = {"error": err}
            continue
        results[name] = grade
        ov = grade.get("overall")
        cat = grade.get("category")
        mark = "OK " if (isinstance(ov, (int, float)) and ov >= 4 and cat == "pass") else "!! "
        print(f"  {mark}{name}: overall={ov} cat={cat} "
              f"L{grade.get('layout')} T{grade.get('text')} "
              f"D{grade.get('data_accuracy')} V{grade.get('visual_quality')}")
        if grade.get("issues"):
            for iss in grade["issues"]:
                print(f"        - {iss}")
        if mark.strip() == "!!":
            flagged.append(name)

    out = Path(args.out) if args.out else d / "grades.json"
    out.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {out}")
    print(f"Graded {len(pngs)} | flagged {len(flagged)}: {flagged}")


if __name__ == "__main__":
    main()
