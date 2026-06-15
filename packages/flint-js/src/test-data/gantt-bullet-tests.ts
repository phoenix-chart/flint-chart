// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Gallery generators for two project/BI chart types — Vega-Lite.
 *
 *   - Gantt: one horizontal bar per task, spanning its start → end dates, with
 *     colour grouping tasks into project phases.
 *   - Bullet: one row per item, a measured value bar compared against a target
 *     marker (tick). Items share a common unit so the bars are comparable on a
 *     single axis.
 */

import { Type } from './df-types';
import { TestCase, makeField, makeEncodingItem } from './types';

// ---------------------------------------------------------------------------
// Gantt — a software release schedule
// ---------------------------------------------------------------------------

const RELEASE_PLAN: Array<[string, string, string, string]> = [
    // task, start, end, phase
    ['Requirements', '2024-01-01', '2024-01-22', 'Plan'],
    ['Design', '2024-01-15', '2024-02-12', 'Plan'],
    ['Backend', '2024-02-05', '2024-04-01', 'Build'],
    ['Frontend', '2024-02-19', '2024-04-15', 'Build'],
    ['Integration', '2024-04-01', '2024-04-29', 'Build'],
    ['QA & Testing', '2024-04-15', '2024-05-20', 'Verify'],
    ['Beta', '2024-05-06', '2024-06-03', 'Verify'],
    ['Launch', '2024-06-03', '2024-06-17', 'Release'],
];

export function genGanttTests(): TestCase[] {
    const data = RELEASE_PLAN.map(([task, start, end, phase]) => ({ task, start, end, phase }));
    return [
        {
            title: 'Project schedule',
            description:
                'One horizontal bar per task, spanning its start and end dates. '
                + 'Bars are coloured by project phase and tasks are ordered by '
                + 'start date, so the timeline reads top-to-bottom in chronological '
                + 'order. The interval lives on x/x2, so the time axis is not '
                + 'anchored at zero.',
            tags: ['gantt', 'timeline', 'temporal', 'range', 'gallery'],
            chartType: 'Gantt Chart',
            data,
            fields: [makeField('task'), makeField('start'), makeField('end'), makeField('phase')],
            metadata: {
                task: { type: Type.String, semanticType: 'Category', levels: [] },
                start: { type: Type.Date, semanticType: 'Date', levels: [] },
                end: { type: Type.Date, semanticType: 'Date', levels: [] },
                phase: { type: Type.String, semanticType: 'Category', levels: [] },
            },
            encodingMap: {
                y: makeEncodingItem('task'),
                x: makeEncodingItem('start'),
                x2: makeEncodingItem('end'),
                color: makeEncodingItem('phase'),
            },
        },
    ];
}

// ---------------------------------------------------------------------------
// Bullet — quarterly sales by rep against quota (same unit, $K)
// ---------------------------------------------------------------------------

const SALES_VS_QUOTA: Array<[string, number, number]> = [
    // rep, sales ($K), quota ($K)
    ['Anna', 284, 300],
    ['Ben', 172, 150],
    ['Carla', 248, 220],
    ['Diego', 305, 280],
    ['Eve', 198, 250],
    ['Frank', 226, 210],
];

export function genBulletTests(): TestCase[] {
    const data = SALES_VS_QUOTA.map(([rep, sales, quota]) => ({ rep, sales, quota }));
    return [
        {
            title: 'Sales vs quota',
            description:
                'One row per sales rep: a value bar for quarterly sales ($K) with '
                + 'a tick marking the rep\u2019s quota. The value bar reads as '
                + 'length from zero, and the target tick sits a little taller so it '
                + 'stands out as a reference marker.',
            tags: ['bullet', 'kpi', 'target', 'gallery'],
            chartType: 'Bullet Chart',
            data,
            fields: [makeField('rep'), makeField('sales'), makeField('quota')],
            metadata: {
                rep: { type: Type.String, semanticType: 'Category', levels: [] },
                sales: { type: Type.Number, semanticType: 'Quantity', levels: [] },
                quota: { type: Type.Number, semanticType: 'Quantity', levels: [] },
            },
            encodingMap: {
                y: makeEncodingItem('rep'),
                x: makeEncodingItem('sales'),
                goal: makeEncodingItem('quota'),
            },
        },
    ];
}
