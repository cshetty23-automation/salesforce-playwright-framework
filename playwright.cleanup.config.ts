import { defineConfig, devices } from '@playwright/test';
import { ORG_URL } from './config/env';

/**
 * Config for the destructive maintenance scripts in ./maintenance.
 * Kept separate from playwright.config.ts so `npx playwright test` cannot pick
 * them up and run them concurrently with tests that create records.
 *
 *   npx playwright test -c playwright.cleanup.config.ts
 */
export default defineConfig({
  testDir: './maintenance',
  // Serial: deletions should be deterministic and readable in the log, and two
  // workers racing over the same org buys nothing here.
  fullyParallel: false,
  workers: 1,
  // List only — the html reporter writes to playwright-report/, which would
  // clobber the report from the last real test run.
  reporter: [['list']],
  use: {
    // Same org as the test config, from the same single source in .env.
    baseURL: ORG_URL,
    storageState: 'playwright/.auth/user.json',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
