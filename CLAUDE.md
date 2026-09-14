# salesforce-playwright-framework

Playwright end-to-end tests against a live Salesforce Developer Edition org, driven
through the **Sales Console** app in Lightning Experience.

This is a copy of the original `salesforce-playwright` project, taken so that project
could stay frozen while this one is refactored from a test suite into a framework.

## Running things

| Command | What it does |
| --- | --- |
| `npm test` | All specs in `tests/`. **Writes real records** — see below. |
| `npm test -- tests/<file>.spec.ts` | One spec. |
| `npm run cleanup` | Cleanup **dry run** — lists what it would delete. Forces `CLEANUP=0`, so a stray `CLEANUP=1` in the shell cannot arm it. |
| `npm run cleanup:delete` | **Deletes.** `npm run cleanup:delete -- -g "Opportunity"` scopes to one object. |
| `npx cross-env CLEANUP_LIMIT=6 npm run cleanup:delete` | Deletes at most 6 per object. |
| `npm run auth` | Manual, headed re-auth. Log in by hand, press Enter. |
| `npm run check` | Typecheck (`strict`) + lint, **offline** — no org needed. Run before committing. |

Everything after `--` goes straight to `playwright test`. The scripts set env vars through
`cross-env` because npm runs scripts under `cmd.exe` on Windows, where `CLEANUP=1 cmd`
is a syntax error. Use `npx cross-env` for ad-hoc vars too. `$env:X=…` in PowerShell
stays set for the rest of the session.

## This suite writes to a live org

`tests/new-account`, `new-lead`, `new-opportunity` and `new-contact` each create a real
record on every run. Nothing is deleted automatically.

Every record is named with the marker `PW <Label> <13-digit epoch>`, defined once in
`helpers/marker.ts` (`MARKER`, `/^PW [A-Za-z ]*\d{13}$/`) and shared by the specs and
cleanup. Any new record-creating spec must name its record with `marker('Test Thing')` —
the marker is the only thing that makes test data distinguishable from real data, and
it is what cleanup searches on. `marker()` throws on labels containing anything but
letters and spaces, because those would produce names cleanup never finds.

**Contact is deliberately not in cleanup's `OBJECTS`.** Contacts created by
`new-contact.spec.ts` persist until deleted by hand.

Cleanup is opt-in (`CLEANUP=1`), caps deletions with `CLEANUP_LIMIT`, and verifies by
re-reading a fresh filtered list rather than trusting the on-screen DOM.

## Configuration

The org lives in exactly one place: `SF_LOGIN_URL` in `.env` (see `.env.example`).
`config/env.ts` reads it and both Playwright configs set it as `use.baseURL`, so **specs
navigate with root-relative paths** — `page.goto('/')`, `page.goto('/lightning/o/Account/list')`.
Never reintroduce a hardcoded org URL.

`.env` and `playwright/.auth/user.json` are gitignored and essential. A fresh clone has
neither and cannot run.

## Authentication

Specs never log in. They run off saved storage state at `playwright/.auth/user.json`,
set via `use.storageState` in both configs.

- The session dies on the org's **inactivity timeout** (a couple of hours), not on a
  fixed date. Both configs run a `session` setup project (`setup/session.setup.ts`) first:
  if `/` renders `heading "Salesforce login"` instead of Lightning, the run stops with one
  failure telling you to run `npm run auth`, and every spec shows as "did not run". A
  missing `user.json` produces the same message (`savedSession()` in `config/env.ts`
  starts contexts logged out rather than failing on the missing file).
- Logged out, the org serves the login form at the **same root URL** — no redirect — so
  the URL cannot distinguish logged-in from logged-out. Check what rendered.
- Login is **two-step**: `#username` → `#Login` → `#password` appears → `#Login`. The
  password field does not exist in the DOM until the username is submitted.
- The org then demands an **emailed verification code** (`#emc`) unless the saved state
  carries a device-trust cookie. It currently does — "Don't ask again" was ticked — so
  re-auth with username + password alone works. If that cookie is ever lost, a human
  has to supply the code.
- The two projects hold **independent copies** of `user.json`. Refreshing one does not
  refresh the other.

## Salesforce/Lightning gotchas learned the hard way

**The console runs in a cross-origin iframe.** `browser_evaluate` against the top
document returns nothing. Scope evaluates to an element ref inside the frame.

**Lightning fields live in shadow DOM.** Form labels, list-view options and toolbar
buttons are not reachable by plain CSS from the page. Playwright's `getByRole` pierces
shadow DOM; `allTextContents()` on such elements comes back empty, so match on
accessible name instead.

**Two level-1 headings per object page.** `heading "Accounts"` and
`heading "Accounts All Accounts"` both exist. `exact: true` is load-bearing.

**List views are virtualised.** Scraping an unfiltered list only sees rows near the
viewport, so it can report a clean org that is not clean. Always filter first.

**The console restores workspace tabs from the saved session**, and their labels leak
into whole-page text scrapes — a record open in a tab gets attributed to whatever object
you are reading. Scope reads to the grid, never `body`.

**Accessible names are state-dependent.** On an empty list view, `Printable View`
disappears, `Charts`/`Filters` go disabled, and `Column sort` is renamed to
`"Column sort is disabled. To sort columns, a list view needs at least one row and two
columns."` Pin assertions to a populated view.

**Header buttons can render late.** `Printable View` appears a beat after the rest of
the header. Use retrying assertions, never a snapshot-and-compare.

**Item counts are stale immediately after switching views.** Waiting for
`/\d+ items?/` matches the *previous* view's number. Wait for the specific view's
signal — an early probe reported empty views that in fact held 30 records.

**Default list views differ per object.** Opportunity and Campaign pin `Recently
Viewed`; Contact opens the **Intelligence View** at `/lightning/o/Contact/pipelineInspection`,
a different route entirely. Reports uses `/lightning/o/Report/home?queryScope=…` with a
sidebar of `role="tab"` entries, not a list-view picker.

**Some buttons are permission-gated, not absent.** Campaigns has no `New` button because
this user lacks Create on Campaign (the Marketing User flag) — confirmed by hitting
`/lightning/o/Campaign/new` and getting "you don't have the necessary privileges". On
Reports, `New Report` and `New Folder` are genuinely available.

## Testing conventions

- Reach objects with `gotoObject(page, 'Lead')` from `helpers/nav.ts`. A new object
  gets an entry in its table (menu label + readiness signal), not an inlined nav block.
- Probe the real DOM before writing a selector. Do not guess accessible names.
- `getByRole` with `exact: true`. No CSS selectors into Lightning internals.
- **No `waitForTimeout`.** Wait for a real signal — a response, a count, an attribute.
- For presence/absence suites, assert **both** a count and each name: the count catches
  additions, the names catch removals and renames. Prove the assertion can fail by
  breaking an expected value before trusting a green run.
- Comment *why*, not what. The non-obvious Lightning behaviour is the valuable part.
- Delete probe files when done.

## Environment

- Windows. `python` is **not** on PATH. TypeScript and ESLint are local dev dependencies;
  `eslint.config.mjs` enforces the testing conventions above (no `waitForTimeout`, no
  `force`, no un-awaited promises) as errors, and warnings also fail `npm run lint`.
- Heredocs and `perl -pi` mangle backslashes in regexes — `\d` silently became `d` twice.
  Prefer the editing tools over shell string surgery on files containing regexes.
- The MCP Playwright server is configured in `.mcp.json` and is project-scoped: a new
  folder is a fresh trust scope and needs approving via `/mcp`.

## Planned work

Done: config extraction; npm scripts (the table above); the helpers module —
`helpers/nav.ts` (`gotoObject`) and `helpers/marker.ts` (`marker`, `MARKER`, `markersIn`).
Remaining:

1. **Decide on CI** — `.github/workflows/playwright.yml` currently **cannot work**:
   `playwright/.auth/` is gitignored so CI has no session, and re-auth needs an emailed
   code. Either wire up JWT bearer auth via a connected app, or inject a `storageState`
   secret, or delete the workflow. A pipeline that cannot pass is worse than none.

Page objects are deliberately *not* planned yet — at 8 specs a fixtures module buys more
than a class hierarchy.
