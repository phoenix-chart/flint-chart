import { useMemo, useState } from 'react';
import { assembleVegaLite, assembleECharts, type ChartAssemblyInput } from 'flint-chart';
import { VegaLiteView } from './VegaLiteView';
import { EChartsView } from './EChartsView';
import { siteTheme } from '../shared/theme';

/**
 * Interactive sizing playground embedded in the layout-model doc.
 *
 * One mode per layout model:
 *   - `discrete`      — elastic-budget model on a banded (bar) axis
 *   - `continuous`    — gas-pressure model on a line chart's time axis
 *   - `circumference` — radial-pressure model on a pie chart's closed loop
 *   - `area`          — 2D area-pressure model on a treemap
 *
 * Users drag the number of items, the stretch/elasticity (where they apply),
 * and the canvas size, then watch the assembled plot size respond live.
 */
type Mode = 'discrete' | 'continuous' | 'circumference' | 'area';

/** Deterministic RNG so the demo data is stable across re-renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function categoryRows(n: number, seed: number): { Category: string; Value: number }[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({
    Category: `Cat ${String(i + 1).padStart(2, '0')}`,
    Value: Math.round(20 + rng() * 80),
  }));
}

type BuildArgs = {
  count: number;
  canvas: { width: number; height: number };
  elasticity: number;
  maxStretch: number;
};

function buildDiscreteInput({ count, canvas, elasticity, maxStretch }: BuildArgs): ChartAssemblyInput {
  return {
    data: { values: categoryRows(count, 1234) },
    semantic_types: { Category: 'Category', Value: 'Quantity' },
    chart_spec: { chartType: 'Bar Chart', encodings: { x: 'Category', y: 'Value' }, canvasSize: canvas },
    options: { elasticity, maxStretch },
  };
}

function buildContinuousInput({ count, canvas, elasticity, maxStretch }: BuildArgs): ChartAssemblyInput {
  const rng = mulberry32(5678);
  const start = Date.UTC(2020, 0, 1);
  const dayMs = 86400000;
  let v = 100;
  const values = Array.from({ length: count }, (_, i) => {
    v += (rng() - 0.5) * 20;
    return { Date: new Date(start + i * dayMs).toISOString().slice(0, 10), Value: Math.round(v * 100) / 100 };
  });
  return {
    data: { values },
    semantic_types: { Date: 'Date', Value: 'Quantity' },
    chart_spec: { chartType: 'Line Chart', encodings: { x: 'Date', y: 'Value' }, canvasSize: canvas },
    options: { continuousMarkCrossSection: { x: 80, y: 0, elasticity, maxStretch } },
  };
}

function buildCircumferenceInput({ count, canvas }: BuildArgs): ChartAssemblyInput {
  return {
    data: { values: categoryRows(count, 4321) },
    semantic_types: { Category: 'Category', Value: 'Quantity' },
    chart_spec: { chartType: 'Pie Chart', encodings: { color: 'Category', size: 'Value' }, canvasSize: canvas },
  };
}

function buildAreaInput({ count, canvas }: BuildArgs): ChartAssemblyInput {
  return {
    data: { values: categoryRows(count, 8765) },
    semantic_types: { Category: 'Category', Value: 'Quantity' },
    chart_spec: { chartType: 'Treemap', encodings: { color: 'Category', size: 'Value' }, canvasSize: canvas },
  };
}

type Control = 'stretch' | 'elasticity';

interface ModeConfig {
  backend: 'vl' | 'echarts';
  build: (args: BuildArgs) => ChartAssemblyInput;
  countLabel: string;
  countMin: number;
  countMax: number;
  countStep: number;
  countDefault: number;
  elasticityDefault: number;
  controls: Control[];
}

const MODES: Record<Mode, ModeConfig> = {
  discrete: {
    backend: 'vl',
    build: buildDiscreteInput,
    countLabel: 'Number of items (N)',
    countMin: 3, countMax: 120, countStep: 1, countDefault: 12,
    elasticityDefault: 0.5,
    controls: ['stretch', 'elasticity'],
  },
  continuous: {
    backend: 'vl',
    build: buildContinuousInput,
    countLabel: 'Number of points (N)',
    countMin: 8, countMax: 600, countStep: 4, countDefault: 60,
    elasticityDefault: 0.3,
    controls: ['stretch', 'elasticity'],
  },
  circumference: {
    backend: 'vl',
    build: buildCircumferenceInput,
    countLabel: 'Number of slices (N)',
    countMin: 2, countMax: 40, countStep: 1, countDefault: 6,
    elasticityDefault: 0.5,
    controls: [],
  },
  area: {
    backend: 'echarts',
    build: buildAreaInput,
    countLabel: 'Number of cells (N)',
    countMin: 3, countMax: 120, countStep: 1, countDefault: 12,
    elasticityDefault: 0.5,
    controls: [],
  },
};

const PARAM_HELP: { symbol: string; name: string; desc: string; control: Control | 'count' | 'canvas' }[] = [
  { symbol: 'N', name: 'Item count', desc: 'how many data marks compete for space — bars, points, slices, or cells.', control: 'count' },
  { symbol: 'β', name: 'Stretch factor', desc: 'how far the plot may grow past the canvas (maxStretch). β = 2 means up to 2× the canvas width.', control: 'stretch' },
  { symbol: 'α', name: 'Elasticity', desc: 'how strongly crowding turns into stretch — the power-law exponent. Higher reacts faster.', control: 'elasticity' },
  { symbol: 'W×H', name: 'Canvas size', desc: 'the natural target size the layout aims for before any stretch is applied.', control: 'canvas' },
];

function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: siteTheme.textMuted, minWidth: 0 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{label}</span>
        <span style={{ color: siteTheme.text, fontFamily: siteTheme.fontMono, fontWeight: 600 }}>
          {value}{suffix ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: siteTheme.accent, boxSizing: 'border-box' }}
      />
    </label>
  );
}

export function SizingPlayground({ mode }: { mode: Mode }) {
  const cfg = MODES[mode];
  const [count, setCount] = useState(cfg.countDefault);
  const [maxStretch, setMaxStretch] = useState(2);
  const [elasticity, setElasticity] = useState(cfg.elasticityDefault);
  const [width, setWidth] = useState(480);
  const [height, setHeight] = useState(320);

  const showStretch = cfg.controls.includes('stretch');
  const showElasticity = cfg.controls.includes('elasticity');

  const { spec, resolvedWidth, resolvedHeight, error } = useMemo(() => {
    const canvas = { width, height };
    try {
      const input = cfg.build({ count, canvas, elasticity, maxStretch });
      const s = (cfg.backend === 'vl' ? assembleVegaLite(input) : assembleECharts(input)) as any;
      return {
        spec: s,
        resolvedWidth: typeof s._width === 'number' ? Math.round(s._width) : null,
        resolvedHeight: typeof s._height === 'number' ? Math.round(s._height) : null,
        error: null as string | null,
      };
    } catch (err) {
      return { spec: null, resolvedWidth: null, resolvedHeight: null, error: String((err as Error)?.message ?? err) };
    }
  }, [cfg, count, maxStretch, elasticity, width, height]);

  const stretchedW = resolvedWidth != null ? Math.round((resolvedWidth / width) * 100) : null;
  const help = PARAM_HELP.filter((p) =>
    p.control === 'count' ||
    p.control === 'canvas' ||
    (p.control === 'stretch' && showStretch) ||
    (p.control === 'elasticity' && showElasticity),
  );

  return (
    <div
      style={{
        boxSizing: 'border-box',
        maxWidth: '100%',
        border: `1px solid ${siteTheme.border}`,
        borderRadius: siteTheme.radius,
        background: siteTheme.surface,
        padding: 16,
        margin: '20px 0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Slider label={cfg.countLabel} value={count} min={cfg.countMin} max={cfg.countMax} step={cfg.countStep} onChange={setCount} />
        {showStretch && <Slider label="Stretch factor (β)" value={maxStretch} min={1} max={4} step={0.1} onChange={setMaxStretch} suffix="×" />}
        {showElasticity && <Slider label="Elasticity (α)" value={elasticity} min={0} max={1} step={0.05} onChange={setElasticity} />}
        <Slider label="Canvas width" value={width} min={240} max={720} step={20} onChange={setWidth} suffix=" px" />
        <Slider label="Canvas height" value={height} min={160} max={480} step={20} onChange={setHeight} suffix=" px" />
      </div>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2px 10px',
          margin: '0 0 14px',
          fontSize: 12,
          lineHeight: 1.45,
          color: siteTheme.textMuted,
        }}
      >
        {help.map((p) => (
          <div key={p.symbol} style={{ display: 'contents' }}>
            <dt style={{ fontFamily: siteTheme.fontMono, color: siteTheme.text, whiteSpace: 'nowrap' }}>
              {p.symbol} <span style={{ color: siteTheme.textMuted, fontFamily: siteTheme.fontSans }}>· {p.name}</span>
            </dt>
            <dd style={{ margin: 0 }}>{p.desc}</dd>
          </div>
        ))}
      </dl>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12,
          color: siteTheme.textMuted,
          fontFamily: siteTheme.fontMono,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: `1px solid ${siteTheme.border}`,
        }}
      >
        <span>canvas: {width} × {height} px</span>
        {showStretch && <span>cap (β·width): {Math.round(width * maxStretch)} px</span>}
        {resolvedWidth != null && (
          <span style={{ color: siteTheme.text }}>
            plot width: {resolvedWidth} px{stretchedW != null ? ` (${stretchedW}% of canvas)` : ''}
          </span>
        )}
        {resolvedHeight != null && <span>plot height: {resolvedHeight} px</span>}
      </div>

      {error ? (
        <div style={{ color: siteTheme.error, fontFamily: siteTheme.fontMono, fontSize: 13 }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          {spec && (cfg.backend === 'vl' ? <VegaLiteView spec={spec} /> : <EChartsView option={spec} />)}
        </div>
      )}
    </div>
  );
}
