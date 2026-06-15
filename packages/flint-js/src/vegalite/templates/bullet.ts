// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChartTemplateDef } from '../../core/types';

/**
 * Bullet chart — a compact KPI panel: one row per label, each showing a measure
 * bar compared against a target marker.
 *
 * Channels:
 *   - y      label (the banded category axis — one row per KPI)
 *   - x      measured value (the bar, drawn from a zero baseline)
 *   - goal   target / comparative value (drawn as a tick across the bar)
 *   - color  optional grouping for the value bar
 *
 * The measure bar reads as length-from-zero (markCognitiveChannel 'length'), so
 * the x scale keeps its zero baseline. The target tick is layered on top and
 * sized a little taller than the bar so it stands out as a reference marker.
 * Qualitative range bands (poor/ok/good) are intentionally left out of this
 * first version; the value-vs-target comparison is the core of the encoding.
 */
export const bulletChartDef: ChartTemplateDef = {
    chart: "Bullet Chart",
    template: {
        encoding: {},
        layer: [
            { mark: { type: "bar", color: "#3a6ea5", height: { band: 0.5 } }, encoding: {} },
            { mark: { type: "tick", color: "#1a1a1a", thickness: 3, opacity: 1 }, encoding: {} },
        ],
    },
    channels: ["y", "x", "goal", "color", "column", "row"],
    markCognitiveChannel: 'length',
    declareLayoutMode: () => ({
        axisFlags: { y: { banded: true } },
    }),
    instantiate: (spec, ctx) => {
        const { x, y, goal, color, column, row } = ctx.resolvedEncodings;

        if (!spec.encoding) spec.encoding = {};

        if (y) {
            spec.encoding.y = { ...y };
            spec.encoding.y.axis = { ...(spec.encoding.y.axis ?? {}), title: null };
        }
        if (column) spec.encoding.column = column;
        if (row) spec.encoding.row = row;

        // Value bar — length from zero.
        let valueTitle: any;
        if (x) {
            spec.layer[0].encoding.x = { ...x };
            spec.layer[0].encoding.x.scale = { ...(x.scale ?? {}), zero: true };
            valueTitle = x.title ?? x.field;
            spec.layer[0].encoding.x.axis = { ...(x.axis ?? {}), title: valueTitle };
        }
        if (color) spec.layer[0].encoding.color = color;

        // Target marker — a tick at the goal value, sized a little taller than
        // the bar so it reads as a reference line. It shares the value bar's x
        // scale; give it the same axis title so the shared axis renders once and
        // reads as the measure rather than "value, goal".
        if (goal) {
            spec.layer[1].encoding.x = {
                field: goal.field,
                type: 'quantitative',
                ...(valueTitle != null ? { axis: { title: valueTitle } } : {}),
            };
        }

        // Size the target tick relative to the available band height so it spans
        // a bit more than the value bar regardless of how many rows there are.
        const table = ctx.table ?? [];
        const yField = y?.field;
        const plotHeight = ctx.canvasSize?.height || 300;
        let tickSize = 24;
        if (yField && table.length > 0) {
            const rows = new Set(table.map((r: any) => r[yField])).size || 1;
            tickSize = Math.max(12, Math.min(46, Math.round((plotHeight * 0.62) / rows)));
        }
        spec.layer[1].mark = { ...spec.layer[1].mark, size: tickSize };
    },
};
