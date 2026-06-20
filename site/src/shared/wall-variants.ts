import type { TestCase } from 'flint-chart/test-data';

// Stress / degenerate variants exist for test coverage but look messy in a
// gallery — keep them out of the wall.
const SKIP_TAGS = new Set(['overflow', 'cutoff', 'edge-case', 'degenerate', 'stress']);

/** Evenly sample `cap` items across `pool` (returns the whole pool when ≤ cap). */
function strideSample(pool: TestCase[], cap: number): TestCase[] {
  if (cap <= 0) return [];
  if (pool.length <= cap) return pool;
  const out: TestCase[] = [];
  const stride = pool.length / cap;
  for (let i = 0; i < cap; i++) out.push(pool[Math.floor(i * stride)]);
  return out;
}

/**
 * Pick a small, diverse set of examples for one chart type. Drops stress/edge
 * cases, then samples evenly across the remaining configs (different colors,
 * orientations, sizes…) so each chart type shows a varied handful of tiles —
 * mirroring the multiple-examples-per-type feel of the Vega-Lite gallery.
 *
 * A curated faceted (small-multiples) example, tagged `gallery-facet`, is always
 * pinned as the last tile when present, so main chart types advertise faceting
 * regardless of where the even sampling would otherwise land.
 */
export function selectVariants(tests: TestCase[], cap = 4): TestCase[] {
  const clean = tests.filter((t) => !(t.tags ?? []).some((tag) => SKIP_TAGS.has(tag)));
  const pool = clean.length > 0 ? clean : tests;

  const facetIdx = pool.findIndex((t) => (t.tags ?? []).includes('gallery-facet'));
  if (facetIdx === -1) return strideSample(pool, cap);

  // Pin the faceted example last; fill remaining slots from the rest.
  const facet = pool[facetIdx];
  const rest = pool.filter((_, i) => i !== facetIdx);
  return [...strideSample(rest, Math.max(cap - 1, 0)), facet];
}
