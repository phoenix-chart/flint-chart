import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

// Single-app deployment at /flint-chart/ on GitHub Pages.
// Override with VITE_BASE_PATH for other hosts.
const base = process.env.VITE_BASE_PATH ?? '/flint-chart/';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    // NOTE: order matters — longer aliases must come first so 'flint-chart/test-data'
    // is matched before the bare 'flint-chart' substring alias.
    alias: [
      {
        find: 'flint-chart/test-data',
        replacement: path.resolve(__dirname, '../src/test-data/index.ts'),
      },
      {
        find: 'flint-chart',
        replacement: path.resolve(__dirname, '../src/index.ts'),
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
