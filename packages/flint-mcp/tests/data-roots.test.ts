// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ChartAssemblyInput } from 'flint-chart';
import { resolveDataSource, resolveDataRoots } from '../src/render/index.js';

const CHART_SPEC = {
  chartType: 'Bar Chart',
  encodings: { x: { field: 'region' }, y: { field: 'revenue' } },
};

function inputWithUrl(url: string): ChartAssemblyInput {
  return {
    data: { url },
    semantic_types: { region: 'Category', revenue: 'Quantity' },
    chart_spec: CHART_SPEC,
  } as unknown as ChartAssemblyInput;
}

const CSV = 'region,revenue\nNorth,120\nSouth,90\nEast,150\n';

let root: string;

beforeEach(() => {
  // realpathSync so macOS /var → /private/var symlink doesn't trip the
  // inside-root containment check.
  root = realpathSync(mkdtempSync(join(tmpdir(), 'flint-data-roots-')));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('data roots: local data.url loading', () => {
  it('loads a CSV referenced by a plain relative name under the root', () => {
    writeFileSync(join(root, 'sales.csv'), CSV);
    const out = resolveDataSource(inputWithUrl('sales.csv'), { dataRoots: [root] });
    expect((out.data as any).values).toHaveLength(3);
    expect((out.data as any).values[0]).toEqual({ region: 'North', revenue: 120 });
    expect((out.data as any).url).toBeUndefined();
  });

  it('loads a CSV from a nested subdirectory under the root', () => {
    mkdirSync(join(root, 'reports', '2026'), { recursive: true });
    writeFileSync(join(root, 'reports', '2026', 'sales.csv'), CSV);
    const out = resolveDataSource(inputWithUrl('reports/2026/sales.csv'), {
      dataRoots: [root],
    });
    expect((out.data as any).values).toHaveLength(3);
  });

  it('accepts a "./"-prefixed relative reference', () => {
    writeFileSync(join(root, 'sales.csv'), CSV);
    const out = resolveDataSource(inputWithUrl('./sales.csv'), { dataRoots: [root] });
    expect((out.data as any).values).toHaveLength(3);
  });

  it('accepts an absolute path that lives inside a configured root', () => {
    const abs = join(root, 'sales.csv');
    writeFileSync(abs, CSV);
    const out = resolveDataSource(inputWithUrl(abs), { dataRoots: [root] });
    expect((out.data as any).values).toHaveLength(3);
  });

  it('accepts a file:// URL inside a configured root', () => {
    const abs = join(root, 'sales.csv');
    writeFileSync(abs, CSV);
    const url = pathToFileURL(abs).href;
    const out = resolveDataSource(inputWithUrl(url), { dataRoots: [root] });
    expect((out.data as any).values).toHaveLength(3);
  });

  it('loads a JSON array file', () => {
    writeFileSync(
      join(root, 'sales.json'),
      JSON.stringify([{ region: 'North', revenue: 120 }]),
    );
    const out = resolveDataSource(inputWithUrl('sales.json'), { dataRoots: [root] });
    expect((out.data as any).values).toEqual([{ region: 'North', revenue: 120 }]);
  });

  it('loads a JSON { values: [...] } wrapper file', () => {
    writeFileSync(
      join(root, 'sales.json'),
      JSON.stringify({ values: [{ region: 'North', revenue: 120 }] }),
    );
    const out = resolveDataSource(inputWithUrl('sales.json'), { dataRoots: [root] });
    expect((out.data as any).values).toEqual([{ region: 'North', revenue: 120 }]);
  });

  it('loads a TSV file', () => {
    writeFileSync(join(root, 'sales.tsv'), 'region\trevenue\nNorth\t120\n');
    const out = resolveDataSource(inputWithUrl('sales.tsv'), { dataRoots: [root] });
    expect((out.data as any).values).toEqual([{ region: 'North', revenue: 120 }]);
  });
});

describe('data roots: multiple roots', () => {
  it('resolves a reference found only in the second configured root', () => {
    const second = realpathSync(mkdtempSync(join(tmpdir(), 'flint-data-roots-2-')));
    try {
      writeFileSync(join(second, 'sales.csv'), CSV);
      const out = resolveDataSource(inputWithUrl('sales.csv'), {
        dataRoots: [root, second],
      });
      expect((out.data as any).values).toHaveLength(3);
    } finally {
      rmSync(second, { recursive: true, force: true });
    }
  });

  it('resolveDataRoots dedupes and resolves to real absolute directories', () => {
    const roots = resolveDataRoots([root, root, `${root}/`]);
    expect(roots).toEqual([root]);
  });
});

describe('data roots: security + error handling', () => {
  it('rejects a relative reference that escapes the root via ".."', () => {
    writeFileSync(join(root, 'sales.csv'), CSV);
    const secret = join(root, '..', 'secret.csv');
    writeFileSync(secret, CSV);
    try {
      expect(() =>
        resolveDataSource(inputWithUrl('../secret.csv'), { dataRoots: [root] }),
      ).toThrow();
    } finally {
      rmSync(secret, { force: true });
    }
  });

  it('rejects an absolute path outside every configured root', () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), 'flint-outside-')));
    try {
      const abs = join(outside, 'secret.csv');
      writeFileSync(abs, CSV);
      expect(() =>
        resolveDataSource(inputWithUrl(abs), { dataRoots: [root] }),
      ).toThrow(/outside the configured data roots|not found under configured data roots/i);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('rejects a local reference when no data roots are configured', () => {
    expect(() => resolveDataSource(inputWithUrl('sales.csv'), {})).toThrow(
      /require --data-roots/i,
    );
  });

  it('rejects a missing file under a configured root', () => {
    expect(() =>
      resolveDataSource(inputWithUrl('nope.csv'), { dataRoots: [root] }),
    ).toThrow(/not found under configured data roots/i);
  });

  it('rejects an unsupported file extension', () => {
    writeFileSync(join(root, 'notes.txt'), 'hello');
    expect(() =>
      resolveDataSource(inputWithUrl('notes.txt'), { dataRoots: [root] }),
    ).toThrow(/\.json, \.csv, or \.tsv/i);
  });

  it('rejects a remote http(s) data.url even with roots configured', () => {
    expect(() =>
      resolveDataSource(inputWithUrl('https://example.com/sales.csv'), {
        dataRoots: [root],
      }),
    ).toThrow(/remote data\.url fetching is disabled/i);
  });
});
