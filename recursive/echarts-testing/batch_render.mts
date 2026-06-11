/**
 * Batch render all ECharts test cases.
 * 
 * Reads test_cases/*.json, runs assembleECharts on each,
 * renders to PNG, saves results.
 * 
 * Usage: npx tsx recursive/echarts-testing/batch_render.mts
 * 
 * Must run from repo root.
 */
import { assembleECharts } from '../../packages/flint-js/src/echarts/assemble';
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Use echarts from site/node_modules (6.0.0, stable for SSR)
// Canvas from root node_modules
const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const echarts = require(path.join(REPO_ROOT, 'site/node_modules/echarts'));
const napiCanvas = require(path.join(REPO_ROOT, 'node_modules/@napi-rs/canvas'));
const { createCanvas } = napiCanvas;

// Register system fonts for proper text rendering
if (napiCanvas.GlobalFonts) {
    const fontPaths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ];
    for (const fp of fontPaths) {
        if (fs.existsSync(fp)) {
            napiCanvas.GlobalFonts.registerFromPath(fp, 'sans-serif');
        }
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, 'test_cases');
const OUTPUT_DIR = path.join(__dirname, 'rendered');
const RESULTS_FILE = path.join(__dirname, 'render_results.json');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

interface RenderResult {
    test_id: string;
    chart_type: string;
    description: string;
    success: boolean;
    error?: string;
    width?: number;
    height?: number;
    png_path?: string;
    warnings?: string[];
}

const manifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
const results: RenderResult[] = [];

for (const entry of manifest) {
    const testFile = path.join(TEST_DIR, `${entry.test_id}.json`);
    const testCase = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    const input = testCase.input;
    
    const result: RenderResult = {
        test_id: entry.test_id,
        chart_type: entry.chart_type,
        description: entry.description,
        success: false,
    };
    
    try {
        const option = assembleECharts(input);
        
        const width = option._width || input.chart_spec?.canvasSize?.width || 600;
        const height = option._height || input.chart_spec?.canvasSize?.height || 400;
        const warnings = option._warnings || [];
        
        delete option._width;
        delete option._height;
        delete option._warnings;
        
    // Fix server-side rendering: disable calculable (interactive) visualMap
    if (option.visualMap) {
        if (Array.isArray(option.visualMap)) {
            option.visualMap = option.visualMap.map((vm: any) => ({ ...vm, calculable: false }));
        } else {
            option.visualMap = { ...option.visualMap, calculable: false };
        }
    }
        
    // Disable animation for server-side rendering
    option.animation = false;
        
        // Render
        const canvas = createCanvas(width, height);
        const chart = echarts.init(canvas as any, null, { renderer: 'canvas', width, height });
        chart.setOption(option);
        
        const buf = canvas.toBuffer('image/png');
        const pngPath = path.join(OUTPUT_DIR, `${entry.test_id}.png`);
        fs.writeFileSync(pngPath, buf);
        
        // Save spec too
        fs.writeFileSync(path.join(OUTPUT_DIR, `${entry.test_id}_spec.json`), JSON.stringify(option, null, 2));
        
        result.success = true;
        result.width = width;
        result.height = height;
        result.png_path = pngPath;
        result.warnings = warnings.map((w: any) => w.message || String(w));
        
        chart.dispose();
        
        console.log(`✅ ${entry.test_id} (${width}×${height})`);
    } catch (err: any) {
        result.error = err.message;
        console.log(`❌ ${entry.test_id}: ${err.message}`);
    }
    
    results.push(result);
}

// Save results
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

const succeeded = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
console.log(`\n=== Done: ${succeeded} success, ${failed} failed out of ${results.length} ===`);
