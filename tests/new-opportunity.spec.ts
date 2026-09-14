import { test } from '../helpers/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create an Opportunity filling only the mandatory fields', { tag: '@writes' }, async ({ page, records }) => {
  // Opportunity Name carries the marker: it is the first data column of the
  // Opportunity list views ("Opportunity Name", not "Name") and it is what the
  // list's own search box matches on, which is how maintenance/cleanup.spec.ts
  // finds these records again.
  const name = marker('Test Opportunity');

  // Close Date is required and free-text. The form states "Format: 12/31/2024",
  // so the org renders dates MM/DD/YYYY; build one rather than hardcoding a date
  // that quietly drifts into the past.
  const close = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const closeDate = [
    String(close.getMonth() + 1).padStart(2, '0'),
    String(close.getDate()).padStart(2, '0'),
    close.getFullYear(),
  ].join('/');

  await page.goto('/');
  await gotoObject(page, 'Opportunity');

  // Close Date, Opportunity Name and Stage are the only three fields the form marks
  // required (read off the rendered labels, which prefix required ones with "*").
  // Unlike Lead's Status, Stage ships with no default — it sits on "--None--" — so
  // it has to be picked explicitly or Save fails validation.
  await records.create('Opportunity', {
    'Opportunity Name': name,
    'Close Date': closeDate,
    Stage: { option: 'Prospecting' },
  });
});
