# df-reference/

Reference snapshot from the Data Formulator repo, copied here verbatim
to inform the standalone Flint gallery / examples app.

**Do not ship these files as-is.** They have heavy DF-specific dependencies
(redux store, DF asset pipeline, MUI theme tokens, the `assembleVegaChart`
wrapper that layers DF semantics on top of `assembleVegaLite`).

## Contents

| File | Purpose | DF-only deps |
|---|---|---|
| `gallery/ChartGallery.tsx` | Main gallery page — renders each test case across all four backends with collapsible spec viewers. | `assembleVegaChart`, `channels`, `CHART_ICONS`, `Channel`/`EncodingItem` types |
| `gallery/GallerySidebar.tsx` | Tree-style sidebar navigation backed by `GALLERY_TREE`. | `borderColor` token, `CHART_ICONS` |
| `components/ChartTemplates.tsx` | Exports `channels` (full encoding-channel list) and `CHART_ICONS` (PNG/SVG asset map per chart type). | DF asset imports |
| `components/ComponentType.tsx` | DF's `Channel`, `EncodingItem`, `ChartTemplate` types. | None significant — but largely overlaps with what Flint already exports |
| `app/utils.tsx` | Includes `assembleVegaChart` — the DF wrapper that expands DF encodings into a Flint `ChartAssemblyInput` and calls `assembleVegaLite`. The relevant function is the entry point; the rest of the file is unrelated DF helpers. | DF Field/Type model |
| `app/tokens.ts` | DF's MUI palette/spacing tokens (`borderColor`, etc.). | None functionally — could be inlined in the Flint gallery. |

## How to use this when building the standalone Flint gallery

1. Strip DF dependencies:
   - Replace `assembleVegaChart(...)` calls with direct `assembleVegaLite(...)` (and friends) calls. `assembleVegaChart` exists only to bridge DF's encoding-shelf data structures to Flint's `ChartAssemblyInput`. The gallery's `TestCase` already carries `chartType + encodingMap + fields + data + metadata` — those map cleanly onto `ChartAssemblyInput`.
   - Drop `channels` import in favor of the channel list from `vlGetTemplateChannels` (already exported from Flint).
   - Drop `CHART_ICONS` or replace with simple text labels / inline SVGs in v1.
   - Drop `borderColor` token — inline the color value.

2. Keep:
   - The collapsible "Spec Disclosure" UX.
   - The four-backend side-by-side rendering layout.
   - The integration with `GALLERY_TREE` / `findPage` / `DEFAULT_PATH` from Flint's `test-data/`.

3. Package as a minimal Vite + React + MUI app under `examples/gallery/` with its own `package.json` and `vite.config.ts`. The example app should depend on Flint via a workspace / `file:` link during development.

## Why this is committed without DF history

These files were copied with `cp`, not `git subtree`, because:
- Most are not destined to ship — they're scaffolding for the Flint-native rewrite.
- DF's history for these files is dominated by DF-specific changes (theming, redux, i18n) that would be noise in Flint's log.
- Once the Flint-native gallery exists under `examples/gallery/`, this `df-reference/` directory should be deleted.
