# Skill Optimization Loop

How we iteratively test and improve the flint-chart authoring skill
(`agent-skills/SKILL.md`) so that LLMs reliably produce correct
`ChartAssemblyInput` JSON from the skill document **alone** (closed-book).

This file describes the *method only*. All scripts, datasets, prompts, and
run artifacts are work items and live under [`work/`](work/).

## Step 0 — seed benchmark

Seed from `../visbench`: use Spider, TidyTuesday, and vega-datasets as the
starting pool. Take **only the datasets** — questions and charts are
generated fresh in the loop.

> **Start clean each experiment.** Reusable across runs: the seed datasets
> and the `work/` scripts. Everything else — questions, generated charts,
> grades, round results — is **tuned to a specific SKILL.md revision**, so
> don't treat it as ground truth; anchoring on it biases the next run. Prior
> artifacts are parked in `work/archive/` for reference only. Regenerate
> questions and results fresh.
>
> **The harness evolves.** The `work/` scripts (generation, transformation,
> rendering, grading) are a starting point, not fixed — adapt them to new
> chart types, datasets, models, or grading needs. Note meaningful changes
> in `log.md` so later runs know why the tooling looks the way it does.

## Models to use

- **Generate test data & questions:** GPT-5.5 (batch generation).
- **Test chart generation (the system under test):** several models —
  GPT-5.5 and GPT-5-mini — so we see how the skill holds up across a strong
  and a weaker model.
- **Grade:** GPT-5.5.

## The loop

1. **Generate test cases.** With GPT-5.5, batch-write visualization
   questions that exercise chart creation, each paired with a seed dataset.
   Keep every question × data pair reasonable — don't force a skewed chart
   onto data that doesn't support it.
2. **Run the skill across models.** For each question × data, have the test
   model do the full job: transform the data with a Python tool **and**
   author the chart through the Flint skill. The agent owns both the data
   transformation and the chart generation.
3. **Grade.** Score each question × transformed data × chart, inspecting
   both the generated code and the rendered image (png with a vison model).
4. **Diagnose.** For cases where the question and transformed data are
   reasonable but the chart is wrong, check whether the skill has an issue
   or is missing something important.
5. **Revise.** Edit the skill and move to the next round. Each round both
   re-runs selected existing questions and adds new ones; if a chart type
   is untested, find a new dataset (search online if needed) to add
   coverage.

**Finish when** (1) most cases are tested — accepting that some chart types
are inherently sparse — and (2) the skill is good and robust across the use
cases it's designed for.