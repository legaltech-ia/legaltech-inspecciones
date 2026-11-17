import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // e2e/ son specs de Playwright: vitest los recogia y fallaba con
    // "Playwright Test did not expect test.describe() to be called here",
    // dejando la suite en rojo por cuatro ficheros que no le tocan. Se corren
    // con `npm run e2e`.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
