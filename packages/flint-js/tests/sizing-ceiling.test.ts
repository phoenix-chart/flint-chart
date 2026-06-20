// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { assembleVegaLite } from '../src';
import { deriveStretchCaps, resolveStretchCaps, resolveBaseSize } from '../src/core/compute-layout';

/**
 * Regression coverage for the `baseSize` (target) + `canvasSize` (hard ceiling)
 * sizing model.
 *
 * `baseSize` is the target layout size. The chart may stretch past it up to a
 * ceiling: either an explicit `canvasSize`, or `baseSize × maxStretch`
 * (default 2×) when no ceiling is given. The ceiling is applied per dimension —
 * βx = canvasSize.width / baseSize.width, βy = canvasSize.height / baseSize.height
 * (each clamped ≥ 1) — and bounds the whole chart, including faceted grids.
 */

const BASE = { width: 400, height: 320 };

describe('deriveStretchCaps (canvasSize → per-dimension βx/βy)', () => {
  it('falls back to maxStretch (default 2) when no ceiling is given', () => {
    expect(deriveStretchCaps(BASE, undefined, {})).toEqual({
      maxStretchX: 2,
      maxStretchY: 2,
    });
  });

  it('honors an explicit maxStretch option as the fallback ceiling', () => {
    expect(deriveStretchCaps(BASE, undefined, { maxStretch: 1.5 })).toEqual({
      maxStretchX: 1.5,
      maxStretchY: 1.5,
    });
  });

  it('derives per-dimension caps from a canvasSize larger than the base', () => {
    expect(deriveStretchCaps(BASE, { width: 480, height: 360 }, {})).toEqual({
      maxStretchX: 480 / 400, // 1.2
      maxStretchY: 360 / 320, // 1.125
    });
  });

  it('clamps each cap to >= 1 when the ceiling is smaller than the base', () => {
    expect(deriveStretchCaps(BASE, { width: 300, height: 200 }, {})).toEqual({
      maxStretchX: 1,
      maxStretchY: 1,
    });
  });
});

describe('resolveStretchCaps (per-dimension override resolution)', () => {
  it('defaults both dimensions to maxStretch (or 2)', () => {
    expect(resolveStretchCaps({})).toEqual({ x: 2, y: 2 });
    expect(resolveStretchCaps({ maxStretch: 1.5 })).toEqual({ x: 1.5, y: 1.5 });
  });

  it('lets maxStretchX/maxStretchY override per dimension and clamps to >= 1', () => {
    expect(resolveStretchCaps({ maxStretchX: 1.2, maxStretchY: 3 })).toEqual({ x: 1.2, y: 3 });
    expect(resolveStretchCaps({ maxStretchX: 0.5, maxStretchY: 0.8 })).toEqual({ x: 1, y: 1 });
  });
});

describe('resolveBaseSize (base clamps to the canvasSize ceiling)', () => {
  it('defaults to 400x320 when neither base nor ceiling is given', () => {
    expect(resolveBaseSize(undefined, undefined)).toEqual({ width: 400, height: 320 });
  });

  it('passes an explicit base through unchanged when no ceiling is given', () => {
    expect(resolveBaseSize({ width: 500, height: 300 }, undefined)).toEqual({ width: 500, height: 300 });
  });

  it('clamps the DEFAULT base down to a smaller ceiling (the reported bug)', () => {
    // canvasSize set, baseSize omitted, ceiling < default base → base must shrink.
    expect(resolveBaseSize(undefined, { width: 300, height: 200 })).toEqual({ width: 300, height: 200 });
  });

  it('clamps an explicit base larger than the ceiling, per dimension', () => {
    expect(resolveBaseSize({ width: 500, height: 500 }, { width: 480, height: 360 })).toEqual({
      width: 480,
      height: 360,
    });
  });

  it('leaves a base that already fits within the ceiling untouched', () => {
    expect(resolveBaseSize({ width: 400, height: 300 }, { width: 600, height: 400 })).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('clamps only the dimension that exceeds the ceiling', () => {
    // default base 400x320, ceiling 500 wide but only 200 tall → width kept, height clamped.
    expect(resolveBaseSize(undefined, { width: 500, height: 200 })).toEqual({ width: 400, height: 200 });
  });
});

function manyBars(canvasSize?: { width: number; height: number }) {
  const data: Array<{ cat: string; val: number }> = [];
  for (let i = 0; i < 40; i++) {
    data.push({ cat: 'category-label-' + i, val: (i * 17) % 50 });
  }
  const chart_spec: Record<string, unknown> = {
    chartType: 'Bar Chart',
    encodings: { x: { field: 'cat' }, y: { field: 'val' } },
    baseSize: { ...BASE },
  };
  if (canvasSize) chart_spec.canvasSize = canvasSize;
  return {
    data: { values: data },
    semantic_types: { cat: 'Category', val: 'Quantity' },
    chart_spec,
  };
}

/** Total banded plot width ≈ number of categories × per-band step. */
function bandTotalWidth(input: unknown): number {
  const spec = assembleVegaLite(input as never) as { width?: { step?: number } };
  const step = spec.width?.step;
  expect(typeof step).toBe('number');
  return 40 * (step as number);
}

describe('canvasSize ceiling clamps a stretched chart', () => {
  it('a dense banded axis wants more than the ceiling, but the ceiling holds it in', () => {
    const naturalWidth = bandTotalWidth(manyBars()); // no ceiling → up to base × 2
    const cappedWidth = bandTotalWidth(manyBars({ width: 480, height: 360 }));

    // Without a ceiling the chart naturally overflows the 480px ceiling...
    expect(naturalWidth).toBeGreaterThan(480);
    // ...but stays within the default base × maxStretch (400 × 2 = 800) budget.
    expect(naturalWidth).toBeLessThanOrEqual(800);

    // With the ceiling, the same chart is held to <= canvasSize.width.
    expect(cappedWidth).toBeLessThanOrEqual(480);
    // The ceiling genuinely tightened the layout (smaller bands than the default).
    expect(cappedWidth).toBeLessThan(naturalWidth);
  });

  it('shrinks to fit a canvasSize smaller than the default base (no baseSize set)', () => {
    // 24 dense categories. With no ceiling the chart grows to fill its natural
    // demand (well past 300px). A canvasSize of 300 — smaller than the default
    // 400px base — must shrink the chart to fit the box, not overflow it.
    const data: Array<{ cat: string; val: number }> = [];
    for (let i = 0; i < 24; i++) data.push({ cat: 'c' + i, val: (i * 7) % 30 });
    const base = {
      data: { values: data },
      semantic_types: { cat: 'Category', val: 'Quantity' },
      chart_spec: { chartType: 'Bar Chart', encodings: { x: { field: 'cat' }, y: { field: 'val' } } },
    };
    const stepOf = (spec: { width?: { step?: number } }) => {
      expect(typeof spec.width?.step).toBe('number');
      return spec.width!.step as number;
    };

    const natural = 24 * stepOf(assembleVegaLite(base as never) as never);
    const boxed = 24 * stepOf(
      assembleVegaLite({ ...base, chart_spec: { ...base.chart_spec, canvasSize: { width: 300, height: 220 } } } as never) as never,
    );

    // The chart naturally wants more than the 300px box...
    expect(natural).toBeGreaterThan(300);
    // ...but the smaller canvasSize shrinks it to fit (regression: it used to
    // stay at the 400px default base and overflow the box).
    expect(boxed).toBeLessThanOrEqual(300);
    expect(boxed).toBeLessThan(natural);
  });
});
