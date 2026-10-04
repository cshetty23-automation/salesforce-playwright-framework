import { test, expect } from '../helpers/test';

// Starting point for the planner and generator agents: planner_setup_page and
// generator_setup_page run this test and hand the agent the page it leaves behind. Ending on
// a logged-in Sales Console means they start where every spec does, instead of on a blank
// page with no idea which org or app they are in. Must stay read-only — it is untagged, so it
// also runs in `npm run test:readonly`.
test('seed: Sales Console is open', async ({ page }) => {
  await page.goto('/');

  // `/` restores whichever page was last open, so the URL differs run to run; the app's own
  // heading is the stable signal. Logged out, the login form renders here instead, so the
  // failure names the fix.
  await expect(
    page.getByRole('heading', { name: 'Sales Console', exact: true }),
    'Sales Console did not open — if the login page rendered, the session expired: run `npm run auth`',
  ).toBeVisible({ timeout: 60_000 });
});
