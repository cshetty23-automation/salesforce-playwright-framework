import { test, expect } from '@playwright/test';

const ORG_URL = 'https://orgfarm-979bcd26f7-dev-ed.develop.lightning.force.com';

test('create an Account filling only the mandatory field', async ({ page }) => {
  // Unique per run so repeat runs don't collide and the records stay traceable
  const accountName = `PW Test Account ${Date.now()}`;

  await page.goto(ORG_URL + '/lightning/o/Account/list');

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Account' })).toBeVisible({ timeout: 30_000 });

  // Account Name is the only field marked required on this form
  await page.getByRole('textbox', { name: /account name/i }).fill(accountName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Saving lands on the new record's detail page
  await expect(page).toHaveURL(/\/lightning\/r\/Account\/\w+\/view/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: accountName })).toBeVisible();

  // --- Cleanup: uncomment the four lines below to delete the record this test creates ---
  // The last assertion is load-bearing, not decorative: it waits for the console to close
  // the deleted record's tab, which only happens once the server confirms the delete.
  // Asserting on the dialog closing instead lets the context tear down mid-request,
  // and the record silently survives.
  // await page.getByRole('button', { name: 'Show more actions' }).click();
  // await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  // await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  // await expect(page).not.toHaveURL(/\/lightning\/r\/Account\/\w+\/view/, { timeout: 30_000 });
});
