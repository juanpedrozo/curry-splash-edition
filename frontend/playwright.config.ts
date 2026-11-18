import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env['CURRY_E2E_BASE_URL'] ?? 'http://127.0.0.1:8080',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env['CURRY_CHROMIUM_PATH'] },
    trace: 'retain-on-failure',
  },
});
