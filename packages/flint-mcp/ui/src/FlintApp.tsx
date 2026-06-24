// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Flint chart MCP App.
 *
 * Renders a Flint chart spec live (client-side Flint -> Vega-Lite -> SVG) and
 * offers a data-driven customization panel built entirely from Flint's own
 * option model (chart type, channel bindings, chart properties, encoding
 * actions). Mirrors Data Formulator's encoding-shelf idea, restricted to Flint
 * options, with no server round-trips.
 */
import type { App, McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChartAssemblyInput, ChartOption } from 'flint-chart';

import { renderFlintSvg, type FlintRenderResult } from './render';
import {
  buildPanelModel,
  setProperty,
  type PanelModel,
  type ResolvedAction,
} from './options';

/** Control descriptor shared by chart properties and encoding actions. */
type ControlSpec =
  | { type: 'continuous'; min: number; max: number; step?: number }
  | { type: 'discrete'; options: { value: unknown; label: string }[] }
  | { type: 'binary' };

/** Stable string key for an arbitrary option value (handles undefined/objects). */
function valueKey(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function ControlRow(props: {
  label: string;
  spec: ControlSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { label, spec, value, onChange } = props;

  let control: React.ReactNode = null;
  if (spec.type === 'continuous') {
    const step = spec.step ?? ((spec.max - spec.min) / 100 || 1);
    const num = typeof value === 'number' ? value : spec.min;
    control = (
      <div className="control-inline">
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={step}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="control-readout">{Number(num).toLocaleString()}</span>
      </div>
    );
  } else if (spec.type === 'discrete') {
    const current = valueKey(value);
    const idx = spec.options.findIndex((o) => valueKey(o.value) === current);
    control = (
      <select
        value={idx < 0 ? '0' : String(idx)}
        onChange={(e) => onChange(spec.options[Number(e.target.value)]?.value)}
      >
        {spec.options.map((o, i) => (
          <option key={i} value={String(i)}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {control}
    </label>
  );
}

function ConfigPanel(props: {
  input: ChartAssemblyInput;
  model: PanelModel;
  onInput: (next: ChartAssemblyInput) => void;
}) {
  const { input, model, onInput } = props;

  // Lean panel: surface only Flint's dynamic low-level options — visual chart
  // properties plus encoding actions (sort, …) — mirroring Data Formulator's
  // quick-config bar. Deliberately no chart-type switch or field→channel
  // binding; the agent owns those, the panel just fine-tunes the result.
  const controls: { key: string; label: string; spec: ControlSpec; value: unknown }[] = [
    ...model.properties.map((option: ChartOption) => ({
      key: option.key,
      label: option.label,
      spec: option as ControlSpec,
      value: option.value,
    })),
    ...model.actions.map((action: ResolvedAction) => ({
      key: action.key,
      label: action.label,
      spec: action.control as ControlSpec,
      value: action.value,
    })),
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-eyebrow">Options</span>
        <h3 className="panel-title">{input.chart_spec.chartType}</h3>
      </div>
      {controls.length === 0 ? (
        <p className="panel-empty">No adjustable options for this chart.</p>
      ) : (
        <section className="panel-section">
          {controls.map((control) => (
            <ControlRow
              key={control.key}
              label={control.label}
              spec={control.spec}
              value={control.value}
              onChange={(v) => onInput(setProperty(input, control.key, v))}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function FlintAppInner(props: { app: App; input: ChartAssemblyInput; hostContext?: McpUiHostContext }) {
  const { app, input, hostContext } = props;
  const [current, setCurrent] = useState<ChartAssemblyInput>(input);
  const [render, setRender] = useState<FlintRenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const renderSeq = useRef(0);

  // Re-seed when a new tool input arrives from the host.
  useEffect(() => setCurrent(input), [input]);

  // Live render (debounced) whenever the working spec changes.
  useEffect(() => {
    const seq = ++renderSeq.current;
    setSent(false);
    const handle = setTimeout(() => {
      renderFlintSvg(current)
        .then((result) => {
          if (seq === renderSeq.current) {
            setRender(result);
            setError(null);
          }
        })
        .catch((err) => {
          if (seq === renderSeq.current) {
            setError(err instanceof Error ? err.message : String(err));
          }
        });
    }, 100);
    return () => clearTimeout(handle);
  }, [current]);

  const model = useMemo(() => buildPanelModel(current), [current]);

  const handleSend = useCallback(async () => {
    const payload = {
      chart_spec: current.chart_spec,
      ...(current.semantic_types ? { semantic_types: current.semantic_types } : {}),
    };
    const text =
      'Updated Flint chart spec from the chart view:\n\n```json\n' +
      JSON.stringify(payload, null, 2) +
      '\n```';
    try {
      await app.sendMessage({ role: 'user', content: [{ type: 'text', text }] });
      setSent(true);
    } catch {
      /* host may reject; ignore */
    }
  }, [app, current]);

  const warnings = render?.warnings ?? [];

  return (
    <main
      className="app"
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingRight: hostContext?.safeAreaInsets?.right,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
        paddingLeft: hostContext?.safeAreaInsets?.left,
      }}
    >
      <div className="preview">
        {error ? (
          <div className="error">
            <strong>Could not render chart</strong>
            <pre>{error}</pre>
          </div>
        ) : render ? (
          <div className="chart" dangerouslySetInnerHTML={{ __html: render.svg }} />
        ) : (
          <div className="placeholder">Rendering…</div>
        )}

        {warnings.length > 0 && (
          <ul className="warnings">
            {warnings.map((w, i) => (
              <li key={i}>
                <span className="warn-sev">{w.severity}</span> {w.message}
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <button onClick={handleSend} disabled={sent}>
            {sent ? 'Sent to chat' : 'Insert updated spec into chat'}
          </button>
        </div>
      </div>

      <ConfigPanel input={current} model={model} onInput={setCurrent} />
    </main>
  );
}

export function FlintApp() {
  const [input, setInput] = useState<ChartAssemblyInput | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: 'Flint Chart', version: '0.1.0' },
    capabilities: {},
    autoResize: true,
    onAppCreated: (app) => {
      app.onteardown = async () => ({});
      app.onerror = (err) => console.error(err);
      app.onhostcontextchanged = (params) =>
        setHostContext((prev) => ({ ...prev, ...params }));
      app.ontoolinput = (params) => {
        const args = params?.arguments as ChartAssemblyInput | undefined;
        if (args?.chart_spec && args?.data) setInput(args);
      };
      app.ontoolresult = (result) => {
        const structured = (result as { structuredContent?: { input?: ChartAssemblyInput } })
          .structuredContent;
        if (structured?.input?.chart_spec && structured.input.data) {
          setInput((prev) => prev ?? structured.input!);
        }
      };
    },
  });

  useEffect(() => {
    if (app) setHostContext(app.getHostContext());
  }, [app]);

  if (error) {
    return (
      <div className="status">
        <strong>App error:</strong> {error.message}
      </div>
    );
  }
  if (!app) return <div className="status">Connecting…</div>;
  if (!input) return <div className="status">Waiting for chart data…</div>;

  return <FlintAppInner app={app} input={input} hostContext={hostContext} />;
}
