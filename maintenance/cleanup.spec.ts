import { test, expect, type Page } from '@playwright/test';
import { MARKER, markersIn } from '../helpers/marker';

// Only names that are exactly a suite marker (helpers/marker.ts) are eligible for
// deletion — a real record would have to be deliberately named to look like one to be at risk.

// Destructive, so it is opt-in: `npm run cleanup:delete` sets CLEANUP=1, and
// `npm run cleanup` pins CLEANUP=0 so the dry run stays dry whatever the shell has set.
const ARMED = process.env.CLEANUP === '1';
// Optional cap, applied per object: npx cross-env CLEANUP_LIMIT=6 npm run cleanup:delete
const LIMIT = Number(process.env.CLEANUP_LIMIT) || Infinity;

// Each object needs a list view that shows every record this suite can create, and
// whose name column carries the marker. Lead has no "All Leads" view; "All Open Leads"
// covers ours because new leads default to "Open - Not Contacted" and nothing here
// converts or closes them — a converted lead would not be found.
const OBJECTS = [
  { name: 'Account', listUrl: '/lightning/o/Account/list', listView: 'All Accounts' },
  { name: 'Lead', listUrl: '/lightning/o/Lead/list', listView: 'All Open Leads' },
  // Opportunity pins "Recently Viewed" as its default list view, so a bare /list lands
  // there rather than on All Opportunities. Pinning the filter in the URL keeps every
  // load of this object on the view that actually contains the records.
  { name: 'Opportunity', listUrl: '/lightning/o/Opportunity/list?filterName=AllOpportunities', listView: 'All Opportunities' },
];

// Opens the object's list view with the automation-name filter applied.
//
// Both the initial read and the post-delete verification go through this, and the
// filter is load-bearing: these lists are virtualised, so an unfiltered list only
// renders the rows near the viewport. Scraping one can miss records that exist and
// report a clean org that is not clean — the one direction of error a cleanup check
// must never make.
async function openFilteredList(page: Page, obj: { listUrl: string; listView: string }) {
  await page.goto(obj.listUrl);
  await page.getByRole('button', { name: /select a list view/i }).click();
  await page.getByRole('option', { name: obj.listView, exact: true }).click();
  await page.getByPlaceholder(/search this list/i).fill('PW ');

  // Enter fires the filtered query. Waiting on the request it triggers is what separates
  // "the search has run" from "the pre-search list is still on screen": for a moment the
  // header still reports the old count, which satisfies the assertion below either way.
  const queried = page.waitForResponse(
    (r) => r.url().includes('/aura') && r.request().method() === 'POST',
    { timeout: 60_000 },
  );
  await page.keyboard.press('Enter');
  await queried;

  // Then hold until the rendered rows agree with the count the list reports, so the
  // scrape cannot read a half-rendered grid.
  const status = page.getByRole('status', { name: obj.listView });
  await expect(status).toContainText(/\d+ items?/, { timeout: 30_000 });
  await expect
    .poll(async () => {
      const n = Number(((await status.innerText()).match(/(\d+) items?/) ?? [])[1] ?? -1);
      const grids = page.getByRole('grid');
      const rows = (await grids.count()) ? await grids.first().getByRole('row').count() : 0;
      // +1 for the column-header row that lives inside the grid.
      return n === 0 ? rows === 0 : rows === n + 1;
    }, { timeout: 60_000 })
    .toBe(true);
}

// Scoped to the grid rather than the whole body: the console restores workspace tabs
// from the saved session, so a record left open in a tab leaks its name into body text
// on every object and gets attributed to whichever list is being cleaned.
async function findAutomationRecords(page: Page): Promise<string[]> {
  const grids = page.getByRole('grid');
  if (!(await grids.count())) return [];
  const text = (await grids.first().innerText()).replace(/\s+/g, ' ');
  const candidates = new Set(markersIn(text));
  return [...candidates].filter((name) => MARKER.test(name)).sort();
}

for (const obj of OBJECTS) {
  test(`delete ${obj.name} records created by this test suite`, async ({ page }) => {
    test.setTimeout(300_000);

    await openFilteredList(page, obj);

    const found = await findAutomationRecords(page);
    console.log(`[${obj.name}] found ${found.length} automation record(s):`);
    found.forEach((n) => console.log(`  - ${n}`));

    if (!ARMED) {
      console.log(`[${obj.name}] DRY RUN — nothing deleted. Re-run with \`npm run cleanup:delete\` to delete these.`);
      return;
    }

    const targets = found.slice(0, LIMIT);
    if (targets.length < found.length) {
      console.log(`[${obj.name}] CLEANUP_LIMIT=${LIMIT} — deleting ${targets.length}, keeping ${found.length - targets.length}.`);
    }

    for (const name of targets) {
      const row = page.getByRole('grid').first().getByRole('row').filter({ hasText: name });
      await row.getByRole('button', { name: /show actions/i }).click();
      await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

      // Paces the loop so the next row menu isn't clicked mid-render. Note this is NOT
      // proof of deletion — the row also vanishes transiently while the list re-renders.
      // The poll below is the authoritative check.
      await expect(row).toHaveCount(0, { timeout: 30_000 });
      console.log(`  deleted: ${name}`);
    }

    // The list DOM lags the server after a burst of deletes, so re-read it from a fresh
    // filtered load and poll until it settles rather than trusting what is on screen now.
    const expected = found.filter((n) => !targets.includes(n)).sort();
    await expect
      .poll(async () => {
        await openFilteredList(page, obj);
        return findAutomationRecords(page);
      }, { timeout: 120_000, intervals: [2000, 5000, 5000] })
      .toEqual(expected);
    if (expected.length) console.log(`[${obj.name}] kept: ${expected.join(', ')}`);
  });
}
