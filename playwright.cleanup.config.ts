import { defineConfig, devices } from '@playwright/test';
import { ORG_URL, savedSession } from './config/env';

/**
 * Config for the destructive maintenance scripts in ./maintenance.
 * Kept separate from playwright.config.ts so `npx playwright test` cannot pick
 * them up and run them concurrently with tests that create records.
 *
 *   npm run cleanup          dry run
 *   npm run cleanup:delete   deletes
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
    storageState: savedSession(),
    trace: 'on-first-retry',
  },
  projects: [
    // Same session check as the test config, so an expired session fails before cleanup starts.
    {
      name: 'session',
      testDir: './setup',
      testMatch: /session\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['session'],
    },
  ],
});
