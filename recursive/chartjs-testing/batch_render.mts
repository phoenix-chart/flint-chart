/**
 * Batch render all Chart.js test cases.
 *
 * Reads test_cases/*.json, runs assembleChartjs on each, renders to PNG via
 * @napi-rs/canvas, and saves results next to a _spec.json dump.
 *
 * Usage: npx tsx recursive/chartjs-testing/batch_render.mts
 *
 * Must run from repo root.
 */
import { assembleChartjs } from '../../packages/flint-js/src/chartjs/assemble';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Chart.js from site/node_modules (v4); canvas from root node_modules.
const napiCanvas = require(path.join(REPO_ROOT, 'node_modules/@napi-rs/canvas'));
const { createCanvas } = napiCanvas;
const chartjs = require(path.join(REPO_ROOT, 'site/node_modules/chart.js/auto'));
const Chart = chartjs.default || chartjs.Chart || chartjs;

// Register system fonts for proper text rendering.
if (napiCanvas.GlobalFonts) {
    const fontPaths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ];
    for (const fp of fontPaths) {
        if (fs.existsSync(fp)) napiCanvas.GlobalFonts.registerFromPath(fp, 'sans-serif');
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, 'test_cases');
const OUTPUT_DIR = path.join(__dirname, 'rendered');

function asFinite(v: unknown): number | undefined {
    return typeof v === 'number' && isFinite(v) ? v : undefined;
}

function renderOne(testId: string, input: any): { width: number; height: number } {
    const config = assembleChartjs(input);
    const width = asFinite(config._width) ?? input.chart_spec?.canvasSize?.width ?? 480;
    const height = asFinite(config._height) ?? input.chart_spec?.canvasSize?.height ?? 320;

    const canvas: any = createCanvas(width, height);
    canvas.style = {};

    const merged = {
        ...config,
        options: {
            ...(config.options ?? {}),
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            devicePixelRatio: 1,
        },
    };
    // Strip flint-internal hints so Chart.js doesn't choke.
    delete (merged as any)._width;
    delete (merged as any)._height;
    delete (merged as any)._warnings;
    delete (merged as any)._dataLength;

    const chart = new Chart(canvas, merged);
    chart.draw();
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(OUTPUT_DIR, `${testId}.png`), buf);
    fs.writeFileSync(
        path.join(OUTPUT_DIR, `${testId}_spec.json`),
        JSON.stringify(config, null, 2),
    );
    chart.destroy();
    return { width, height };
}

function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const manifestPath = path.join(TEST_DIR, 'manifest.json');
    let entries: { test_id: string; description?: string }[];
    if (fs.existsSync(manifestPath)) {
        entries = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else {
        entries = fs.readdirSync(TEST_DIR)
            .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
            .map((f) => ({ test_id: f.replace(/\.json$/, '') }));
    }

    let success = 0;
    let failed = 0;
    for (const entry of entries) {
        const file = path.join(TEST_DIR, `${entry.test_id}.json`);
        if (!fs.existsSync(file)) {
            console.error(`❌ ${entry.test_id} (missing file)`);
            failed++;
            continue;
        }
        try {
            const tc = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const { width, height } = renderOne(entry.test_id, tc.input);
            console.log(`✅ ${entry.test_id} (${width}×${height})`);
            success++;
        } catch (err) {
            console.error(`❌ ${entry.test_id}:`, (err as Error).message);
            failed++;
        }
    }
    console.log(`\n=== Done: ${success} success, ${failed} failed out of ${entries.length} ===`);
}

main();
