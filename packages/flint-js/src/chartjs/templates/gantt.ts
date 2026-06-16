// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Chart.js Gantt Chart — one horizontal floating bar per task, spanning
 * [start, end] (mirror vegalite/templates/gantt.ts).
 *
 * Channels:
 *   - y      task / activity label (the category axis)
 *   - x      start of the interval (temporal or quantitative)
 *   - x2     end of the interval (shares x's scale)
 *   - color  optional grouping (phase, owner, resource)
 *
 * Chart.js bars accept a `[start, end]` tuple natively (floating bars), so a
 * Gantt is a horizontal bar (`indexAxis: 'y'`) whose data are the intervals.
 * Tasks are sorted by start so the timeline reads chronologically top-to-bottom
 * (Chart.js draws category index 0 at the top of a horizontal bar). Temporal
 * intervals are positioned on a linear epoch-ms axis with a date tick callback,
 * avoiding a date-adapter dependency.
 */

import { ChartTemplateDef } from '../../core/types';
import { coerceUnixMsForChartJs, DEFAULT_COLORS, DEFAULT_BG_COLORS } from './utils';

function fmtDate(ms: number): string {
    if (!Number.isFinite(ms)) return '';
    return new Date(ms).toISOString().slice(0, 10);
}

export const cjsGanttChartDef: ChartTemplateDef = {
    chart: 'Gantt Chart',
    template: { mark: 'bar', encoding: {} },
    channels: ['y', 'x', 'x2', 'color', 'column', 'row'],
    markCognitiveChannel: 'position',
    declareLayoutMode: () => ({ axisFlags: { y: { banded: true } } }),
    instantiate: (spec, ctx) => {
        const { channelSemantics, table } = ctx;
        const taskField = channelSemantics.y?.field;
        const startField = channelSemantics.x?.field;
        const endField = channelSemantics.x2?.field;
        const colorField = channelSemantics.color?.field;
        if (!taskField || !startField || !endField || table.length === 0) return;

        const temporal = channelSemantics.x?.type === 'temporal';
        const num = (v: unknown) => (temporal ? coerceUnixMsForChartJs(v) : Number(v));

        const rows = table
            .map((r: any) => ({
                task: String(r[taskField] ?? ''),
                start: num(r[startField]),
                end: num(r[endField]),
                group: colorField != null ? String(r[colorField] ?? '') : undefined,
            }))
            .filter((r) => r.task && Number.isFinite(r.start) && Number.isFinite(r.end))
            .sort((a, b) => a.start - b.start);

        const groups = colorField
            ? Array.from(new Set(rows.map((r) => r.group ?? '')))
            : [];
        const groupIndex = new Map<string, number>();
        groups.forEach((g, i) => groupIndex.set(g, i));

        const colorFor = (group: string | undefined): { bg: string; border: string } => {
            const i = group != null ? (groupIndex.get(group) ?? 0) : 0;
            return {
                bg: DEFAULT_BG_COLORS[i % DEFAULT_BG_COLORS.length],
                border: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            };
        };

        const labels = rows.map((r) => r.task);
        const data = rows.map((r) => [r.start, r.end] as [number, number]);
        const bg = rows.map((r) => colorFor(r.group).bg);
        const border = rows.map((r) => colorFor(r.group).border);

        const config: any = {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: taskField,
                    data,
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth: 1,
                    borderRadius: 2,
                    borderSkipped: false,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: false,
                        title: { display: !temporal, text: startField },
                        ...(temporal
                            ? { ticks: { callback: (v: number) => fmtDate(Number(v)) } }
                            : {}),
                    },
                    y: { title: { display: false } },
                },
                plugins: {
                    legend: colorField && groups.length > 1
                        ? {
                            display: true,
                            labels: {
                                generateLabels: () => groups.map((g) => {
                                    const c = colorFor(g);
                                    return {
                                        text: g,
                                        fillStyle: c.bg,
                                        strokeStyle: c.border,
                                        lineWidth: 1,
                                    };
                                }),
                            },
                        }
                        : { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item: any) => {
                                const [s, e] = item.raw as [number, number];
                                const fs = temporal ? fmtDate(s) : s;
                                const fe = temporal ? fmtDate(e) : e;
                                return `${fs} → ${fe}`;
                            },
                        },
                    },
                },
            },
        };

        Object.assign(spec, config);
        delete spec.mark;
        delete spec.encoding;
    },
};
