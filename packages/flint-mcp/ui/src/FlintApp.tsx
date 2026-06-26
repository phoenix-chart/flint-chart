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

// Best-effort sizing: measure each option by its label length + the intrinsic
// width of its widget, then snap to a small set of tiers. Keeps the strip
// grid-like (few distinct widths) while letting toggles stay compact and
// sliders/selects get the room they need.
const LABEL_CHAR_PX = 7;
const LABEL_MAX_PX = 132;
const LABEL_GAP = 8;
// Small safety margin so short labels (e.g. "Gap") aren't starved by the
// fixed-width widget and snap up to the next tier when the fit is tight.
const FIT_BUFFER = 10;
const WIDGET_PX: Record<string, number> = {
  continuous: 72 + 6 + 44, // slider track + gap + readout
  discrete: 128, // select
  binary: 30, // toggle
  pivot: 96, // stepper
};
const WIDTH_TIERS = [140, 168, 200, 232, 264, 296];

function optionWidth(label: string, kind: string): number {
  const labelPx = Math.min(LABEL_MAX_PX, Math.ceil(label.length * LABEL_CHAR_PX));
  const needed = labelPx + LABEL_GAP + (WIDGET_PX[kind] ?? 120) + FIT_BUFFER;
  return WIDTH_TIERS.find((t) => t >= needed) ?? WIDTH_TIERS[WIDTH_TIERS.length - 1];
}

function ControlRow(props: {
  label: string;
  spec: ControlSpec;
  value: unknown;
  width: number;
  onChange: (value: unknown) => void;
}) {
  const { label, spec, value, width, onChange } = props;

  let control: React.ReactNode = null;
  if (spec.type === 'continuous') {
    const step = spec.step ?? ((spec.max - spec.min) / 100 || 1);
    const num = typeof value === 'number' ? value : spec.min;
    control = (
      <span className="control-inline">
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={step}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="control-readout">{Number(num).toLocaleString()}</span>
      </span>
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
      <span className="switch">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </span>
    );
  }

  return (
    <label className="opt" style={{ '--opt-width': `${width}px` } as React.CSSProperties}>
      <span className="opt-label" title={label}>{label}</span>
      {control}
    </label>
  );
}

function PivotControl(props: {
  pivot: NonNullable<PanelModel['pivot']>;
  width: number;
  onSelect: (id: string | undefined) => void;
}) {
  const { pivot, width, onSelect } = props;
  const { ids, labels, index, length, label } = pivot;
  const go = (delta: number) => {
    const nextIndex = (index + delta + length) % length;
    // The identity state (index 0) is the absent override — clear it so the
    // chart returns to the authored view rather than storing a redundant id.
    onSelect(nextIndex === 0 ? undefined : ids[nextIndex]);
  };
  return (
    <div className="opt pivot" role="group" aria-label={label} style={{ '--opt-width': `${width}px` } as React.CSSProperties}>
      <span className="opt-label" title={label}>{label}</span>
      <div className="pivot-stepper">
        <button className="pivot-btn" aria-label="Previous view" onClick={() => go(-1)}>
          ‹
        </button>
        <span className="pivot-state" title={labels[index]}>
          {index + 1} / {length}
        </span>
        <button className="pivot-btn" aria-label="Next view" onClick={() => go(1)}>
          ›
        </button>
      </div>
    </div>
  );
}

function OptionsBar(props: {
  input: ChartAssemblyInput;
  model: PanelModel;
  onInput: (next: ChartAssemblyInput) => void;
  onSend: () => void;
  sent: boolean;
}) {
  const { input, model, onInput, onSend, sent } = props;

  // Lean bar: surface only Flint's dynamic low-level options — visual chart
  // properties plus encoding actions (sort, …) — inline below the chart,
  // mirroring Data Formulator's quick-config strip. Deliberately no chart-type
  // switch or field→channel binding; the agent owns those, the bar fine-tunes.
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
    <div className="optionsbar" role="toolbar" aria-label={`${input.chart_spec.chartType} options`}>
      <div className="optionsbar-grid">
        {model.pivot && model.pivot.length > 1 && (
          <PivotControl
            pivot={model.pivot}
            width={optionWidth(model.pivot.label, 'pivot')}
            onSelect={(id) => onInput(setProperty(input, model.pivot!.key, id))}
          />
        )}
        {controls.length === 0 ? (
          !(model.pivot && model.pivot.length > 1) && (
            <span className="opt-empty">No adjustable options for this chart.</span>
          )
        ) : (
          controls.map((control) => (
            <ControlRow
              key={control.key}
              label={control.label}
              spec={control.spec}
              value={control.value}
              width={optionWidth(control.label, control.spec.type)}
              onChange={(v) => onInput(setProperty(input, control.key, v))}
            />
          ))
        )}
      </div>
      <button className="bar-link" onClick={onSend} disabled={sent}>
        {sent ? 'Copied to chat' : 'Copy spec to chat'}
      </button>
    </div>
  );
}

function FlintAppInner(props: {
  app: App;
  input: ChartAssemblyInput;
  hostContext?: McpUiHostContext;
}) {
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
      </div>

      <OptionsBar
        input={current}
        model={model}
        onInput={setCurrent}
        onSend={handleSend}
        sent={sent}
      />
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
        // Only accept raw tool args that already carry inline rows. A
        // local `data.url` cannot be read in the browser, so for those we
        // wait for the server-resolved input delivered via ontoolresult.
        if (args?.chart_spec && Array.isArray(args.data?.values)) setInput(args);
      };
      app.ontoolresult = (result) => {
        const structured = (result as { structuredContent?: { input?: ChartAssemblyInput } })
          .structuredContent;
        // The server pre-resolves data (local data.url → inline values), so
        // structuredContent.input is authoritative. Prefer it whenever it
        // carries rows the current input lacks.
        if (structured?.input?.chart_spec && Array.isArray(structured.input.data?.values)) {
          setInput((prev) =>
            Array.isArray(prev?.data?.values) && prev!.data.values.length > 0
              ? prev
              : structured.input!,
          );
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
