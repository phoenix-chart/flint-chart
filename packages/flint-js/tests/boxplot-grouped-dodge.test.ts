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

  const sizeOf = (s: any) => (typeof s.mark === 'object' ? s.mark.size : undefined);
  const stepOf = (s: any) => Number(s.width?.step ?? s.height?.step);
  // Vega-Lite's position band scale reserves ~20% of each step as padding, so a
  // band's usable drawing width is ~80% of the step. The per-subgroup lane pitch
  // is therefore (step * 0.8) / subgroups — a box wider than this overlaps its
  // neighbour inside the same group.
  const lanePitch = (s: any, subgroups: number) => (stepOf(s) * 0.8) / subgroups;

  it('fills most of each per-subgroup lane without overlapping its neighbour', () => {
    // With colorActsAsGroup, `width:{step, for:'position'}` makes the step span a
    // whole category band that Vega-Lite subdivides into one lane per subgroup.
    // A dodged box must fill most of its lane pitch but stay within it, otherwise
    // adjacent boxes in a group overlap.
    const subgroups = 2;
    const grouped = assembleVegaLite(
      makeGroupedBoxplotInput(['Electronics', 'Clothing', 'Food'], ['Male', 'Female']),
    ) as any;
    const pitch = lanePitch(grouped, subgroups);
    expect(sizeOf(grouped) / pitch).toBeGreaterThanOrEqual(0.75);
    expect(sizeOf(grouped)).toBeLessThan(pitch);
  });

  it('shrinks the boxes as the subgroup count grows (chart stays compact)', () => {
    // The band step is budgeted across categories, so adding more color groups
    // must make each box thinner rather than ballooning the chart width.
    const two = assembleVegaLite(
      makeGroupedBoxplotInput(['A', 'B', 'C', 'D'], ['G1', 'G2']),
    ) as any;
    const four = assembleVegaLite(
      makeGroupedBoxplotInput(['A', 'B', 'C', 'D'], ['G1', 'G2', 'G3', 'G4']),
    ) as any;
    // Boxes get thinner with more subgroups.
    expect(sizeOf(four)).toBeLessThan(sizeOf(two));
    // The band step grows sub-linearly with subgroups (budgeted across
    // categories), so the chart stays compact instead of ballooning per lane.
    expect(stepOf(four)).toBeLessThan(stepOf(two) * 2);
    // Each sub-lane (and thus each box) shrinks as subgroups are added.
    expect(stepOf(four) / 4).toBeLessThan(stepOf(two) / 2);
    // Boxes never exceed their lane pitch (no within-group overlap) yet still
    // fill most of it at both subgroup counts.
    expect(sizeOf(two)).toBeLessThan(lanePitch(two, 2));
    expect(sizeOf(four)).toBeLessThan(lanePitch(four, 4));
    expect(sizeOf(two) / lanePitch(two, 2)).toBeGreaterThanOrEqual(0.75);
    expect(sizeOf(four) / lanePitch(four, 4)).toBeGreaterThanOrEqual(0.75);
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
