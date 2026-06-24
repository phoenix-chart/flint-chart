import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServer } from '../src/server.js';

const barChart = {
  data: {
    values: [
      { region: 'North', revenue: 120 },
      { region: 'South', revenue: 90 },
      { region: 'East', revenue: 150 },
    ],
  },
  semantic_types: { region: 'Category', revenue: 'Quantity' },
  chart_spec: {
    chartType: 'Bar Chart',
    encodings: { x: { field: 'region' }, y: { field: 'revenue' } },
    baseSize: { width: 320, height: 220 },
  },
};

function resourceText(content: { uri: string; text?: string; blob?: string }): string {
  if (typeof content.text === 'string') return content.text;
  throw new Error(`expected text content for ${content.uri}`);
}

let client: Client;
let server: McpServer;

beforeAll(async () => {
  server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  client = new Client({ name: 'flint-mcp-test', version: '0.0.0' });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client?.close();
  await server?.close();
});

describe('MCP server', () => {
  it('lists the chart tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'compile_chart',
      'list_chart_types',
      'render_chart',
      'validate_chart',
    ]);
  });

  it('render_chart returns inline PNG image content', async () => {
    const res: any = await client.callTool({
      name: 'render_chart',
      arguments: { ...barChart, backend: 'echarts', format: 'png' },
    });
    expect(res.isError).toBeFalsy();
    const image = res.content.find((c: any) => c.type === 'image');
    expect(image).toBeTruthy();
    expect(image.mimeType).toBe('image/png');
    expect(typeof image.data).toBe('string');
    expect(image.data.length).toBeGreaterThan(1000);
  });

  it('render_chart returns SVG text for vegalite', async () => {
    const res: any = await client.callTool({
      name: 'render_chart',
      arguments: { ...barChart, backend: 'vegalite', format: 'svg' },
    });
    expect(res.isError).toBeFalsy();
    const svg = res.content.find((c: any) => c.type === 'text' && c.text.includes('<svg'));
    expect(svg).toBeTruthy();
  });

  it('compile_chart returns a backend spec with no private keys', async () => {
    const res: any = await client.callTool({
      name: 'compile_chart',
      arguments: { ...barChart, backend: 'echarts' },
    });
    expect(res.isError).toBeFalsy();
    const payload = JSON.parse(res.content[0].text);
    expect(payload.backend).toBe('echarts');
    expect(payload.spec).toBeTruthy();
    expect(Object.keys(payload.spec).some((k) => k.startsWith('_'))).toBe(false);
    expect(Array.isArray(payload.warnings)).toBe(true);
  });

  it('validate_chart flags an unknown chart type as invalid', async () => {
    const res: any = await client.callTool({
      name: 'validate_chart',
      arguments: {
        ...barChart,
        chart_spec: { ...barChart.chart_spec, chartType: 'Not A Real Chart' },
        backend: 'vegalite',
      },
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.valid).toBe(false);
    expect(payload.errors.length).toBeGreaterThan(0);
  });

  it('validate_chart accepts a valid spec', async () => {
    const res: any = await client.callTool({
      name: 'validate_chart',
      arguments: { ...barChart, backend: 'vegalite' },
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.valid).toBe(true);
  });

  it('list_chart_types enumerates chart types per backend', async () => {
    const res: any = await client.callTool({
      name: 'list_chart_types',
      arguments: { backend: 'vegalite' },
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload).toHaveLength(1);
    expect(payload[0].backend).toBe('vegalite');
    expect(payload[0].count).toBeGreaterThan(10);
    expect(payload[0].chartTypes[0]).toHaveProperty('chartType');
    expect(payload[0].chartTypes[0]).toHaveProperty('channels');
  });

  it('render_chart surfaces assembly errors as isError', async () => {
    const res: any = await client.callTool({
      name: 'render_chart',
      arguments: {
        ...barChart,
        chart_spec: { ...barChart.chart_spec, chartType: 'Not A Real Chart' },
        backend: 'echarts',
      },
    });
    expect(res.isError).toBe(true);
  });

  it('exposes the chart-types resource', async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain('flint://chart-types');
    const read = await client.readResource({ uri: 'flint://chart-types' });
    const payload = JSON.parse(resourceText(read.contents[0]));
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBe(3);
  });

  it('exposes the bundled agent skill as a resource', async () => {
    const { resources } = await client.listResources();
    const skill = resources.find((r) => r.uri === 'flint://agent-skill');
    expect(skill?.mimeType).toBe('text/markdown');
    expect(skill?.annotations?.audience).toContain('assistant');

    const read = await client.readResource({ uri: 'flint://agent-skill' });
    expect(read.contents[0].mimeType).toBe('text/markdown');
    const skillText = resourceText(read.contents[0]);
    expect(skillText).toContain('# flint-chart: authoring and using a chart spec');
    expect(skillText).toContain('validate_chart');
  });

  it('exposes a prompt that embeds the agent skill', async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toContain('author_flint_chart');

    const prompt = await client.getPrompt({ name: 'author_flint_chart' });
    const resourceMessage = prompt.messages.find((m) => m.content.type === 'resource');
    expect(resourceMessage?.content.type).toBe('resource');
    if (resourceMessage?.content.type === 'resource') {
      expect(resourceMessage.content.resource.uri).toBe('flint://agent-skill');
      expect(resourceText(resourceMessage.content.resource)).toContain('ChartAssemblyInput');
    }
  });

  it('keeps the bundled MCP skill asset in sync with the repo skill', () => {
    const repoSkill = readFileSync(
      new URL('../../../agent-skills/flint-chart-author/SKILL.md', import.meta.url),
      'utf8',
    );
    const bundledSkill = readFileSync(
      new URL('../assets/flint-chart-author.SKILL.md', import.meta.url),
      'utf8',
    );
    expect(bundledSkill).toBe(repoSkill);
  });

  it('passes configured data roots to chart tools', async () => {
    const dataRoot = mkdtempSync(join(tmpdir(), 'flint-mcp-server-data-'));
    const dataServer = createServer({ dataRoots: [dataRoot] });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const dataClient = new Client({ name: 'flint-data-root-test', version: '0.0.0' });
    try {
      writeFileSync(join(dataRoot, 'sales.csv'), 'region,revenue\nNorth,120\nSouth,90\n');
      await dataServer.connect(serverTransport);
      await dataClient.connect(clientTransport);
      const res: any = await dataClient.callTool({
        name: 'compile_chart',
        arguments: { ...barChart, data: { url: 'sales.csv' }, backend: 'vegalite' },
      });
      const payload = JSON.parse(res.content[0].text);
      expect(payload.backend).toBe('vegalite');
      expect(payload.spec.data.values).toHaveLength(2);
    } finally {
      await dataClient.close();
      await dataServer.close();
      rmSync(dataRoot, { recursive: true, force: true });
    }
  });
});

describe('backend gating', () => {
  it('only exposes enabled backends in the render tool schema', async () => {
    const gated = createServer({ enabledBackends: ['vegalite'] });
    const [ct, st] = InMemoryTransport.createLinkedPair();
    await gated.connect(st);
    const c = new Client({ name: 't', version: '0' });
    await c.connect(ct);
    try {
      const { tools } = await c.listTools();
      const render = tools.find((t) => t.name === 'render_chart');
      const backendEnum = (render!.inputSchema as any).properties.backend.enum;
      expect(backendEnum).toEqual(['vegalite']);
    } finally {
      await c.close();
      await gated.close();
    }
  });
});
