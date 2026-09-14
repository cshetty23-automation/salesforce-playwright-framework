import { test as base } from '@playwright/test';
import { Records } from './records';

export { expect } from '@playwright/test';

/**
 * The suite's `test`: Playwright's, plus a `records` fixture for tests that create data.
 *
 * Records made with `records.create()` are never deleted. Whether the test passes or fails
 * they stay in the org, to be inspected or deleted by hand. So none go untracked, each one
 * is listed on the test result as a "test record" annotation (HTML report) and printed in
 * the terminal, with a link to it. `npm run cleanup` deletes Account, Lead and Opportunity
 * records in bulk; Contacts have to be deleted by hand.
 */
export const test = base.extend<{ records: Records }>({
  records: async ({ page, baseURL }, use, testInfo) => {
    const records = new Records(page);
    await use(records);

    for (const { object, id, name } of records.created) {
      const description = `${object} "${name}" — ${baseURL}/lightning/r/${object}/${id}/view`;
      testInfo.annotations.push({ type: 'test record', description });
      console.log(`[test record, test ${testInfo.status}] ${description}`);
    }
  },
});
