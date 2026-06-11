import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

// Use a relative base by default so the same build works for both
// public Pages (`microsoft.github.io/flint-chart/`) and private Pages
// (`<random>.pages.github.io/` at the host root).
// Override with VITE_BASE_PATH if hosting at a specific absolute path.
const base = process.env.VITE_BASE_PATH ?? './';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    // NOTE: order matters — longer aliases must come first so 'flint-chart/test-data'
    // is matched before the bare 'flint-chart' substring alias.
    alias: [
      {
        find: 'flint-chart/test-data',
        replacement: path.resolve(__dirname, '../packages/flint-js/src/test-data/index.ts'),
      },
      {
        find: 'flint-chart',
        replacement: path.resolve(__dirname, '../packages/flint-js/src/index.ts'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5274,
    open: true,
  },
});
