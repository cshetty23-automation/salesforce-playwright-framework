import { test, expect } from '@playwright/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create an Opportunity filling only the mandatory fields', async ({ page }) => {
  // Opportunity Name carries the marker: it is the first data column of the
  // Opportunity list views ("Opportunity Name", not "Name") and it is what the
  // list's own search box matches on, which is how maintenance/cleanup.spec.ts
  // finds these records again.
  const name = marker('Test Opportunity');

  // Close Date is required and free-text. The form states "Format: 12/31/2024",
  // so the org renders dates MM/DD/YYYY; build one rather than hardcoding a date
  // that quietly drifts into the past.
  const close = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const closeDate = [
    String(close.getMonth() + 1).padStart(2, '0'),
    String(close.getDate()).padStart(2, '0'),
    close.getFullYear(),
  ].join('/');

  await page.goto('/');
  await gotoObject(page, 'Opportunity');

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Opportunity' })).toBeVisible({ timeout: 60_000 });

  // Close Date, Opportunity Name and Stage are the only three fields the form marks
  // required (read off the rendered labels, which prefix required ones with "*").
  // Unlike Lead's Status, Stage ships with no default — it sits on "--None--" — so
  // it has to be picked explicitly or Save fails validation.
  await page.getByRole('textbox', { name: 'Opportunity Name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Close Date', exact: true }).fill(closeDate);
  await page.getByRole('combobox', { name: 'Stage', exact: true }).click();
  await page.getByRole('option', { name: 'Prospecting', exact: true }).click();

  // exact:true so this does not match "Save & New"
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
});
