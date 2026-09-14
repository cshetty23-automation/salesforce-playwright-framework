import { test as setup, expect } from '@playwright/test';

const EXPIRED =
  'The saved Salesforce session is missing or has expired (the org logs out after a couple of hours idle). ' +
  'Run `npm run auth`, log in, press Enter, then re-run.';

// Both configs run this project before anything else. Without it, an expired session shows
// up as every spec timing out on some Lightning element with nothing saying why; with it,
// the run stops at one failure that names the fix.
setup('saved Salesforce session is still valid', async ({ page }) => {
  await page.goto('/');

  // Logged out, the org serves its login form at the same root URL instead of redirecting,
  // so the URL cannot tell the two states apart — wait for whichever page actually renders.
  const loginHeading = page.getByRole('heading', { name: 'Salesforce login', exact: true });
  const lightning = page.getByRole('button', { name: 'App Launcher', exact: true });
  await expect(loginHeading.or(lightning), 'neither the login page nor Lightning rendered').toBeVisible({ timeout: 60_000 });

  // Whichever page rendered is already on screen, so the short timeout only bounds how long
  // the expired case takes to report; a logged-in page passes this immediately.
  await expect(loginHeading, EXPIRED).toBeHidden({ timeout: 1_000 });
});
