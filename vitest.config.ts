import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const vscodeMockPath = fileURLToPath(new URL('./src/__mocks__/vscode.ts', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['out/**/*', 'node_modules/**/*'],
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      vscode: vscodeMockPath,
    },
  },
});