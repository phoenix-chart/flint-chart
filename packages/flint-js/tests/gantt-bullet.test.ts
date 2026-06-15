// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { assembleVegaLite } from '../src';
import { genGanttTests, genBulletTests } from '../src/test-data';
import type { TestCase } from '../src/test-data/types';

/**
 * Gantt and Bullet chart types.
 *
 * Gantt renders one horizontal bar per task spanning [start, end] on x/x2 (a
 * non-zero time axis), with tasks ordered by start. Bullet layers a value bar
 * (length from zero) under a target tick. These tests assert the assembled
 * Vega-Lite spec has the right marks, channels and scale flags, and that the
 * bundled gallery examples compile.
 */

/** Convert a gallery TestCase into the assembler input shape. */
function toInput(tc: TestCase) {
  const encodings: Record<string, string> = {};
  for (const [channel, item] of Object.entries(tc.encodingMap)) {
    const field = tc.fields.find((f) => f.id === (item as any).fieldID);
    if (field) encodings[channel] = field.name;
  }
  const semantic_types: Record<string, string> = {};
  for (const [name, meta] of Object.entries(tc.metadata)) {
    semantic_types[name] = meta.semanticType;
  }
  return {
    data: { values: tc.data },
    semantic_types,
    chart_spec: {
      chartType: tc.chartType,
      encodings,
      canvasSize: { width: 500, height: 300 },
      ...(tc.chartProperties ? { chartProperties: tc.chartProperties } : {}),
    },
  };
}

describe('Gantt chart', () => {
  const spec = assembleVegaLite(toInput(genGanttTests()[0])) as any;

  it('renders a single bar mark spanning x → x2', () => {
    expect(spec.mark?.type).toBe('bar');
    expect(spec.encoding?.x?.field).toBe('start');
    expect(spec.encoding?.x2?.field).toBe('end');
  });

  it('treats the interval as temporal and does not anchor the axis at zero', () => {
    expect(spec.encoding?.x?.type).toBe('temporal');
    // On a time scale, zero is meaningless; it must not be forced on.
    expect(spec.encoding?.x?.scale?.zero).not.toBe(true);
  });

  it('orders tasks by their start date', () => {
    expect(spec.encoding?.y?.field).toBe('task');
    expect(spec.encoding?.y?.sort).toMatchObject({ field: 'start', op: 'min', order: 'ascending' });
  });

  it('colors bars by phase', () => {
    expect(spec.encoding?.color?.field).toBe('phase');
  });
});

describe('Bullet chart', () => {
  const spec = assembleVegaLite(toInput(genBulletTests()[0])) as any;

  it('layers a value bar under a target tick', () => {
    expect(Array.isArray(spec.layer)).toBe(true);
    expect(spec.layer).toHaveLength(2);
    expect(spec.layer[0].mark?.type).toBe('bar');
    expect(spec.layer[1].mark?.type).toBe('tick');
  });

  it('puts the value on the bar and the target on the tick', () => {
    expect(spec.encoding?.y?.field).toBe('rep');
    expect(spec.layer[0].encoding?.x?.field).toBe('sales');
    expect(spec.layer[1].encoding?.x?.field).toBe('quota');
  });

  it('keeps the value bar anchored at zero', () => {
    expect(spec.layer[0].encoding?.x?.scale?.zero).toBe(true);
  });

  it('sizes the target tick to a positive pixel height', () => {
    expect(typeof spec.layer[1].mark?.size).toBe('number');
    expect(spec.layer[1].mark.size).toBeGreaterThan(0);
  });
});

describe('gallery examples compile', () => {
  for (const tc of [...genGanttTests(), ...genBulletTests()]) {
    it(`${tc.chartType}: ${tc.title}`, () => {
      const spec = assembleVegaLite(toInput(tc)) as any;
      expect(spec).toBeDefined();
      expect(spec.encoding || spec.layer).toBeDefined();
    });
  }
});
