import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:test@localhost:5432/checkrepublic_test',
    },
  },
});
