import type { TestCase } from 'flint-chart/test-data';

// Stress / degenerate variants exist for test coverage but look messy in a
// gallery — keep them out of the wall.
const SKIP_TAGS = new Set(['overflow', 'cutoff', 'edge-case', 'degenerate', 'stress']);

/**
 * Pick a small, diverse set of examples for one chart type. Drops stress/edge
 * cases, then samples evenly across the remaining configs (different colors,
 * orientations, sizes…) so each chart type shows a varied handful of tiles —
 * mirroring the multiple-examples-per-type feel of the Vega-Lite gallery.
 */
export function selectVariants(tests: TestCase[], cap = 4): TestCase[] {
  const clean = tests.filter((t) => !(t.tags ?? []).some((tag) => SKIP_TAGS.has(tag)));
  const pool = clean.length > 0 ? clean : tests;
  if (pool.length <= cap) return pool;

  const out: TestCase[] = [];
  const stride = pool.length / cap;
  for (let i = 0; i < cap; i++) out.push(pool[Math.floor(i * stride)]);
  return out;
}
