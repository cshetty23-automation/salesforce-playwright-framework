import type { BrowserContext } from '@playwright/test';

// Pinned rather than discovered on every run: v67.0 was this org's newest REST version on 2026-09-14.
const API_VERSION = 'v67.0';

/**
 * A REST client riding on the browser session the tests already have — no connected app,
 * token or second login to manage.
 *
 * The API accepts only the `sid` cookie set for the org's my.salesforce.com host, and only
 * on that host. The sid cookies for lightning.force.com and file.force.com, and any request
 * sent to lightning.force.com (which is what baseURL points at), get 401 INVALID_SESSION_ID
 * even while the same session is driving the UI without trouble.
 */
export async function salesforceApi(context: BrowserContext) {
  const sid = (await context.cookies()).find((c) => c.name === 'sid' && c.domain.endsWith('.my.salesforce.com'));
  if (!sid) {
    throw new Error('No my.salesforce.com session cookie in this browser context, so the REST API cannot be called.');
  }
  const base = `https://${sid.domain.replace(/^\./, '')}/services/data/${API_VERSION}`;
  const headers = { Authorization: `Bearer ${sid.value}` };

  return {
    async deleteRecord(object: string, id: string): Promise<void> {
      const res = await context.request.delete(`${base}/sobjects/${object}/${id}`, { headers });
      // 204 is the API confirming the delete. Anything else means the record is still in the org.
      if (res.status() !== 204) {
        throw new Error(`Deleting ${object} ${id} failed: ${res.status()} ${await res.text()}`);
      }
    },
  };
}
