// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Curated *faceted* (small-multiples) examples for the main chart types.
 *
 * Unlike the exhaustive stress cases in `facet-tests.ts`, these are a single,
 * clean, realistic column-faceted example per main chart type (bar, line,
 * scatter, area). They are appended to the corresponding gallery generators so
 * every main chart type advertises a small-multiples variant, and they are
 * pinned by `selectVariants` so the faceted tile always appears on the wall.
 */

import { Type } from './df-types';
import { Channel, EncodingItem } from './df-types';
import { TestCase, makeField, makeEncodingItem } from './types';
import { seededRandom } from './generators';

/** Shared tag set so the gallery can detect + pin these examples. */
const FACET_TAGS = ['facet', 'gallery-facet', 'column'];

function meta(type: Type, semanticType: string, levels: any[] = []) {
    return { type, semanticType, levels };
}

/**
 * Column-faceted bar — sales by segment, one small panel per region.
 * 3 panels × 4 bars: comfortably fits side-by-side as small multiples.
 */
export function galleryFacetBarExample(): TestCase {
    const rand = seededRandom(4201);
    const regions = ['North', 'Central', 'South'];
    const segments = ['Consumer', 'Corporate', 'Home Office', 'Reseller'];
    const data: any[] = [];
    for (const region of regions) {
        for (const segment of segments) {
            data.push({ Segment: segment, Sales: Math.round(40 + rand() * 360), Region: region });
        }
    }
    const encodingMap: Partial<Record<Channel, EncodingItem>> = {
        x: makeEncodingItem('Segment'),
        y: makeEncodingItem('Sales'),
        column: makeEncodingItem('Region'),
    };
    return {
        title: 'Sales by segment, faceted by region',
        description: 'Small-multiples bar chart — one panel per region (column facet).',
        tags: [...FACET_TAGS, 'bar'],
        chartType: 'Bar Chart',
        data,
        fields: [makeField('Segment'), makeField('Sales'), makeField('Region')],
        metadata: {
            Segment: meta(Type.String, 'Category', segments),
            Sales: meta(Type.Number, 'Amount'),
            Region: meta(Type.String, 'Category', regions),
        },
        encodingMap,
    };
}

/**
 * Column-faceted line — monthly revenue trend, one panel per region.
 */
export function galleryFacetLineExample(): TestCase {
    const rand = seededRandom(4202);
    const regions = ['North', 'Central', 'South'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data: any[] = [];
    for (const region of regions) {
        let value = 60 + rand() * 60;
        for (const month of months) {
            value = Math.max(20, value + (rand() - 0.4) * 35);
            data.push({ Month: month, Revenue: Math.round(value), Region: region });
        }
    }
    const encodingMap: Partial<Record<Channel, EncodingItem>> = {
        x: makeEncodingItem('Month'),
        y: makeEncodingItem('Revenue'),
        column: makeEncodingItem('Region'),
    };
    return {
        title: 'Monthly revenue, faceted by region',
        description: 'Small-multiples line chart — one trend panel per region (column facet).',
        tags: [...FACET_TAGS, 'line'],
        chartType: 'Line Chart',
        data,
        fields: [makeField('Month'), makeField('Revenue'), makeField('Region')],
        metadata: {
            Month: meta(Type.String, 'Month', months),
            Revenue: meta(Type.Number, 'Quantity'),
            Region: meta(Type.String, 'Category', regions),
        },
        encodingMap,
    };
}

/**
 * Column-faceted scatter — height vs. weight, one panel per group.
 */
export function galleryFacetScatterExample(): TestCase {
    const rand = seededRandom(4203);
    const groups = ['Group A', 'Group B', 'Group C'];
    const data: any[] = [];
    for (const group of groups) {
        const base = 150 + rand() * 25;
        for (let i = 0; i < 22; i++) {
            const height = Math.round(base + (rand() - 0.5) * 40);
            const weight = Math.round(height * (0.4 + rand() * 0.18));
            data.push({ Height: height, Weight: weight, Group: group });
        }
    }
    const encodingMap: Partial<Record<Channel, EncodingItem>> = {
        x: makeEncodingItem('Height'),
        y: makeEncodingItem('Weight'),
        column: makeEncodingItem('Group'),
    };
    return {
        title: 'Height vs. weight, faceted by group',
        description: 'Small-multiples scatter plot — one panel per group (column facet).',
        tags: [...FACET_TAGS, 'scatter'],
        chartType: 'Scatter Plot',
        data,
        fields: [makeField('Height'), makeField('Weight'), makeField('Group')],
        metadata: {
            Height: meta(Type.Number, 'Value'),
            Weight: meta(Type.Number, 'Value'),
            Group: meta(Type.String, 'Category', groups),
        },
        encodingMap,
    };
}

/**
 * Column-faceted area — monthly visits, one panel per acquisition channel.
 */
export function galleryFacetAreaExample(): TestCase {
    const rand = seededRandom(4204);
    const channels = ['Organic', 'Paid', 'Referral'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data: any[] = [];
    for (const channel of channels) {
        let value = 200 + rand() * 200;
        for (const month of months) {
            value = Math.max(60, value + (rand() - 0.4) * 120);
            data.push({ Month: month, Visits: Math.round(value), Channel: channel });
        }
    }
    const encodingMap: Partial<Record<Channel, EncodingItem>> = {
        x: makeEncodingItem('Month'),
        y: makeEncodingItem('Visits'),
        column: makeEncodingItem('Channel'),
    };
    return {
        title: 'Monthly visits, faceted by channel',
        description: 'Small-multiples area chart — one panel per acquisition channel (column facet).',
        tags: [...FACET_TAGS, 'area'],
        chartType: 'Area Chart',
        data,
        fields: [makeField('Month'), makeField('Visits'), makeField('Channel')],
        metadata: {
            Month: meta(Type.String, 'Month', months),
            Visits: meta(Type.Number, 'Quantity'),
            Channel: meta(Type.String, 'Category', channels),
        },
        encodingMap,
    };
}
