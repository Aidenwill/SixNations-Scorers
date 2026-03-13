import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true
  },
  reporter: 'line'
});
