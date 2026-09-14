import { chromium } from '@playwright/test';
import { AUTH_FILE, ORG_URL } from './config/env';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Standalone tsx script, so it reads the org from config/env rather than baseURL,
  // which only exists inside a Playwright run.
  await page.goto(ORG_URL);

  console.log('\n>>> Log in manually (username, password, email code).');
  console.log('>>> Get all the way to the Salesforce home page.');
  console.log('>>> Then come back HERE and press Enter in this terminal.\n');

  // Wait for you to press Enter in the terminal
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`\n✅ Session saved to ${AUTH_FILE}\n`);

  await browser.close();
}

// process.exit rather than exitCode: on failure the headed browser is still open and would
// keep the process alive, leaving the terminal hanging on an error it has already printed.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
