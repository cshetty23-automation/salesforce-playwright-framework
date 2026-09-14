import { defineConfig } from '@playwright/test';
import { base } from './config/playwright.base';

/**
 * Config for the destructive maintenance scripts in ./maintenance.
 * Kept separate from playwright.config.ts so `npx playwright test` cannot pick
 * them up and run them concurrently with tests that create records.
 *
 *   npm run cleanup          dry run
 *   npm run cleanup:delete   deletes
 *
 * Org, session, timeouts, failure evidence and projects come from config/playwright.base.ts.
 */
export default defineConfig({
  ...base,
  testDir: './maintenance',
  // Serial: deletions should be deterministic and readable in the log, and two
  // workers racing over the same org buys nothing here.
  fullyParallel: false,
  workers: 1,
  // List only — the html reporter writes to playwright-report/, which would
  // clobber the report from the last real test run.
  reporter: [['list']],
  // Same reason for traces and screenshots: a test run empties test-results/ when it starts,
  // so cleanup's failure evidence gets a folder of its own.
  outputDir: './cleanup-results',
});
