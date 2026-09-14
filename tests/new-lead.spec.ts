import { test } from '../helpers/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create a Lead filling only the mandatory fields', { tag: '@writes' }, async ({ page, records }) => {
  // Last Name carries the marker because it is what the Leads list renders in its
  // Name column, and that column is what maintenance/cleanup.spec.ts searches on.
  const name = marker('Test Lead');

  await page.goto('/');
  await gotoObject(page, 'Lead');

  // Last Name and Company are the only required inputs on this form. Lead Status is
  // also marked required but ships with a default of "Open - Not Contacted".
  await records.create('Lead', { 'Last Name': name, Company: name });
});
