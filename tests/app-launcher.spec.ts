import { test, expect } from '@playwright/test';

test('app launcher > Sales Console > Accounts > All Accounts > New', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/lightning/);

  // App launcher (the 9 dots)
  await page.getByRole('button', { name: 'App Launcher' }).click();
  await page.getByPlaceholder(/search apps and items/i).fill('Sales Console');
  await page.getByRole('option', { name: 'Sales Console' }).click();

  // Accounts object, from the console navigation menu
  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: 'Accounts', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();

  // List view > All Accounts
  await page.getByRole('button', { name: /select a list view/i }).click();
  await page.getByRole('option', { name: 'All Accounts', exact: true }).click();
  await expect(page.getByRole('heading', { name: /all accounts/i })).toBeVisible();

  // New — in the console app this opens a new workspace tab, not a modal
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Account' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('textbox', { name: /account name/i })).toBeVisible();
});
