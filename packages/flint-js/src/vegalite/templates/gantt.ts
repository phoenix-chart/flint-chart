// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChartTemplateDef } from '../../core/types';

/**
 * Gantt chart — one horizontal bar per task, spanning [start, end].
 *
 * Channels:
 *   - y      task / activity label (the banded category axis)
 *   - x      start of the interval (temporal or quantitative)
 *   - x2     end of the interval (shares x's scale)
 *   - color  optional grouping (phase, owner, resource)
 *
 * The interval lives on x/x2 so the bar is positioned by where it starts and
 * ends rather than measured from a zero baseline — hence markCognitiveChannel
 * 'position' and an explicit non-zero x scale. Tasks are sorted by their start
 * so the timeline reads top-to-bottom in chronological order.
 */
export const ganttChartDef: ChartTemplateDef = {
    chart: "Gantt Chart",
    template: {
        mark: { type: "bar", cornerRadius: 2, height: { band: 0.7 } },
        encoding: {},
    },
    channels: ["y", "x", "x2", "color", "detail", "column", "row"],
    markCognitiveChannel: 'position',
    declareLayoutMode: () => ({
        axisFlags: { y: { banded: true } },
    }),
    instantiate: (spec, ctx) => {
        const { x, x2, y, color, detail, column, row } = ctx.resolvedEncodings;

        if (!spec.encoding) spec.encoding = {};

        if (y) {
            spec.encoding.y = { ...y };
            spec.encoding.y.axis = { ...(spec.encoding.y.axis ?? {}), title: null };
            // Order tasks by when they start so the timeline reads chronologically.
            if (x?.field) {
                spec.encoding.y.sort = { field: x.field, op: 'min', order: 'ascending' };
            }
        }

        if (x) {
            spec.encoding.x = { ...x };
            spec.encoding.x.axis = { ...(spec.encoding.x.axis ?? {}), title: null };
            // A non-zero baseline only matters for a quantitative interval; on a
            // time scale Vega-Lite ignores (and warns about) scale.zero.
            if (x.type === 'quantitative') {
                spec.encoding.x.scale = { ...(spec.encoding.x.scale ?? {}), zero: false };
            }
        }
        // x2 shares x's scale; it only needs the field reference.
        if (x2) spec.encoding.x2 = { field: x2.field };

        if (color) spec.encoding.color = color;
        if (detail) spec.encoding.detail = detail;
        if (column) spec.encoding.column = column;
        if (row) spec.encoding.row = row;
    },
};
