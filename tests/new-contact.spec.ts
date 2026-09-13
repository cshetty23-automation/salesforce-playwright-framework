import { test, expect } from '@playwright/test';

const ORG_URL = 'https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com';

test('create a Contact filling only the mandatory field', async ({ page }) => {
  // Last Name carries the marker: it is the only required input on the form, and it is
  // what the Contacts list views render in their Name column. Nothing cleans these up
  // automatically — Contact is deliberately not in maintenance/cleanup.spec.ts — so the
  // marker is what keeps the record identifiable as test data in a live org, and what
  // would let Contact be added to that suite later without renaming anything.
  const marker = `PW Test Contact ${Date.now()}`;

  await page.goto(ORG_URL);

  // Contacts, via the console object navigation dropdown
  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: 'Contacts', exact: true }).click();
  // Contacts opens on the Intelligence View, which is its own route
  // (/lightning/o/Contact/pipelineInspection) rather than the /list the Account,
  // Lead and Opportunity specs land on — so match the object, not the list path.
  await expect(page).toHaveURL(/\/lightning\/o\/Contact\//, { timeout: 30_000 });
  // The URL flips before the page renders, and every object page has a New button with
  // this same accessible name. exact:true matters — the view picker beside it is a
  // second level-1 heading whose accessible name is "Contacts My Contacts".
  await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Contact' })).toBeVisible({ timeout: 60_000 });

  // Last Name is the only field on this form that is both required and fillable. The
  // form does mark the compound "Name" group required, but that is the group's legend:
  // its other members (Salutation, First Name) are optional, so filling Last Name alone
  // satisfies it. No required picklists here, unlike Opportunity's Stage.
  await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill(marker);

  // exact:true so this does not match "Save & New"
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Contact\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: marker, exact: true })).toBeVisible();
});
