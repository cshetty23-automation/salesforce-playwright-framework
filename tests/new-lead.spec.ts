import { test, expect } from '@playwright/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create a Lead filling only the mandatory fields', async ({ page }) => {
  // Last Name carries the marker because it is what the Leads list renders in its
  // Name column, and that column is what maintenance/cleanup.spec.ts searches on.
  const name = marker('Test Lead');

  await page.goto('/');
  await gotoObject(page, 'Lead');

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Lead' })).toBeVisible({ timeout: 60_000 });

  // Last Name and Company are the only required inputs on this form. Lead Status is
  // also marked required but ships with a default of "Open - Not Contacted".
  await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Lead\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name })).toBeVisible();
});
