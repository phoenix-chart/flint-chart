// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChartTemplateDef, ChartPropertyDef } from '../../core/types';

export const densityPlotDef: ChartTemplateDef = {
    chart: "Density Plot",
    template: {
        mark: "area",
        transform: [{ density: "__field__" }],
        encoding: {
            x: { field: "value", type: "quantitative" },
            y: { field: "density", type: "quantitative" },
        },
    },
    channels: ["x", "color", "column", "row"],
    markCognitiveChannel: 'area',
    instantiate: (spec, ctx) => {
        const { x, color, column, row } = ctx.resolvedEncodings;
        if (x?.field) {
            spec.transform[0].density = x.field;
            spec.encoding.x.title = x.field;
        }

        // The density transform only emits its `value`/`density` columns plus the
        // fields named in `groupby`. Every field that partitions the chart — the
        // color series AND any column/row facet — must therefore be in `groupby`,
        // otherwise that field vanishes from the transformed data and its
        // encoding silently collapses (e.g. a column facet renders a single
        // "undefined" panel with all sites pooled together).
        const groupby: string[] = [];
        if (color?.field) {
            spec.encoding.color = { ...(spec.encoding.color || {}), ...color };
            groupby.push(color.field);
        }
        if (column) {
            spec.encoding.column = column;
            if (column.field) groupby.push(column.field);
        }
        if (row) {
            spec.encoding.row = row;
            if (row.field) groupby.push(row.field);
        }
        if (groupby.length > 0) {
            spec.transform[0].groupby = groupby;
        }

        const config = ctx.chartProperties;
        if (config?.bandwidth && config.bandwidth > 0) {
            spec.transform[0].bandwidth = config.bandwidth;
        }
    },
    properties: [
        { key: "bandwidth", label: "Bandwidth", type: "continuous", min: 0.05, max: 2, step: 0.05, defaultValue: 0 },
    ] as ChartPropertyDef[],
};
