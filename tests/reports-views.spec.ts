import { test, expect } from '@playwright/test';

// Expected sets captured from the org on 2026-09-13. Hardcoded on purpose: this spec
// exists to notice when the Reports tab gains, loses or renames a view or a button, so
// it compares against a fixed baseline rather than against whatever the page renders.
// When a change here is intentional, update these lists in the commit that explains why.

// The sidebar is three ARIA regions, each containing a tablist of role="tab" entries —
// not links and not tree items. Scoping by region is what disambiguates "Created by Me",
// which appears under both Reports and Folders and would otherwise match two elements
// and fail strict mode.
const SIDEBAR: Array<{ region: string; tabs: string[] }> = [
  { region: 'Reports', tabs: ['Recent', 'Created by Me', 'Private Reports', 'Public Reports', 'All Reports'] },
  { region: 'Folders', tabs: ['All Folders', 'Created by Me', 'Shared with Me'] },
  { region: 'Favorites', tabs: ['All Favorites'] },
];

// Every view carries the same three header buttons. The gear is not a guess: its
// accessible name really is "Personalize your list view settings.", trailing full stop
// included. Neither New Report nor New Folder is permission-gated here — New Folder
// opens a "Create folder" dialog and New Report opens the Report Builder, unlike the
// Campaigns New button which is blocked by a missing create privilege.
const HEADER_BUTTONS = ['New Report', 'New Folder', 'Personalize your list view settings.'];

// The search box names the current view, so it is per-view rather than shared.
const VIEWS: Array<{ region: string; tab: string; scope: string; search: string }> = [
  { region: 'Reports', tab: 'Recent', scope: 'mru', search: 'Search recent reports...' },
  { region: 'Reports', tab: 'Created by Me', scope: 'created', search: 'Search reports created by me...' },
  { region: 'Reports', tab: 'Private Reports', scope: 'mine', search: 'Search private reports...' },
  { region: 'Reports', tab: 'Public Reports', scope: 'organizationOwned', search: 'Search public reports...' },
  { region: 'Reports', tab: 'All Reports', scope: 'everything', search: 'Search all reports...' },
  { region: 'Folders', tab: 'All Folders', scope: 'userFolders', search: 'Search all folders...' },
  { region: 'Folders', tab: 'Created by Me', scope: 'userFoldersCreatedByMe', search: 'Search folders created by me...' },
  { region: 'Folders', tab: 'Shared with Me', scope: 'userFoldersSharedWithMe', search: 'Search folders shared with me...' },
  { region: 'Favorites', tab: 'All Favorites', scope: 'favoriteItems', search: 'Search favorites...' },
];

test('Reports exposes the expected views, buttons and links', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');

  // Reports, via the console object navigation dropdown
  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: 'Reports', exact: true }).click();
  await expect(page).toHaveURL(/\/lightning\/o\/Report\/home/, { timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'Reports' })).toBeVisible({ timeout: 60_000 });

  // Guards the assumption every later assertion leans on: there is exactly one banner,
  // so scoping button checks to it is meaningful rather than accidentally page-wide.
  await expect(page.getByRole('banner')).toHaveCount(1);
  const banner = page.getByRole('banner');

  // --- Sidebar -----------------------------------------------------------------
  await test.step('sidebar regions and their tabs', async () => {
    for (const { region, tabs } of SIDEBAR) {
      const tablist = page.getByRole('region', { name: region }).getByRole('tablist');
      // Count catches an added view; the per-name checks catch a removed or renamed one.
      await expect(tablist.getByRole('tab')).toHaveCount(tabs.length);
      for (const name of tabs) {
        await expect(tablist.getByRole('tab', { name, exact: true })).toHaveCount(1);
      }
    }
  });

  // --- Each view ---------------------------------------------------------------
  for (const view of VIEWS) {
    await test.step(`${view.region} / ${view.tab}`, async () => {
      const tab = page.getByRole('region', { name: view.region }).getByRole('tab', { name: view.tab, exact: true });
      await tab.click();

      await expect(page).toHaveURL(new RegExp(`queryScope=${view.scope}(\\b|$)`), { timeout: 30_000 });
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
      await expect(page.getByRole('navigation', { name: 'Breadcrumbs' })).toContainText(view.tab);

      // The item count is the view telling us its own query came back. Without it the
      // reads below land on the previous view's header — which is exactly how an early
      // probe of this page reported empty views that in fact hold 30 records.
      await expect(banner.getByRole('status')).toContainText(/\d+ items?/, { timeout: 60_000 });

      await expect(banner.getByRole('textbox')).toHaveAttribute('placeholder', view.search, { timeout: 30_000 });

      await expect(banner.getByRole('button')).toHaveCount(HEADER_BUTTONS.length);
      for (const name of HEADER_BUTTONS) {
        await expect(banner.getByRole('button', { name, exact: true })).toHaveCount(1);
      }
    });
  }
});
