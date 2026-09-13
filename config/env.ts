import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Reads a required environment variable, failing loudly rather than letting an
 * `undefined` propagate into a URL and surface later as an unrelated timeout.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in — .env is gitignored, ` +
        `so a fresh clone never has one.`,
    );
  }
  return value;
}

/**
 * Base URL of the Salesforce org under test.
 *
 * Everything goes through here: it is wired into both Playwright configs as
 * `use.baseURL`, so specs navigate with root-relative paths (`page.goto('/')`,
 * `page.goto('/lightning/o/Account/list')`) and no longer hardcode the org.
 * Pointing the suite at a different org is a one-line change in .env.
 *
 * Named SF_LOGIN_URL for historical reasons — it is the org base URL, not a
 * login-specific endpoint.
 */
export const ORG_URL = required('SF_LOGIN_URL');

/** Credentials for the two-step login in save-auth.ts. Not used by specs, which run off saved storage state. */
export const SF_USERNAME = (): string => required('SF_USERNAME');
export const SF_PASSWORD = (): string => required('SF_PASSWORD');
