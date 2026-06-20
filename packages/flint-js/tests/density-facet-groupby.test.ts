// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { assembleVegaLite } from '../src';

/**
 * Regression: a faceted density plot must include the facet field (column/row)
 * in the density transform's `groupby`. The transform only emits its
 * value/density columns plus the grouped fields, so omitting the facet field
 * dropped it from the transformed data — the column facet then collapsed to a
 * single "undefined" panel with every facet pooled together.
 */

function makeDensityInput(opts: { color?: boolean; column?: boolean; row?: boolean }) {
  let seed = 13;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const sites = ['Lab A', 'Lab B'];
  const batches = ['Morning', 'Evening'];
  const data: any[] = [];
  for (const site of sites) {
    for (const batch of batches) {
      for (let i = 0; i < 60; i++) {
        data.push({ Reading: Math.round(rnd() * 90), Batch: batch, Site: site });
      }
    }
  }
  const encodings: Record<string, any> = { x: { field: 'Reading' } };
  if (opts.color) encodings.color = { field: 'Batch' };
  if (opts.column) encodings.column = { field: 'Site' };
  if (opts.row) encodings.row = { field: 'Site' };
  return {
    data: { values: data },
    semantic_types: { Reading: 'Quantity', Batch: 'Category', Site: 'Category' },
    chart_spec: { chartType: 'Density Plot', encodings, baseSize: { width: 560, height: 320 } },
  };
}

const densityGroupby = (spec: any): string[] =>
  (spec.transform ?? []).find((t: any) => t.density)?.groupby ?? [];

describe('faceted density plot groupby', () => {
  it('keeps the column facet field in the density transform groupby', () => {
    const spec = assembleVegaLite(makeDensityInput({ color: true, column: true })) as any;
    const groupby = densityGroupby(spec);
    expect(groupby).toContain('Site');
    expect(groupby).toContain('Batch');
    expect(spec.encoding?.facet?.field).toBe('Site');
  });

  it('keeps the row facet field in the density transform groupby', () => {
    const spec = assembleVegaLite(makeDensityInput({ color: true, row: true })) as any;
    expect(densityGroupby(spec)).toContain('Site');
  });

  it('groups a facet-only density (no color) by the facet field', () => {
    const spec = assembleVegaLite(makeDensityInput({ column: true })) as any;
    expect(densityGroupby(spec)).toContain('Site');
  });

  it('leaves an ungrouped single-distribution density without groupby', () => {
    const spec = assembleVegaLite(makeDensityInput({})) as any;
    expect(densityGroupby(spec)).toHaveLength(0);
  });
});
