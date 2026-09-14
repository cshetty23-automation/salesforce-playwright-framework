import { defineConfig } from '@playwright/test';
import { base } from './config/playwright.base';

// Org, session, timeouts, failure evidence and projects come from config/playwright.base.ts.
export default defineConfig({
  ...base,
  testDir: './tests',
  fullyParallel: true,
  // Fail the build on CI if test.only was left in the source.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
});
