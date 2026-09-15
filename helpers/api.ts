import type { BrowserContext } from '@playwright/test';

// Pinned rather than discovered on every run: v67.0 was this org's newest REST version on 2026-09-14.
const API_VERSION = 'v67.0';

type Cookie = { name: string; domain: string; value: string };

/**
 * A REST client riding on the browser session the suite already has — no connected app,
 * token or second login to manage.
 *
 * The API accepts only the `sid` cookie set for the org's my.salesforce.com host, and only
 * on that host. The sid cookies for lightning.force.com and file.force.com, and any request
 * sent to lightning.force.com (which is what baseURL points at), get 401 INVALID_SESSION_ID
 * even while the same session is driving the UI without trouble.
 *
 * Takes cookies rather than a browser, so standalone scripts can build one from the saved
 * session file (see scripts/list-records.ts) and tests from their context (salesforceApi).
 */
export function apiFromCookies(cookies: Cookie[]) {
  const sid = cookies.find((c) => c.name === 'sid' && c.domain.endsWith('.my.salesforce.com'));
  if (!sid) {
    throw new Error('No my.salesforce.com session cookie, so the REST API cannot be called. Run `npm run auth`.');
  }
  const base = `https://${sid.domain.replace(/^\./, '')}/services/data/${API_VERSION}`;
  const headers = { Authorization: `Bearer ${sid.value}` };

  async function call(method: 'GET' | 'DELETE', path: string): Promise<Response> {
    const res = await fetch(`${base}${path}`, { method, headers });
    if (res.status === 401) {
      throw new Error('The saved Salesforce session has expired (401 from the REST API). Run `npm run auth`.');
    }
    return res;
  }

  return {
    /** Runs a SOQL query and returns the first page of results — up to 2,000 rows, far more than this suite creates. */
    async query<T>(soql: string): Promise<T[]> {
      const res = await call('GET', `/query?q=${encodeURIComponent(soql)}`);
      if (!res.ok) throw new Error(`Query failed: ${res.status} ${await res.text()}`);
      return ((await res.json()) as { records: T[] }).records;
    },

    /**
     * Deletes one record. Nothing calls this at present: test records are deliberately kept
     * (see helpers/test.ts). It stays as the verified way to delete through the API.
     */
    async deleteRecord(object: string, id: string): Promise<void> {
      const res = await call('DELETE', `/sobjects/${object}/${id}`);
      // 204 is the API confirming the delete. Anything else means the record is still in the org.
      if (res.status !== 204) {
        throw new Error(`Deleting ${object} ${id} failed: ${res.status} ${await res.text()}`);
      }
    },
  };
}

/** The same client, from a test's browser context. */
export async function salesforceApi(context: BrowserContext) {
  return apiFromCookies(await context.cookies());
}
