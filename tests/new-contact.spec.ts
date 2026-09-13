import { test, expect } from '@playwright/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create a Contact filling only the mandatory field', async ({ page }) => {
  // Last Name carries the marker: it is the only required input on the form, and it is
  // what the Contacts list views render in their Name column. Nothing cleans these up
  // automatically — Contact is deliberately not in maintenance/cleanup.spec.ts — so the
  // marker is what keeps the record identifiable as test data in a live org, and what
  // would let Contact be added to that suite later without renaming anything.
  const name = marker('Test Contact');

  await page.goto('/');
  await gotoObject(page, 'Contact');

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Contact' })).toBeVisible({ timeout: 60_000 });

  // Last Name is the only field on this form that is both required and fillable. The
  // form does mark the compound "Name" group required, but that is the group's legend:
  // its other members (Salutation, First Name) are optional, so filling Last Name alone
  // satisfies it. No required picklists here, unlike Opportunity's Stage.
  await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill(name);

  // exact:true so this does not match "Save & New"
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Contact\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
});
