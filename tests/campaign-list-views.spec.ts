import { test, expect } from '@playwright/test';
import { gotoObject } from '../helpers/nav';

// Expected sets captured from the org on 2026-09-13. They are hardcoded on purpose:
// this spec exists to notice when the Campaigns page gains, loses or renames a list
// view or a button, so it has to compare against a fixed baseline rather than against
// whatever the page happens to render. When a change here is intentional, update these
// lists in the same commit that explains why.

// All three live under the picker's "Recent List Views" group today; its "All Other
// Lists" group is genuinely empty (0 options, and the listbox does not scroll), so this
// is the complete set and not just the visible part of a longer one.
const LIST_VIEWS = ['All Active Campaigns', 'My Active Campaigns', 'Recently Viewed'];

// Which view is pinned is asserted separately from the set of view names. The picker
// appends "(Pinned list)" to whichever one it is, so folding it into the names above
// would make an unrelated act — someone pinning a different view — fail an assertion
// that is supposed to be about which views exist.
const PINNED_VIEW = 'Recently Viewed';

// Every button in the page header on the All Active Campaigns view: the view picker and
// pin control, the three record actions, and the list toolbar.
//
// Notably absent: New. That is a permission gate rather than a missing button — going
// straight to /lightning/o/Campaign/new answers with "Oops...you don't have the
// necessary privileges to create this record", i.e. this user lacks Create on Campaign
// (the Marketing User flag). If New ever appears here, that permission changed.
const HEADER_BUTTONS = [
  'Select a List View: Campaigns',
  'Pin this list view.',
  'Printable View',
  'Assign Label',
  'Analyze with Grid',
  'List View Controls',
  'Select list display',
  'Refresh',
  'Column sort',
  'Charts',
  'Filters',
];

test('Campaigns exposes the expected list views and header buttons', async ({ page }) => {
  await page.goto('/');
  await gotoObject(page, 'Campaign');

  // --- List views -------------------------------------------------------------
  await page.getByRole('button', { name: /select a list view/i }).click();
  const options = page.getByRole('option');
  await expect(options).toHaveCount(LIST_VIEWS.length);

  // Matched by accessible name rather than text content: the option labels live in shadow
  // DOM and allTextContents() comes back empty. Each name is checked independently of
  // order, because the picker sorts by recency and that changes as views are opened.
  // The optional suffix keeps this assertion about which views exist; which one is
  // pinned is asserted separately below.
  for (const view of LIST_VIEWS) {
    const escaped = view.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(
      page.getByRole('option', { name: new RegExp(`^${escaped}( \\(Pinned list\\))?$`) }),
    ).toHaveCount(1);
  }

  await expect(page.getByRole('option', { name: `${PINNED_VIEW} (Pinned list)`, exact: true })).toHaveCount(1);

  // --- Header buttons ---------------------------------------------------------
  // Pinned to All Active Campaigns rather than the landing view, because these names are
  // state-dependent: on the empty Recently Viewed list, Printable View is absent, Charts
  // and Filters are disabled, and "Column sort" is instead named "Column sort is
  // disabled. To sort columns, a list view needs at least one row and two columns."
  await page.getByRole('option', { name: 'All Active Campaigns', exact: true }).click();
  await expect(page).toHaveURL(/filterName=AllActiveCampaigns/);
  await expect(page.getByRole('status', { name: 'All Active Campaigns' })).toContainText(/\d+ items?/);

  const header = page.locator('.slds-page-header').first();

  // The count is what makes this fail on an *added* button; the per-name checks are what
  // make it fail on a removed or renamed one. Printable View renders a beat after the
  // rest of the header, which the retry on toHaveCount absorbs.
  await expect(header.getByRole('button')).toHaveCount(HEADER_BUTTONS.length);
  for (const name of HEADER_BUTTONS) {
    await expect(header.getByRole('button', { name, exact: true })).toHaveCount(1);
  }

  // Stated explicitly because its absence is the interesting fact, not an oversight.
  await expect(header.getByRole('button', { name: 'New', exact: true })).toHaveCount(0);
});
