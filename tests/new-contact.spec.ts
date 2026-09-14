import { test } from '../helpers/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create a Contact filling only the mandatory field', { tag: '@writes' }, async ({ page, records }) => {
  // Last Name carries the marker: it is the only required input on the form, and it is
  // what the Contacts list views render in their Name column. Test records are never
  // deleted automatically, and Contact is deliberately not in maintenance/cleanup.spec.ts,
  // so this record stays until deleted by hand. The marker is what keeps it identifiable as
  // test data in a live org, and what would let Contact be added to that suite later.
  const name = marker('Test Contact');

  await page.goto('/');
  await gotoObject(page, 'Contact');

  // Last Name is the only field on this form that is both required and fillable. The
  // form does mark the compound "Name" group required, but that is the group's legend:
  // its other members (Salutation, First Name) are optional, so filling Last Name alone
  // satisfies it. No required picklists here, unlike Opportunity's Stage.
  await records.create('Contact', { 'Last Name': name });
});
