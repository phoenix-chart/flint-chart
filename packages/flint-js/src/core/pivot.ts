// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Chart pivot — a derived Category-B operator that re-routes encoding *fields*
 * across position/legend/facet *channels* to surface alternative views of the
 * same semantic spec (orientation swap, series↔axis role swap, facet split).
 *
 * The host stores the chosen pivot *state id* as a single override keyed by
 * `PivotDef.key` (default `'pivot'`) inside `chart_spec.chartProperties`, exactly
 * like any other encoding action. The compiler — not the host — owns the channel
 * permutation: at assemble time it enumerates the valid states for the current
 * encodings + data, picks the stored id (falling back to the identity state when
 * the id is stale or absent), and composes the resulting encoding map BEFORE the
 * rest of the pipeline runs (so sort/overflow/layout all resolve post-pivot).
 *
 * This module is intentionally backend-agnostic: it operates purely on the
 * abstract `ChartEncoding` map + the raw data table, so the same enumeration
 * drives Vega-Lite, ECharts and Chart.js.
 *
 * MVP linearization. The full design models the pivot states as the orbit of a
 * channel-permutation group, linearized by a Gray code so adjacent steps differ
 * by one generator. This first increment exposes a curated *star* of single-
 * generator views around the authored identity (identity → orientation → role →
 * facet), which is a valid finite cycle (Z/n over the ordered list) that always
 * returns to the authored view. Richer products land later.
 *
 * Role-swap has two type-preserving flavors: discrete↔color-hue (a category
 * moves between a banded axis and the legend — bars/lines) and, on position
 * marks only, measure↔(color-gradient | size) (a quantitative field moves
 * between a precise position axis and a demoted auxiliary channel — scatter).
 *
 * Two distinct group actions drive the channel moves, matching the design doc:
 *   - τ (transpose): flip two axis *slots* wholesale (`x↔y` orientation). Profile-
 *     agnostic, always occupancy-preserving — declared via `PivotDef.transpose`.
 *   - σ (permute): reassign a *field* to a same-profile channel (axis ↔ color/size)
 *     — declared via `PivotDef.permute`, admitted by the Young-block profile rule.
 * Keeping them separate is what lets the must-present guard drop out entirely.
 */

import { ChartEncoding, ChartTemplateDef, PivotDef, PivotTransition } from './types';

/** Resolved pivot surface attached to the assembled spec as `_pivot`. */
export interface PivotSurface {
    key: string;
    label: string;
    /** Number of states in the cycle (>= 2 when a control should show). */
    length: number;
    /** Index of the active state within `ids`. */
    index: number;
    /** Ordered state ids; `ids[0]` is always the identity (authored) view. */
    ids: string[];
    /** Parallel human labels for each state. */
    labels: string[];
}

/** Internal: a fully enumerated pivot for a given encoding map + data. */
export interface PivotComputation {
    key: string;
    label: string;
    ids: string[];
    labels: string[];
    statesById: Record<string, Record<string, ChartEncoding>>;
    /**
     * Chart-type override per state id, set only for chart-type *transition*
     * states (§4.6). Absent/undefined entries render with the authored template.
     */
    chartTypeById: Record<string, string | undefined>;
}

const DISCRETE_TYPES = new Set(['nominal', 'ordinal']);

function isDiscrete(enc: ChartEncoding | undefined): boolean {
    return !!enc?.field && !!enc.type && DISCRETE_TYPES.has(enc.type);
}

function isMeasure(enc: ChartEncoding | undefined): boolean {
    return !!enc?.field && (enc.type === 'quantitative' || !!enc.aggregate);
}

function isTemporal(enc: ChartEncoding | undefined): boolean {
    return enc?.type === 'temporal';
}

/**
 * Whether a temporal position axis is rendered as discrete *bands* (so it acts
 * as a category for pivot purposes) rather than a continuous time scale. Length
 * marks (bars/histograms) and color marks (heatmaps) band their categorical
 * axis; only position marks (line/area/scatter) lay time out continuously, where
 * "time stays horizontal" is the convention we preserve.
 */
function temporalActsDiscrete(template: ChartTemplateDef): boolean {
    return template.markCognitiveChannel !== 'position';
}

function clone(encodings: Record<string, ChartEncoding>): Record<string, ChartEncoding> {
    const out: Record<string, ChartEncoding> = {};
    for (const [ch, enc] of Object.entries(encodings)) {
        out[ch] = { ...enc };
    }
    return out;
}

function distinctCount(data: any[], field: string | undefined): number {
    if (!field || !Array.isArray(data)) return 0;
    const seen = new Set<unknown>();
    for (const row of data) {
        if (row && row[field] != null) seen.add(row[field]);
    }
    return seen.size;
}

/** Build the standard cartesian pivot declaration from its permissible domains. */
export function makeCartesianPivot(opts: Partial<PivotDef> = {}): PivotDef {
    return {
        key: opts.key ?? 'pivot',
        label: opts.label ?? 'View',
        transpose: opts.transpose ?? [],
        permute: opts.permute ?? [],
        shift: opts.shift ?? [],
        facetBudget: opts.facetBudget ?? 12,
        transitions: opts.transitions,
    };
}

/**
 * Canonical channel order so a swap pair has a stable id/label regardless of the
 * order it was declared in (e.g. `['color','x']` is normalized to `x ↔ color`).
 */
const CHANNEL_ORDER = ['x', 'y', 'color', 'size', 'group', 'column', 'row'];
function orderPair(a: string, b: string): [string, string] {
    const ia = CHANNEL_ORDER.indexOf(a);
    const ib = CHANNEL_ORDER.indexOf(b);
    return (ia <= ib ? [a, b] : [b, a]) as [string, string];
}

/**
 * Transpose generator (τ): exchange two axis *slots* wholesale (`x↔y`). This is
 * the orientation/flip — it carries each channel's full encoding to the other,
 * so it is profile-agnostic (category↔measure on a bar, measure↔measure on a
 * scatter, dimension↔dimension on a heatmap). It is suppressed only when a
 * continuous-temporal position axis must stay horizontal (line/area keep time on
 * `x`). Because both slots stay occupied it can never drop a required channel.
 * Returns `null` when either slot is unbound or the temporal-horizontal rule
 * blocks the flip.
 */
function transposeState(
    base: Record<string, ChartEncoding>,
    template: ChartTemplateDef,
    pair: [string, string],
): { id: string; label: string; enc: Record<string, ChartEncoding> } | null {
    const [a, b] = orderPair(pair[0], pair[1]);
    const ea = base[a];
    const eb = base[b];
    if (!ea?.field || !eb?.field) return null; // both slots must be bound
    // Keep a continuous-temporal axis horizontal (no vertical time on position marks).
    if (!temporalActsDiscrete(template) && (isTemporal(ea) || isTemporal(eb))) return null;
    const next = clone(base);
    next[a] = { ...eb };
    next[b] = { ...ea };
    return { id: `flip:${a}-${b}`, label: `τ_${a}↔${b}`, enc: next };
}

type ChannelProfile = 'measure' | 'category' | 'time';

/**
 * The profile a bound field presents on a channel: `measure` (quantitative or
 * aggregated), `category` (discrete, or a temporal axis the chart bands), or
 * `time` (continuous temporal). Two channels may exchange fields under {@link
 * permuteSwapState} only when their profiles match — the Young-block rule.
 */
function channelProfile(enc: ChartEncoding | undefined, template: ChartTemplateDef): ChannelProfile | null {
    if (!enc?.field) return null;
    if (isMeasure(enc)) return 'measure';
    if (isDiscrete(enc) || (isTemporal(enc) && temporalActsDiscrete(template))) return 'category';
    return 'time';
}

/**
 * Permute generator (σ): reassign a field between a position *axis* and an
 * *auxiliary* channel (`color`/`size`), admitting the swap only when both ends
 * share a {@link channelProfile} — the Young-block rule. This single predicate
 * subsumes the old measure↔measure and category↔color cases:
 *   - `measure` profile: position marks only (a bar's length-measure is privileged
 *     and never demotes to color/size); the peer quantities trade the precise axis.
 *   - `category` profile: the auxiliary must be `color` (only it carries a discrete
 *     series); the banded axis dimension and the legend series exchange places.
 * `x↔y` is handled by {@link transposeState}, not here, and pure auxiliary pairs
 * (`color↔size`) are never offered. No must-present guard is needed: both ends are
 * already bound, so the swap preserves occupancy by construction.
 * Returns `null` when no profile-preserving interpretation admits the pair.
 */
function permuteSwapState(
    base: Record<string, ChartEncoding>,
    template: ChartTemplateDef,
    pair: [string, string],
): { id: string; label: string; enc: Record<string, ChartEncoding> } | null {
    const [a, b] = orderPair(pair[0], pair[1]);
    // Canonical ordering keeps a position axis as `a`; the auxiliary is `b`.
    const posCh = a === 'x' || a === 'y' ? a : null;
    const auxCh = b;
    if (!posCh || (auxCh !== 'color' && auxCh !== 'size')) return null;
    const posEnc = base[posCh];
    const auxEnc = base[auxCh];
    if (!posEnc?.field || !auxEnc?.field) return null; // both ends must be bound
    if (posEnc.field === auxEnc.field) return null;

    const profile = channelProfile(posEnc, template);
    if (!profile || profile !== channelProfile(auxEnc, template)) return null; // different profile

    const id = `swap:${a}-${b}`;
    const label = `σ_${a}↔${b}`;

    if (profile === 'measure') {
        // Demoting a measure to an aux channel only reads on position marks; on a
        // length mark (bar) the value axis is privileged. Carry only the semantic
        // core so downstream assembly re-derives scales/schemes per channel.
        if (template.markCognitiveChannel !== 'position') return null;
        const next = clone(base);
        next[posCh] = measureCore(auxEnc);
        next[auxCh] = measureCore(posEnc);
        return { id, label, enc: next };
    }

    if (profile === 'category') {
        // Only `color` carries a discrete series to exchange with a banded axis.
        if (auxCh !== 'color') return null;
        const next = clone(base);
        next[posCh] = { ...auxEnc };
        next.color = { ...posEnc };
        return { id, label, enc: next };
    }

    return null; // continuous time does not demote to an auxiliary channel
}
function measureCore(enc: ChartEncoding): ChartEncoding {
    const core: ChartEncoding = { field: enc.field, type: enc.type };
    if (enc.aggregate) core.aggregate = enc.aggregate;
    return core;
}

/**
 * Default grouping channels a discrete *series* field can occupy, used to locate
 * the current series when a transition references the `'series'` sentinel. The
 * shiftable domain offered to the user is the template's declared `shift` list
 * (filtered against these semantics); this constant is the resolution fallback.
 */
const GROUPING_CHANNELS = ['color', 'group', 'column', 'row'];

/** Per-target budgets: facets allow more panels than a color/dodge legend. */
function routeBudget(target: string, facetBudget: number): number {
    if (target === 'column' || target === 'row') return facetBudget;
    if (target === 'group') return 12; // dodged sub-bars get cramped past ~12
    return 20; // color legend
}

/** Operator label for routing the series onto a grouping channel (γ = shift). */
function routeLabel(target: string): string {
    return `γ_→${target}`;
}

/** Find the discrete series field and the grouping channel it currently sits on. */
function findSeries(
    base: Record<string, ChartEncoding>,
    candidates: string[],
    channels: string[],
): { channel: string; enc: ChartEncoding } | null {
    for (const ch of candidates) {
        if (channels.includes(ch) && isDiscrete(base[ch])) {
            return { channel: ch, enc: base[ch]! };
        }
    }
    return null;
}

/**
 * Series-routing generator (γ): take the chart's single discrete series field and
 * offer every *other* shiftable channel as an alternative placement — color
 * (stacked), group (grouped/dodged), column/row (facets). The candidate domain is
 * the template's declared `shift` list; this is the dimension that unifies
 * stacked/grouped/faceted presentations behind one template. Returns one state
 * per admissible target (present on the template, currently empty, cardinality
 * within budget).
 */
function seriesRoutingStates(
    base: Record<string, ChartEncoding>,
    template: ChartTemplateDef,
    data: any[],
    shiftChannels: string[],
    facetBudget: number,
): { id: string; enc: Record<string, ChartEncoding>; label: string }[] {
    const channels = template.channels ?? [];
    const src = findSeries(base, shiftChannels, channels);
    if (!src) return [];
    const card = distinctCount(data, src.enc.field);
    const out: { id: string; enc: Record<string, ChartEncoding>; label: string }[] = [];
    for (const target of shiftChannels) {
        if (target === src.channel) continue;
        if (!channels.includes(target)) continue;
        if (base[target]?.field) continue; // occupied — don't clobber
        if (card > routeBudget(target, facetBudget)) continue;
        const next = clone(base);
        delete next[src.channel];
        next[target] = { ...src.enc };
        out.push({ id: `series:${target}`, enc: next, label: routeLabel(target) });
    }
    return out;
}

/**
 * Build the encoding map for a chart-type *transition* (§4.6). A transition
 * re-views the same data as a sibling chart type, optionally re-routing one
 * field across channels first. Returns `null` when the transition's constraints
 * (source presence, discreteness, cardinality budget, target occupancy) are not
 * met. The `chartType` it returns tells the compiler to re-select the sibling
 * template for rendering while the authored chartType / encodings stay intact.
 */
function transitionState(
    base: Record<string, ChartEncoding>,
    data: any[],
    template: ChartTemplateDef,
    t: PivotTransition,
): { enc: Record<string, ChartEncoding>; chartType: string; label: string } | null {
    const enc = clone(base);
    const route = t.route;
    if (route) {
        // Resolve the source channel. `'series'` finds the discrete grouping
        // field wherever it sits (color/column/row); a literal name is used as-is.
        const fromCh = route.from === 'series'
            ? findSeries(base, GROUPING_CHANNELS, template.channels ?? [])?.channel
            : route.from;
        if (!fromCh) return null;
        const srcEnc = base[fromCh];
        if (!srcEnc?.field) return null; // nothing to re-route
        if (t.requireDiscreteSource && !isDiscrete(srcEnc)) return null;
        if (t.maxSourceCardinality != null &&
            distinctCount(data, srcEnc.field) > t.maxSourceCardinality) return null;
        const mode = route.mode ?? 'move';
        const dstEnc = base[route.to];
        if (mode === 'swap') {
            // The source field takes the target channel; the field displaced from
            // the target spills to `spill` (default: the vacated source channel).
            const spillCh = route.spill ?? fromCh;
            // Don't clobber an unrelated field already sitting on the spill slot.
            if (spillCh !== fromCh && base[spillCh]?.field) return null;
            enc[route.to] = { ...srcEnc };
            delete enc[fromCh];
            if (dstEnc?.field) enc[spillCh] = { ...dstEnc };
            else delete enc[spillCh];
        } else {
            // move: the target slot must be empty so we don't clobber a field
            if (dstEnc?.field) return null;
            delete enc[fromCh];
            enc[route.to] = { ...srcEnc };
        }
    }
    return { enc, chartType: t.to, label: t.label };
}

/**
 * A single applied generator (one step / one "delta"): the abstract operator
 * δ ∈ {σ, γ, θ} re-expressed as a concrete neighbor of a given encoding under a
 * given template. `id` is the step token used to build composite path ids,
 * `label` is its operator notation, and `chartType` is set only for θ steps.
 */
interface PivotStep {
    id: string;
    label: string;
    enc: Record<string, ChartEncoding>;
    chartType?: string;
}

/**
 * Enumerate the *one-step* neighbors of an encoding under a template's pivot
 * def — the generators δ applicable to `enc` right now. This is the building
 * block of the runtime orbit walk: the same enumerator runs on every reachable
 * state, so composing transforms is just "apply one more δ". The generators are
 * pure functions of the passed encoding (not the authored base), which is what
 * lets γ∘σ, σ∘θ, … fall out without any special-casing.
 */
function pivotSteps(
    template: ChartTemplateDef,
    enc: Record<string, ChartEncoding>,
    data: any[],
): PivotStep[] {
    const def = template.pivot;
    if (!def) return [];
    const steps: PivotStep[] = [];
    // τ: each declared axis-slot pair contributes its wholesale flip (orientation).
    for (const pair of def.transpose ?? []) {
        if (pair.length !== 2) continue;
        const s = transposeState(enc, template, [pair[0], pair[1]]);
        if (s) steps.push({ id: s.id, label: s.label, enc: s.enc });
    }
    // σ: each permutable block contributes its within-block axis↔aux field swaps as
    // candidate one-step moves; the orbit BFS composes them to close the block's
    // symmetric group. Profile-mismatched pairs return null and are dropped.
    for (const block of def.permute ?? []) {
        for (let i = 0; i < block.length; i++) {
            for (let j = i + 1; j < block.length; j++) {
                const s = permuteSwapState(enc, template, [block[i], block[j]]);
                if (s) steps.push({ id: s.id, label: s.label, enc: s.enc });
            }
        }
    }
    if (def.shift && def.shift.length) {
        for (const s of seriesRoutingStates(enc, template, data, def.shift, def.facetBudget ?? 12)) {
            steps.push({ id: s.id, label: s.label, enc: s.enc });
        }
    }
    if (def.transitions) {
        for (const t of def.transitions) {
            const st = transitionState(enc, data, template, t);
            // Operator notation: θ = chart-type transition, subscripted by the target view.
            if (st) steps.push({ id: `type:${t.to}`, label: `θ_→${t.label.toLowerCase()}`, enc: st.enc, chartType: st.chartType });
        }
    }
    return steps;
}

/**
 * Canonical fingerprint of an encoding map (+ effective chart type) used to
 * dedup orbit states. Two paths that land on the same channel→field assignment
 * collapse to one state — this is the group *stabilizer* quotient (e.g. σ∘σ = id
 * folds back onto `default`; faceting then jittering reaches the same strip plot
 * as jittering directly). Only the semantic core (field/type/aggregate) and the
 * occupied channel set matter; cosmetic encoding props are ignored.
 */
function encodingKey(enc: Record<string, ChartEncoding>, chartType: string | undefined): string {
    const cells = Object.keys(enc)
        .filter((ch) => enc[ch]?.field)
        .sort()
        .map((ch) => {
            const e = enc[ch];
            return `${ch}=${e.field}/${e.type ?? ''}/${e.aggregate ?? ''}`;
        });
    return `${chartType ?? ''}::${cells.join(',')}`;
}

/**
 * Reject orbit states that would be structurally invalid for their (effective)
 * template — primarily the cartesian invariant that a chart with both `x` and
 * `y` channels must keep *both* position axes bound (a scatter/line/bar with a
 * missing x or y is not a renderable view). This guards composed paths from
 * walking into degenerate encodings even if an individual generator is locally
 * type-preserving.
 */
function isRenderableState(template: ChartTemplateDef, enc: Record<string, ChartEncoding>): boolean {
    const channels = template.channels ?? [];
    if (channels.includes('x') && channels.includes('y')) {
        if (!enc.x?.field || !enc.y?.field) return false;
    }
    return true;
}

/** Hard cap on orbit size so a rich generator set can't produce an unwieldy control. */
const MAX_PIVOT_STATES = 12;

/**
 * Enumerate the pivot states for an encoding map + data under a template's
 * `PivotDef` by walking the *orbit* of the generators at runtime: start from the
 * authored identity and repeatedly apply one more δ (breadth-first), deduping by
 * {@link encodingKey} (the stabilizer quotient) and rejecting non-renderable
 * states (see {@link isRenderableState}). State ids are operator *paths* (e.g.
 * `orient|series:row`, `type:Strip Plot`); labels compose the per-step operator
 * notation with `·`. Returns `null` when no template pivot is declared. The
 * identity (authored) view is always state 0; a control should only render when
 * `ids.length > 1`.
 *
 * `resolveTemplate` lets the walk cross θ (chart-type) edges: after a transition
 * switches `chartType`, subsequent generators come from the *target* template's
 * pivot def. Backends that omit it leave θ states as leaves (no composition past
 * a chart-type change).
 */
export function computePivot(
    template: ChartTemplateDef,
    base: Record<string, ChartEncoding>,
    data: any[],
    resolveTemplate?: (chartType: string) => ChartTemplateDef | undefined,
): PivotComputation | null {
    const def = template.pivot;
    if (!def) return null;
    const key = def.key ?? 'pivot';
    const label = def.label ?? 'View';

    const ids: string[] = ['default'];
    const labels: string[] = ['Default'];
    const statesById: Record<string, Record<string, ChartEncoding>> = {
        default: clone(base),
    };
    const chartTypeById: Record<string, string | undefined> = {
        default: undefined,
    };

    interface OrbitNode {
        id: string;
        label: string;
        enc: Record<string, ChartEncoding>;
        chartType: string | undefined;
        template: ChartTemplateDef;
    }

    const seen = new Set<string>([encodingKey(base, undefined)]);
    const queue: OrbitNode[] = [{ id: 'default', label: 'Default', enc: clone(base), chartType: undefined, template }];
    // The authored chart type *is* home: a θ path that lands back on it (e.g.
    // Stacked → Grouped → Stacked) is not a new view, so we normalize its
    // effective chartType to `undefined`. This lets the stabilizer dedup fold
    // such round-trips onto the identity instead of showing them as extra states.
    const authoredChart = template.chart;

    while (queue.length > 0 && ids.length < MAX_PIVOT_STATES) {
        const cur = queue.shift()!;
        for (const step of pivotSteps(cur.template, cur.enc, data)) {
            // A θ step switches the effective chart type (and thus the template
            // whose generators apply next); σ/γ steps stay on the current one.
            let nextChartType = step.chartType ?? cur.chartType;
            if (nextChartType === authoredChart) nextChartType = undefined; // back home
            // A θ step switches the effective template (and thus the generators
            // that apply next). When no resolver is supplied — or it can't resolve
            // the target — the θ state becomes a *leaf*: we strip its pivot so no
            // further (wrong-template) generators compose past the chart-type
            // change. σ/γ/τ steps stay on the current template.
            const resolved = step.chartType ? resolveTemplate?.(step.chartType) : undefined;
            const nextTemplate: ChartTemplateDef = step.chartType
                ? (resolved ?? { ...cur.template, pivot: undefined })
                : cur.template;
            if (!isRenderableState(nextTemplate, step.enc)) continue; // avoid invalid combos
            const fp = encodingKey(step.enc, nextChartType);
            if (seen.has(fp)) continue; // dedup (stabilizer)
            seen.add(fp);
            const id = cur.id === 'default' ? step.id : `${cur.id}|${step.id}`;
            const stepLabel = cur.id === 'default' ? step.label : `${cur.label} · ${step.label}`;
            ids.push(id);
            labels.push(stepLabel);
            statesById[id] = step.enc;
            chartTypeById[id] = nextChartType;
            queue.push({ id, label: stepLabel, enc: step.enc, chartType: nextChartType, template: nextTemplate });
            if (ids.length >= MAX_PIVOT_STATES) break;
        }
    }

    return { key, label, ids, labels, statesById, chartTypeById };
}

/**
 * Resolve the active pivot state for the stored override and return both the
 * transformed encodings and the serializable surface (or the untouched base
 * encodings + `undefined` surface when no multi-state pivot applies).
 */
export function applyPivot(
    template: ChartTemplateDef,
    base: Record<string, ChartEncoding>,
    data: any[],
    chartProperties: Record<string, any> | undefined,
    resolveTemplate?: (chartType: string) => ChartTemplateDef | undefined,
): { encodings: Record<string, ChartEncoding>; chartType: string | undefined; surface: PivotSurface | undefined } {
    const comp = computePivot(template, base, data, resolveTemplate);
    if (!comp || comp.ids.length <= 1) {
        return { encodings: base, chartType: undefined, surface: undefined };
    }
    const stored = chartProperties?.[comp.key];
    const id = typeof stored === 'string' && comp.ids.includes(stored) ? stored : comp.ids[0];
    const index = comp.ids.indexOf(id);
    return {
        encodings: comp.statesById[id],
        chartType: comp.chartTypeById[id],
        surface: {
            key: comp.key,
            label: comp.label,
            length: comp.ids.length,
            index,
            ids: comp.ids,
            labels: comp.labels,
        },
    };
}
