import { devices, type PlaywrightTestConfig } from '@playwright/test';
import { ORG_URL, savedSession } from './env';

/**
 * Everything the test config and the cleanup config have in common: the org, the session,
 * Lightning-sized timeouts, failure evidence, and the projects. Each config spreads this and
 * adds only what makes it different, so the two cannot drift apart.
 */
export const base: PlaywrightTestConfig = {
  // Playwright's defaults (30s per test, 5s per assertion) assume a fast local app. Against
  // this org a spec that navigates, opens a form and saves routinely takes 20s+, so the
  // budgets live here and specs pass a timeout only for a signal known to be slower still.
  timeout: 90_000,
  expect: { timeout: 30_000 },

  use: {
    // The org under test, from SF_LOGIN_URL in .env. Specs navigate with root-relative
    // paths so the org appears in exactly one place in the repo.
    baseURL: ORG_URL,
    storageState: savedSession(),

    // Without an action timeout, a click on a button that never renders waits out the whole
    // test and fails as a bare timeout; with one, it fails at the click with the locator named.
    actionTimeout: 30_000,
    navigationTimeout: 60_000,

    // Evidence for every failure, whether or not it retries. The scaffold's 'on-first-retry'
    // never recorded anything locally, where retries are 0.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Checks the saved session once before any spec runs; see setup/session.setup.ts.
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
};
