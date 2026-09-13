import { test, expect } from '@playwright/test';

const ORG_URL = 'https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com';

test('create an Opportunity filling only the mandatory fields', async ({ page }) => {
  // Opportunity Name carries the marker: it is the first data column of the
  // Opportunity list views ("Opportunity Name", not "Name") and it is what the
  // list's own search box matches on, which is how maintenance/cleanup.spec.ts
  // finds these records again.
  const marker = `PW Test Opportunity ${Date.now()}`;

  // Close Date is required and free-text. The form states "Format: 12/31/2024",
  // so the org renders dates MM/DD/YYYY; build one rather than hardcoding a date
  // that quietly drifts into the past.
  const close = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const closeDate = [
    String(close.getMonth() + 1).padStart(2, '0'),
    String(close.getDate()).padStart(2, '0'),
    close.getFullYear(),
  ].join('/');

  await page.goto(ORG_URL);

  // Opportunities, via the console object navigation dropdown
  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: 'Opportunities', exact: true }).click();
  await expect(page).toHaveURL(/\/lightning\/o\/Opportunity\//, { timeout: 30_000 });
  // The URL flips before the page renders, and every object page has a New button
  // with this same accessible name. Without waiting for the Opportunities heading,
  // New can be clicked while the console still shows the previous object.
  // exact:true matters — the list-view header is a second level-1 heading whose
  // accessible name is "Opportunities Recently Viewed".
  await expect(page.getByRole('heading', { name: 'Opportunities', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Opportunity' })).toBeVisible({ timeout: 60_000 });

  // Close Date, Opportunity Name and Stage are the only three fields the form marks
  // required (read off the rendered labels, which prefix required ones with "*").
  // Unlike Lead's Status, Stage ships with no default — it sits on "--None--" — so
  // it has to be picked explicitly or Save fails validation.
  await page.getByRole('textbox', { name: 'Opportunity Name', exact: true }).fill(marker);
  await page.getByRole('textbox', { name: 'Close Date', exact: true }).fill(closeDate);
  await page.getByRole('combobox', { name: 'Stage', exact: true }).click();
  await page.getByRole('option', { name: 'Prospecting', exact: true }).click();

  // exact:true so this does not match "Save & New"
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: marker, exact: true })).toBeVisible();
});
