import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com');

  console.log('\n>>> Log in manually (username, password, email code).');
  console.log('>>> Get all the way to the Salesforce home page.');
  console.log('>>> Then come back HERE and press Enter in this terminal.\n');

  // Wait for you to press Enter in the terminal
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  console.log('\n✅ Session saved to playwright/.auth/user.json\n');

  await browser.close();
})();