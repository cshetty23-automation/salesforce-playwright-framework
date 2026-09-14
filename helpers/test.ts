import { test as base } from '@playwright/test';
import { salesforceApi } from './api';
import { Records } from './records';

export { expect } from '@playwright/test';

/**
 * The suite's `test`: Playwright's, plus a `records` fixture for tests that create data.
 *
 * Records made with `records.create()` are deleted through the REST API once the test
 * passes. When it fails they are kept so they can be inspected in the org, and each one is
 * listed on the test result as a "kept record" annotation with a link to it. `npm run cleanup`
 * is still the sweep for those, and for anything a run killed before teardown left behind.
 */
export const test = base.extend<{ records: Records }>({
  records: async ({ page, baseURL }, use, testInfo) => {
    const records = new Records(page);
    await use(records);
    if (!records.created.length) return;

    if (testInfo.status !== testInfo.expectedStatus) {
      for (const { object, id, name } of records.created) {
        const description = `${object} "${name}" — ${baseURL}/lightning/r/${object}/${id}/view`;
        testInfo.annotations.push({ type: 'kept record', description });
        console.log(`[kept record] ${description}`);
      }
      return;
    }

    const api = await salesforceApi(page.context());
    for (const { object, id } of records.created) {
      await api.deleteRecord(object, id);
    }
  },
});
