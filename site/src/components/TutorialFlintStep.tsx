import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { TEST_GENERATORS } from 'flint-chart/test-data';
import { CodeBlock } from './CodeBlock';
import { LazyTripleChart } from './LazyTripleChart';
import { buildGalleryEditorHref } from '../shared/editor-payload';
import { testCaseToAssemblyInput } from '../shared/test-case-utils';
import { siteTheme } from '../shared/theme';

/** Parse a `flint-step` fenced block: line 1 = generator key, line 2 = index (optional, default 0). */
export function parseFlintStepBlock(text: string): { generator: string; index: number } | null {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const generator = lines[0];
  const index = lines.length > 1 ? Number(lines[1]) : 0;
  if (!Number.isInteger(index) || index < 0) return null;
  return { generator, index };
}

type AssemblyInput = ReturnType<typeof testCaseToAssemblyInput>;

function buildDataSpec(input: AssemblyInput, sampleRows = 3): Record<string, unknown> {
  const values = (input.data?.values ?? []) as unknown[];
  const sample = values.slice(0, sampleRows);
  const remaining = Math.max(0, values.length - sampleRows);

  const semantic_types: Record<string, unknown> = { ...input.semantic_types };
  const annotations = input.semantic_annotations as Record<string, { semanticType?: string }> | undefined;
  if (annotations) {
    for (const [field, ann] of Object.entries(annotations)) {
      if (ann?.semanticType) semantic_types[field] = ann;
    }
  }

  return {
    data: {
      values: sample,
      ...(remaining > 0 ? { _note: `… ${remaining} more rows` } : {}),
    },
    semantic_types,
  };
}

function buildChartSpec(input: AssemblyInput): Record<string, unknown> {
  const out: Record<string, unknown> = { chart_spec: input.chart_spec };
  if (input.options) out.options = input.options;
  return out;
}

function SpecPanel({ label, json }: { label: string; json: Record<string, unknown> }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={specLabelStyle}>{label}</div>
      <CodeBlock language="json" customStyle={{ margin: 0 }}>
        {JSON.stringify(json, null, 2)}
      </CodeBlock>
    </div>
  );
}

export function TutorialFlintStep({ generator, index }: { generator: string; index: number }) {
  const resolved = useMemo(() => {
    const gen = TEST_GENERATORS[generator as keyof typeof TEST_GENERATORS];
    if (!gen) return { error: `Unknown gallery generator: "${generator}"` };
    const cases = gen();
    const testCase = cases[index];
    if (!testCase) return { error: `No test case at index ${index} for "${generator}"` };
    return { testCase, input: testCaseToAssemblyInput(testCase) };
  }, [generator, index]);

  if ('error' in resolved) {
    return <div style={errorBoxStyle}>{resolved.error}</div>;
  }

  const { testCase, input } = resolved;
  const editorHref = buildGalleryEditorHref(generator, index);
  const dataSpec = buildDataSpec(input);
  const chartSpec = buildChartSpec(input);

  return (
    <div style={{ margin: '16px 0 24px' }}>
      <div style={specGridStyle}>
        <SpecPanel label="dataSpec" json={dataSpec} />
        <SpecPanel label="chartSpec" json={chartSpec} />
      </div>

      <div style={chartHeaderStyle}>
        <span style={{ fontSize: 13, fontWeight: 600, color: siteTheme.text }}>
          Rendered chart
        </span>
        <a href={editorHref} style={linkStyle}>
          Open in editor →
        </a>
      </div>

      <LazyTripleChart testCase={testCase} />
    </div>
  );
}

const specGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
  marginBottom: 16,
};

const specLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: siteTheme.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
};

const chartHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  margin: '0 0 10px',
  flexWrap: 'wrap',
};

const errorBoxStyle: CSSProperties = {
  margin: '12px 0',
  padding: 12,
  borderRadius: siteTheme.radius,
  border: `1px solid ${siteTheme.error}`,
  color: siteTheme.error,
  fontSize: 13,
};

const linkStyle: CSSProperties = {
  fontSize: 12,
  color: siteTheme.accent,
  textDecoration: 'none',
};
