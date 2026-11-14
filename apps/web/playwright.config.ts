import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

/**
 * End-to-end tests for the web app. They run against the Vite dev server in
 * mock mode (`VITE_USE_MOCK=true`), so no backend or database is required.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: BASE_URL,
    // Never attach to an unrelated dev server: the suite must exercise this
    // worktree's build with mock mode forced on.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_USE_MOCK: 'true',
    },
  },
});
