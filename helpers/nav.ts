import { expect, type Locator, type Page } from '@playwright/test';

export type SalesforceObject = 'Account' | 'Contact' | 'Lead' | 'Opportunity' | 'Campaign' | 'Report';

// exact:true is load-bearing — each object page has a second level-1 heading, the list-view
// picker, whose accessible name is "<Object> <current view>", e.g. "Contacts My Contacts".
const heading = (name: string) => (page: Page) => page.getByRole('heading', { name, exact: true });

// Keyed by API name, which is also the URL segment. `ready` is the signal that the object's
// own page has rendered.
const OBJECTS: Record<SalesforceObject, { menuItem: string; ready: (page: Page) => Locator }> = {
  Account: { menuItem: 'Accounts', ready: heading('Accounts') },
  Contact: { menuItem: 'Contacts', ready: heading('Contacts') },
  Lead: { menuItem: 'Leads', ready: heading('Leads') },
  Opportunity: { menuItem: 'Opportunities', ready: heading('Opportunities') },
  Campaign: { menuItem: 'Campaigns', ready: heading('Campaigns') },
  // Reports has no list-view picker; its page is a sidebar of ARIA regions instead.
  Report: { menuItem: 'Reports', ready: (page) => page.getByRole('region', { name: 'Reports' }) },
};

/**
 * Opens an object through the Sales Console's navigation menu and waits until its page has
 * actually rendered. Works from whatever console page is showing, so call `page.goto('/')`
 * first if nothing is.
 */
export async function gotoObject(page: Page, object: SalesforceObject): Promise<void> {
  const { menuItem, ready } = OBJECTS[object];

  await page.getByRole('button', { name: /show navigation menu/i }).click();
  await page.getByRole('menuitem', { name: menuItem, exact: true }).click();

  // Matches the object, not a list path: Contact opens its Intelligence View at
  // /lightning/o/Contact/pipelineInspection and Reports opens /lightning/o/Report/home.
  await expect(page).toHaveURL(new RegExp(`/lightning/o/${object}/`), { timeout: 30_000 });

  // The URL flips before the page renders, and every object page has a New button with the
  // same accessible name. Without this wait, New can be clicked while the console still
  // shows the previous object, opening that object's form.
  await expect(ready(page)).toBeVisible({ timeout: 60_000 });
}
