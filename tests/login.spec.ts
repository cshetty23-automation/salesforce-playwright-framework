import { test, expect } from '@playwright/test';

test('lands on Salesforce home already logged in', async ({ page }) => {
  await page.goto('https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com');
  await expect(page).toHaveURL(/lightning/);
});

test('can open the Accounts page', async ({ page }) => {
  // Go straight to the Accounts list view (already logged in via saved session)
  await page.goto('https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com/lightning/o/Account/list');

  // Verify we're on the Accounts page by checking the heading text
   await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();
});