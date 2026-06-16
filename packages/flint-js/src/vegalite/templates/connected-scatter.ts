// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Vega-Lite Connected Scatter Plot template.
 *
 * Points are plotted in 2-D (x, y both quantitative) and **connected by a
 * straight line in a defined order** (usually time / sequence), tracing a
 * trajectory through the space. It shows the x↔y correlation AND the ordered
 * path at once — distinct from a plain Scatter Plot (no order, no line) and from
 * Regression (a fitted trend, not the observed path).
 *
 * This mirrors scatter.ts for the points and line.ts / bump.ts for the
 * connecting line + order handling.
 *
 * Contract:
 *   x      — quantitative position.
 *   y      — quantitative position.
 *   order  — the sequence field (temporal or numeric/index) that defines the
 *            connection order. The line follows THIS field, never the x value,
 *            so a looping / back-tracking path renders as a self-crossing
 *            trajectory.
 *   color  — optional series → one trajectory (line) per value (legend).
 *   detail — optional series → one trajectory per value without a color legend.
 *
 * The line is always straight (interpolate: linear — never monotone/smooth) and
 * shows a point marker at every observation.
 */

import { ChartTemplateDef } from '../../core/types';
import { defaultBuildEncodings } from './utils';

/**
 * Pick a *sortable* Vega-Lite type for the order encoding. The order channel
 * drives the line's connection order, so it must sort meaningfully:
 *   - temporal fields sort chronologically;
 *   - numeric fields (years, step indices, …) sort numerically — even when the
 *     resolver classified them as ordinal/nominal, we coerce to quantitative so
 *     VL orders 1,2,3,…10 rather than by an arbitrary domain order;
 *   - anything else keeps its resolved discrete type.
 */
function resolveOrderType(
    csType: string | undefined,
    field: string,
    table: any[],
): 'temporal' | 'quantitative' | 'ordinal' | 'nominal' {
    const values = table.map(r => r[field]).filter(v => v != null && v !== '');
    const allNumeric = values.length > 0 &&
        values.every(v => typeof v === 'number' ||
            (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))));
    // Numeric sequence fields (years, step indices, …) sort numerically — even
    // when the resolver classified them as temporal/ordinal — so the line walks
    // 1,2,3,…10 rather than by an epoch-ms or arbitrary domain order.
    if (allNumeric) return 'quantitative';
    if (csType === 'temporal') return 'temporal';
    return (csType === 'ordinal' || csType === 'nominal') ? csType : 'nominal';
}

export const connectedScatterDef: ChartTemplateDef = {
    chart: "Connected Scatter Plot",
    template: {
        mark: { type: "line", point: true, interpolate: "linear", strokeWidth: 2 },
        encoding: {},
    },
    channels: ["x", "y", "order", "color", "detail", "column", "row"],
    markCognitiveChannel: 'position',
    instantiate: (spec, ctx) => {
        defaultBuildEncodings(spec, ctx.resolvedEncodings);

        const xEnc = spec.encoding?.x;
        const yEnc = spec.encoding?.y;
        if (!xEnc || !yEnc) return;

        // The connecting line must follow the sequence field, NOT the x value.
        // Build the order encoding explicitly so it sorts meaningfully and is
        // never polluted by the generic discrete-axis `sort: null` machinery.
        const orderCS = ctx.channelSemantics.order;
        if (orderCS?.field) {
            spec.encoding.order = {
                field: orderCS.field,
                type: resolveOrderType(orderCS.type, orderCS.field, ctx.table),
            };
        } else {
            // Fallback: no explicit order field → connect in data (row) order.
            // VL has no row-index primitive, so we leave the line unordered and
            // let VL connect by x; the order channel is the documented way to
            // get a true trajectory, and every bundled example provides it.
            delete spec.encoding.order;
        }

        // Both position axes fit the data (a trajectory reads the shape, not the
        // distance from zero), matching the Scatter Plot convention. The zero
        // decision the engine attached to each axis still wins when it is set.
        // A few pixels of scale padding keep the extreme points (and their
        // markers) clear of the plot edges so a point that lands exactly on an
        // axis bound is not clipped.
        xEnc.scale = { ...xEnc.scale, nice: true, padding: 10 };
        yEnc.scale = { ...yEnc.scale, nice: true, padding: 10 };
    },
};
