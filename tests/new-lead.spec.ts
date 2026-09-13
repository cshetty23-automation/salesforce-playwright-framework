import { test, expect } from '@playwright/test';

test('create a Lead filling only the mandatory fields', async ({ page }) => {
  // Last Name carries the marker because it is what the Leads list renders in its
  // Name column, and that column is what tests/cleanup.spec.ts searches on.
  const marker = `PW Test Lead ${Date.now()}`;

  await page.goto('/');

  // Leads, via the console object navigation dropdown
  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: 'Leads', exact: true }).click();
  await expect(page).toHaveURL(/\/lightning\/o\/Lead\//, { timeout: 30_000 });
  // The URL flips before the page renders, and every object page has a New button
  // with this same accessible name. Without waiting for the Leads heading, New can
  // be clicked while the console still shows the previous object, opening its form.
  await expect(page.getByRole('heading', { name: 'Leads', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Lead' })).toBeVisible({ timeout: 60_000 });

  // Last Name and Company are the only required inputs on this form. Lead Status is
  // also marked required but ships with a default of "Open - Not Contacted".
  await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill(marker);
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill(marker);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Lead\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: marker })).toBeVisible();
});
