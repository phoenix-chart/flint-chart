import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ChartAssemblyInput } from 'flint-chart';
import { renderChart } from '../src/render/index.js';

const sales: ChartAssemblyInput = {
  data: {
    values: [
      { region: 'North', revenue: 120 },
      { region: 'South', revenue: 90 },
      { region: 'East', revenue: 150 },
      { region: 'West', revenue: 70 },
    ],
  },
  semantic_types: { region: 'Category', revenue: 'Quantity' },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: { x: { field: 'region' }, y: { field: 'revenue' } },
    baseSize: { width: 360, height: 240 },
  },
};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('renderChart → PNG', () => {
  for (const backend of ['vegalite', 'echarts', 'chartjs'] as const) {
    it(`renders a ${backend} bar chart to a non-trivial PNG`, async () => {
      const res = await renderChart(sales, backend, { format: 'png' });
      expect(res.backend).toBe(backend);
      expect(res.mimeType).toBe('image/png');
      expect(res.buffer).toBeInstanceOf(Buffer);
      expect(res.buffer!.length).toBeGreaterThan(1000);
      expect(res.buffer!.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
      expect(pngDimensions(res.buffer!)).toEqual({ width: res.width, height: res.height });
      expect(res.base64).toBeTruthy();
      expect(Array.isArray(res.warnings)).toBe(true);
    });
  }
});

describe('renderChart → SVG', () => {
  for (const backend of ['vegalite', 'echarts'] as const) {
    it(`renders a ${backend} bar chart to SVG markup`, async () => {
      const res = await renderChart(sales, backend, { format: 'svg' });
      expect(res.mimeType).toBe('image/svg+xml');
      expect(res.svg).toContain('<svg');
      expect(res.buffer).toBeUndefined();
    });
  }

  it('rejects SVG output for chartjs', async () => {
    await expect(renderChart(sales, 'chartjs', { format: 'svg' })).rejects.toThrow(
      /png output only/i,
    );
  });
});

describe('input guards', () => {
  it('rejects remote data.url (SSRF guard)', async () => {
    const bad = {
      ...sales,
      data: { url: 'http://169.254.169.254/latest/meta-data/' },
    } as unknown as ChartAssemblyInput;
    await expect(renderChart(bad, 'vegalite')).rejects.toThrow(/url fetching is disabled/i);
  });

  it('rejects local data.url without configured data roots', async () => {
    const bad = {
      ...sales,
      data: { url: 'sales.csv' },
    } as unknown as ChartAssemblyInput;
    await expect(renderChart(bad, 'vegalite')).rejects.toThrow(/data.url references require/i);
  });

  it('loads local CSV data.url from configured data roots', async () => {
    const dataRoot = mkdtempSync(join(tmpdir(), 'flint-mcp-data-'));
    try {
      writeFileSync(join(dataRoot, 'sales.csv'), 'region,revenue\nNorth,120\nSouth,90\n');
      const input = {
        ...sales,
        data: { url: 'sales.csv' },
      } as unknown as ChartAssemblyInput;
      const res = await renderChart(input, 'vegalite', {
        format: 'svg',
        dataRoots: [dataRoot],
      });
      expect(res.mimeType).toBe('image/svg+xml');
      expect(res.svg).toContain('<svg');
    } finally {
      rmSync(dataRoot, { recursive: true, force: true });
    }
  });
});
