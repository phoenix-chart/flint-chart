import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

// Configured for GitHub Pages deployment at /flint-chart/gallery/.
// Override with VITE_BASE_PATH when building for a different host.
const base = process.env.VITE_BASE_PATH ?? '/flint-chart/gallery/';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      'flint-chart': path.resolve(__dirname, '../../src/index.ts'),
      'flint-chart/test-data': path.resolve(__dirname, '../../src/test-data/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
