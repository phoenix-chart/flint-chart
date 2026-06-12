/**
 * Convert gallery TEST_GENERATORS output into harness test_cases JSON.
 *
 * Usage:
 *   npx tsx recursive/gen_gallery_cases.mts <backend> <prefix> "<Generator Key>" [more keys...]
 *   backend = echarts | chartjs   (selects the output test_cases dir)
 *
 * Mirrors site/src/shared/test-case-utils.ts::testCaseToAssemblyInput so the
 * rendered output matches exactly what the gallery shows.
 */
import { TEST_GENERATORS } from '../packages/flint-js/src/test-data/index';
import type { TestCase } from '../packages/flint-js/src/test-data/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function buildEncodings(t: TestCase): Record<string, unknown> {
    const idToName = new Map(t.fields.map((f) => [f.id, f.name]));
    const encodings: Record<string, unknown> = {};
    for (const [channel, e] of Object.entries(t.encodingMap)) {
        if (!e?.fieldID) continue;
        const field = idToName.get(e.fieldID) ?? e.fieldID;
        encodings[channel] = {
            field,
            type: (e as any).dtype,
            aggregate: e.aggregate,
            sortOrder: e.sortOrder,
            sortBy: e.sortBy,
            scheme: e.scheme,
        };
    }
    return encodings;
}

function toInput(t: TestCase) {
    const semantic_types: Record<string, string> = {};
    for (const [k, m] of Object.entries(t.metadata)) semantic_types[k] = m.semanticType;
    return {
        data: { values: t.data },
        semantic_types,
        chart_spec: {
            chartType: t.chartType,
            encodings: buildEncodings(t),
            canvasSize: { width: 480, height: 320 },
            chartProperties: t.chartProperties,
        },
        options: t.assembleOptions,
        semantic_annotations: t.semanticAnnotations,
    };
}

function slug(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function main() {
    const [, , backend, prefix, ...keys] = process.argv;
    if (!backend || !prefix || keys.length === 0) {
        console.error('args: <backend> <prefix> "<Generator Key>" [more keys...]');
        process.exit(1);
    }
    const dir = path.join(REPO_ROOT, `recursive/${backend}-testing/test_cases`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const manifestPath = path.join(dir, 'manifest.json');
    const manifest: { test_id: string; description?: string }[] =
        fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) : [];
    const existing = new Set(manifest.map((m) => m.test_id));

    for (const key of keys) {
        const gen = (TEST_GENERATORS as Record<string, () => TestCase[]>)[key];
        if (!gen) { console.error(`unknown generator: ${key}`); continue; }
        const cases = gen();
        cases.forEach((tc, i) => {
            const testId = `${prefix}_${slug(key)}_${i}`;
            const obj = { test_id: testId, description: tc.title, input: toInput(tc) };
            fs.writeFileSync(path.join(dir, `${testId}.json`), JSON.stringify(obj, null, 2));
            if (!existing.has(testId)) { manifest.push({ test_id: testId, description: tc.title }); existing.add(testId); }
            console.log(`wrote ${testId}  (${tc.chartType})`);
        });
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`manifest now has ${manifest.length} entries`);
}

main();
