// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { assembleVegaLite } from '../src';

/**
 * Regression: a boxplot with a color field subdividing a categorical axis must
 * dodge the boxes side-by-side (xOffset), not overlay them at the same x
 * position. Overlaid boxes hide whichever group is drawn first, so a grouped
 * boxplot looked like a single mis-coloured box per category.
 */

function makeGroupedBoxplotInput(
  categories: string[],
  groups: string[],
  axis: 'x' | 'y' = 'x',
) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const data: any[] = [];
  for (const c of categories) {
    for (const g of groups) {
      for (let i = 0; i < 20; i++) {
        data.push({ Category: c, Group: g, Score: Math.round(rnd() * 100) });
      }
    }
  }
  const catEnc = { field: 'Category' };
  const valEnc = { field: 'Score' };
  return {
    data: { values: data },
    semantic_types: { Category: 'Category', Group: 'Category', Score: 'Quantity' },
    chart_spec: {
      chartType: 'Boxplot',
      encodings:
        axis === 'x'
          ? { x: catEnc, y: valEnc, color: { field: 'Group' } }
          : { y: catEnc, x: valEnc, color: { field: 'Group' } },
      baseSize: { width: 500, height: 320 },
    },
  };
}

describe('grouped boxplot dodging', () => {
  it('adds an xOffset on the color field so boxes dodge on a categorical x-axis', () => {
    const spec = assembleVegaLite(
      makeGroupedBoxplotInput(['Electronics', 'Clothing', 'Food'], ['Male', 'Female']),
    ) as any;
    expect(spec.encoding?.xOffset?.field).toBe('Group');
    expect(spec.encoding?.color?.field).toBe('Group');
    expect(spec.encoding?.yOffset).toBeUndefined();
  });

  it('shrinks the box size so dodged subgroups share one band', () => {
    const ungrouped = assembleVegaLite({
      ...makeGroupedBoxplotInput(['Electronics', 'Clothing', 'Food'], ['Male']),
      chart_spec: {
        chartType: 'Boxplot',
        encodings: { x: { field: 'Category' }, y: { field: 'Score' } },
        baseSize: { width: 500, height: 320 },
      },
    } as any) as any;
    const grouped = assembleVegaLite(
      makeGroupedBoxplotInput(['Electronics', 'Clothing', 'Food'], ['Male', 'Female']),
    ) as any;
    const sizeOf = (s: any) => (typeof s.mark === 'object' ? s.mark.size : undefined);
    expect(sizeOf(grouped)).toBeLessThan(sizeOf(ungrouped));
  });

  it('uses yOffset when the categorical axis is y (horizontal boxplot)', () => {
    const spec = assembleVegaLite(
      makeGroupedBoxplotInput(['Electronics', 'Clothing', 'Food'], ['Male', 'Female'], 'y'),
    ) as any;
    expect(spec.encoding?.yOffset?.field).toBe('Group');
    expect(spec.encoding?.xOffset).toBeUndefined();
  });

  it('does not add an offset when there is no color field', () => {
    const spec = assembleVegaLite({
      data: { values: [{ Category: 'A', Score: 1 }, { Category: 'B', Score: 2 }] },
      semantic_types: { Category: 'Category', Score: 'Quantity' },
      chart_spec: {
        chartType: 'Boxplot',
        encodings: { x: { field: 'Category' }, y: { field: 'Score' } },
        baseSize: { width: 500, height: 320 },
      },
    } as any) as any;
    expect(spec.encoding?.xOffset).toBeUndefined();
    expect(spec.encoding?.yOffset).toBeUndefined();
  });
});
