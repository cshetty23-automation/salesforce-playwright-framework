import { test } from '../helpers/test';
import { marker } from '../helpers/marker';

test('create an Account filling only the mandatory field', { tag: '@writes' }, async ({ page, records }) => {
  // Unique per run so repeat runs don't collide and the records stay traceable
  const name = marker('Test Account');

  await page.goto('/lightning/o/Account/list');

  // Account Name is the only field marked required on this form
  await records.create('Account', { 'Account Name': name });
});
