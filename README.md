# Salesforce Playwright Framework

End-to-end tests for a Salesforce org, driven through the **Sales Console** app in Lightning
Experience, written with [Playwright](https://playwright.dev) and TypeScript.

> **Some tests create real records in the org, and nothing deletes them automatically.**
> See [Test records](#test-records) before running the full suite.

## Requirements

- Node.js 20.11 or newer (developed on Node 22)
- A Salesforce org with the Sales Console app, and a user who can log in to it
- Developed on Windows; the commands below work in PowerShell, and on macOS/Linux too

## First-time setup

1. **Install dependencies**

   ```
   npm install
   ```

2. **Install the browser** Playwright drives

   ```
   npx playwright install chromium
   ```

3. **Create your `.env` file** from the template, then open it and set `SF_LOGIN_URL` to your
   org's Lightning URL, for example `https://your-org.develop.lightning.force.com`.

   ```
   # PowerShell
   Copy-Item .env.example .env
   # macOS / Linux
   cp .env.example .env
   ```

   `SF_USERNAME` and `SF_PASSWORD` are not read by anything yet — leave the placeholders.
   `.env` is gitignored; never commit it.

4. **Log in once** to save a session the tests can reuse:

   ```
   npm run auth
   ```

   A browser window opens on the login page.
   1. Enter your username and click **Log In**. The password field only appears after this.
   2. Enter your password and click **Log In**.
   3. If Salesforce emails a verification code, enter it and tick **Don't ask again**.
   4. Wait until the Salesforce home page has fully loaded.
   5. Come back to the terminal and press **Enter**. You should see `Session saved to …`.

   The session is stored in `playwright/.auth/user.json`, which is gitignored. Never commit it —
   it is a live login to your org.

5. **Check everything works** — this runs every test that creates nothing:

   ```
   npm run test:readonly
   ```

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run test:readonly` | Every test except those that create records. Safe to run any time. |
| `npm test` | Every test. **Creates one Account, Contact, Lead and Opportunity per run.** |
| `npm test -- tests/new-lead.spec.ts` | One test file. |
| `npm run records` | Lists every test record in the org, with links. Read-only. |
| `npm run cleanup` | Preview: lists the Account, Lead and Opportunity test records cleanup would delete. |
| `npm run cleanup:delete` | Deletes those test records. Add `-- -g "Lead"` to limit it to one object. |
| `npm run auth` | Log in again and save a fresh session. |
| `npm run check` | Type-check and lint the code. Needs no org. Run it before committing. |
| `npx playwright show-report` | Opens the HTML report from the last test run. |

Anything after `--` is passed straight to Playwright, e.g. `npm test -- --headed` to watch the
browser.

## When the session expires

Salesforce logs the saved session out after a couple of hours of inactivity. Every run
starts by checking the session, so when it has expired you will see one failure:

```
The saved Salesforce session is missing or has expired … Run `npm run auth`, log in, press Enter, then re-run.
```

and every test listed as "did not run". Run `npm run auth` again and re-run.

## Test records

- **Which tests create them:** `new-account`, `new-contact`, `new-lead` and `new-opportunity`,
  one record each per run. They are tagged `@writes`, which is how `npm run test:readonly`
  skips them.
- **How to recognise them:** every test record is named `PW <label> <13-digit timestamp>`,
  e.g. `PW Test Lead 1789412568387`. That pattern is what separates test data from real data.
- **They are never deleted automatically**, whether the test passes or fails. Each run
  prints every record it created, with a link, and the HTML report lists them too:

  ```
  [test record, test passed] Lead "PW Test Lead 1789412568387" — https://…/lightning/r/Lead/00Q…/view
  ```

- **To see all of them:** `npm run records`
- **To delete them:**
  - Account, Lead and Opportunity: `npm run cleanup` to preview, then `npm run cleanup:delete`.
    Only records matching the `PW …` pattern are ever touched.
  - Contact: by hand in Salesforce — cleanup does not cover Contacts. `npm run records` gives
    you the links.

  Deleted records go to the Salesforce Recycle Bin for 15 days.

## When a test fails

- The terminal shows the error and the line of the test it happened on.
- `npx playwright show-report` opens the HTML report. Every failure has a **screenshot** and a
  **trace** — a step-by-step recording you can scrub through to see exactly what the page
  looked like at each action.
- To open a trace directly: `npx playwright show-trace test-results/<test folder>/trace.zip`.
- Cleanup keeps its failure evidence separately, in `cleanup-results/`.

## Writing a new test

```ts
import { test } from '../helpers/test';
import { marker } from '../helpers/marker';
import { gotoObject } from '../helpers/nav';

test('create a Lead', { tag: '@writes' }, async ({ page, records }) => {
  const name = marker('Test Lead');

  await page.goto('/');
  await gotoObject(page, 'Lead');

  await records.create('Lead', { 'Last Name': name, Company: name });
});
```

- **Import `test` and `expect` from `helpers/test`**, not from `@playwright/test` — that is what
  provides `records`.
- **Tests that create records** must be tagged `{ tag: '@writes' }` and name the record with
  `marker('…')`. `marker()` refuses to work in an untagged test, and labels may contain only
  letters and spaces.
- **`records.create(object, fields)`** fills and saves the object's New form. A text value
  types into the field with that label; `{ option: 'Prospecting' }` picks from a dropdown.
  It checks the record saved and returns its id.
- **`gotoObject(page, object)`** opens Account, Contact, Lead, Opportunity, Campaign or Report
  from the navigation menu and waits for the page to load.
- **Navigate with paths, not full URLs** — `page.goto('/lightning/o/Account/list')`. The org
  comes from `.env`.
- **Find elements by role and exact name**, e.g.
  `page.getByRole('button', { name: 'Save', exact: true })`, and never pause with
  `waitForTimeout` — wait for something on the page instead. `npm run check` flags several of
  these mistakes.

## Project layout

```
config/
  env.ts               reads .env; where the saved session lives
  playwright.base.ts   settings shared by both Playwright configs: org, session, timeouts, traces
helpers/
  test.ts              the `test` to import, with the `records` fixture
  records.ts           records.create()
  nav.ts               gotoObject()
  marker.ts            marker() and the test-record name pattern
  api.ts               Salesforce REST API client (used by npm run records)
setup/
  session.setup.ts     the session check that runs before every test run
tests/                 the tests
maintenance/
  cleanup.spec.ts      bulk deletion of test records (npm run cleanup)
scripts/
  list-records.ts      npm run records
save-auth.ts           npm run auth
playwright.config.ts           config for the tests
playwright.cleanup.config.ts   config for cleanup, kept separate so tests can never run it
CLAUDE.md              detailed notes on how the org behaves and why the code is the way it is
```

`CLAUDE.md` is written as guidance for Claude Code, but it is the best place to look when
Salesforce does something surprising — list views, shadow DOM, the console's workspace tabs
and more are all explained there.

## CI

`.github/workflows/playwright.yml` exists but **cannot pass yet**: CI has no saved session, and
logging in needs a person. Do not rely on it until that is solved.
