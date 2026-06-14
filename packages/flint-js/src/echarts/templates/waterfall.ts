// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * ECharts Waterfall Chart — cumulative bar with start/delta/end (mirror vegalite/templates/waterfall.ts).
 */

import { ChartTemplateDef } from '../../core/types';
import { extractCategories } from './utils';

/** True if all category labels parse as numbers → horizontal; else vertical (align with line/bar). */
function areCategoriesNumeric(cats: string[]): boolean {
    if (cats.length === 0) return true;
    return cats.every((c) => {
        const s = String(c).trim();
        if (s === '') return false;
        const n = Number(s);
        return !isNaN(n) && isFinite(n);
    });
}

export const ecWaterfallChartDef: ChartTemplateDef = {
    chart: 'Waterfall Chart',
    template: { mark: 'bar', encoding: {} },
    channels: ['x', 'y', 'color', 'column', 'row'],
    markCognitiveChannel: 'length',
    declareLayoutMode: () => ({ axisFlags: { x: { banded: true } } }),
    instantiate: (spec, ctx) => {
        const { channelSemantics, table } = ctx;
        const xField = channelSemantics.x?.field || 'Category';
        const yField = channelSemantics.y?.field || 'Amount';
        const colorField = channelSemantics.color?.field;

        const categories = extractCategories(table, xField, undefined);
        const rows = categories.map(cat => table.find((r: any) => String(r[xField]) === cat)).filter(Boolean);
        const values = rows.map((r: any) => Number(r[yField]) || 0);

        const hasTypeCol = !!colorField;
        const types: string[] = hasTypeCol
            ? rows.map((r: any) => String(r[colorField] ?? 'delta'))
            : values.map((_, i) => i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'delta');

        // Cumulative sum including the current row (mirror vegalite/templates/waterfall.ts).
        const cumulative: number[] = [];
        let acc = 0;
        for (const v of values) { acc += v; cumulative.push(acc); }

        const COLOR = { startEnd: '#5470c6', increase: '#91cc75', decrease: '#ee6666' };

        // Per-bar [base, base+height]. 'start'/'end' are anchored at 0 (full bars to
        // the running total — the end row's own value is a subtotal marker, excluded,
        // matching Vega-Lite); 'delta' floats from the previous running total. Heights
        // are kept positive (base = the lower edge) because ECharts stacks negative
        // values on a separate negative stack, which would otherwise drop decrease bars
        // to the zero baseline instead of floating them.
        const baseData: number[] = [];
        const deltaData: Array<{ value: number; itemStyle: { color: string } }> = [];
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            const t = types[i];
            const top = t === 'end' ? cumulative[i] - v : cumulative[i];
            const prev = (t === 'start' || t === 'end') ? 0 : cumulative[i] - v;
            const lo = Math.min(prev, top);
            const hi = Math.max(prev, top);
            const color = (t === 'start' || t === 'end')
                ? COLOR.startEnd
                : top >= prev ? COLOR.increase : COLOR.decrease;
            baseData.push(lo);
            deltaData.push({ value: hi - lo, itemStyle: { color } });
        }

        const legendItems = ['Start/End', 'Increase', 'Decrease'];
        const legendColors = [COLOR.startEnd, COLOR.increase, COLOR.decrease];

        const option: any = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any[]) => {
                    const head = params[0]?.axisValueLabel ?? params[0]?.name ?? '';
                    const bar = params.find((p) => p.seriesName === 'Delta' && p.value != null);
                    if (!bar) return String(head);
                    return `${head}<br/>${bar.marker} ${yField}: ${bar.value}`;
                },
            },
            legend: {
                data: legendItems,
            },
            xAxis: {
                type: 'category',
                data: categories,
                name: xField,
                nameLocation: 'middle',
                nameGap: 30,
                axisTick: { show: true, alignWithLabel: true },
                axisLabel: {
                    rotate: areCategoriesNumeric(categories) ? 0 : 90,
                    formatter: (value: string) => value,
                },
            },
            yAxis: { type: 'value', name: yField, axisTick: { show: true } },
            series: [
                { type: 'bar', name: '_base', data: baseData, stack: 'wf', itemStyle: { color: 'transparent' }, silent: true, emphasis: { disabled: true } },
                {
                    type: 'bar',
                    name: 'Delta',
                    data: deltaData,
                    stack: 'wf',
                },
                // Legend-only series: no data, only for the legend colour swatches.
                ...legendItems.map((name, i) => ({
                    type: 'bar' as const,
                    name,
                    data: [] as number[],
                    itemStyle: { color: legendColors[i] },
                })),
            ],
        };

        Object.assign(spec, option);
        delete spec.mark;
        delete spec.encoding;
    },
};
