import { describe, it, expect } from 'vitest';
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

describe('renderChart → PNG', () => {
  for (const backend of ['vegalite', 'echarts', 'chartjs'] as const) {
    it(`renders a ${backend} bar chart to a non-trivial PNG`, async () => {
      const res = await renderChart(sales, backend, { format: 'png' });
      expect(res.backend).toBe(backend);
      expect(res.mimeType).toBe('image/png');
      expect(res.buffer).toBeInstanceOf(Buffer);
      expect(res.buffer!.length).toBeGreaterThan(1000);
      expect(res.buffer!.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
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
});
