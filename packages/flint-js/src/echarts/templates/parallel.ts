// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * ECharts Parallel Coordinates template.
 *
 * Contrast with VL:
 *   VL: no first-class parallel coordinates; would require folding many
 *       quantitative fields into a long format + custom layering.
 *   EC: a `parallel` coordinate system with one `parallelAxis` per numeric
 *       dimension and a `series` of type 'parallel'. Optionally grouped (and
 *       coloured) by a categorical field via the `color` channel.
 *
 * Dimensions: every numeric field in the data (excluding the color field),
 * unless the host passes an explicit `chartProperties.dimensions` order.
 */

import { ChartTemplateDef } from '../../core/types';
import { getChartJsPalette } from '../../chartjs/templates/utils';

const DEFAULT_COLORS = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#c0504d',
];

/** Numeric-ness test: a field is a dimension if (nearly) all non-null values parse as numbers. */
function isNumericField(table: any[], field: string): boolean {
    let total = 0;
    let numeric = 0;
    for (const row of table) {
        const v = row[field];
        if (v == null || v === '') continue;
        total++;
        if (typeof v === 'number' ? isFinite(v) : !isNaN(Number(v))) numeric++;
    }
    return total > 0 && numeric / total >= 0.9;
}

export const ecParallelCoordinatesDef: ChartTemplateDef = {
    chart: 'Parallel Coordinates',
    template: { mark: 'line', encoding: {} },
    channels: ['color', 'detail'],
    markCognitiveChannel: 'position',
    instantiate: (spec, ctx) => {
        const { channelSemantics, table, chartProperties } = ctx;
        if (table.length === 0) return;

        const colorField = channelSemantics.color?.field;

        // Resolve the ordered list of numeric dimensions.
        let dims: string[] = Array.isArray(chartProperties?.dimensions)
            ? chartProperties!.dimensions.filter((d: string) => d in table[0])
            : [];
        if (dims.length === 0) {
            dims = Object.keys(table[0]).filter(
                (k) => k !== colorField && isNumericField(table, k),
            );
        }
        if (dims.length < 2) return;

        const palette = colorField ? getChartJsPalette(ctx, 'color') : DEFAULT_COLORS;
        const colors = palette.length > 0 ? palette : DEFAULT_COLORS;

        const parallelAxis = dims.map((name, i) => ({
            dim: i,
            name,
            nameTextStyle: { fontSize: 11 },
            nameGap: 8,
            axisLabel: { fontSize: 10 },
        }));

        const toLine = (row: any) => dims.map((d) => {
            const v = Number(row[d]);
            return isFinite(v) ? v : null;
        });

        const series: any[] = [];
        const legendData: string[] = [];
        // Thinner, more transparent lines as the dataset grows (avoid a hairball).
        const lineOpacity = table.length > 200 ? 0.22 : table.length > 100 ? 0.3 : table.length > 60 ? 0.45 : 0.6;

        if (colorField) {
            const groups = new Map<string, any[]>();
            for (const row of table) {
                const key = String(row[colorField] ?? '');
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(toLine(row));
            }
            let i = 0;
            for (const [name, data] of groups) {
                legendData.push(name);
                series.push({
                    name,
                    type: 'parallel',
                    data,
                    lineStyle: { width: 1.5, opacity: lineOpacity, color: colors[i % colors.length] },
                    emphasis: { lineStyle: { width: 3, opacity: 0.9 } },
                });
                i++;
            }
        } else {
            series.push({
                type: 'parallel',
                data: table.map(toLine),
                lineStyle: { width: 1.5, opacity: lineOpacity, color: colors[0] },
                emphasis: { lineStyle: { width: 3, opacity: 0.9 } },
            });
        }

        const hasLegend = legendData.length > 1;

        // ── Layout: one column band per dimension ────────────────────────────
        const parTop = hasLegend ? 56 : 28;
        const parBottom = 36;
        const parLeft = 56;   // room for the first axis labels
        const parRight = 56;  // room for the last axis name
        const perDim = 96;    // horizontal band per dimension
        const canvasW = Math.max(ctx.canvasSize.width, parLeft + parRight + (dims.length - 1) * perDim);
        const canvasH = Math.max(ctx.canvasSize.height, parTop + parBottom + 200);

        const option: any = {
            tooltip: {},
            parallelAxis,
            parallel: {
                top: parTop,
                bottom: parBottom,
                left: parLeft,
                right: parRight,
                parallelAxisDefault: {
                    nameLocation: 'end',
                    nameGap: 14,
                    axisLine: { lineStyle: { color: '#888' } },
                    axisLabel: { color: '#555' },
                },
            },
            series,
            _width: canvasW,
            _height: canvasH,
        };

        if (hasLegend) {
            option.legend = {
                data: legendData,
                top: 8,
                left: 'center',
                orient: 'horizontal',
                itemWidth: 18,
                textStyle: { fontSize: 11 },
                ...(legendData.length > 10 ? { type: 'scroll' } : {}),
            };
        }

        Object.assign(spec, option);
        delete spec.mark;
        delete spec.encoding;
    },
};
