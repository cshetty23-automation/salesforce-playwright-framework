import { expect, type Page } from '@playwright/test';

export type CreatableObject = 'Account' | 'Contact' | 'Lead' | 'Opportunity';

/** A string is typed into the textbox with that label; `{ option }` is picked from the combobox with that label. */
export type FieldValue = string | { option: string };

export type CreatedRecord = { object: CreatableObject; id: string; name: string };

// The field whose value becomes the record's name — and so the heading on its detail page.
// With only Last Name filled, a Contact's or Lead's name is just that value.
const NAME_FIELD: Record<CreatableObject, string> = {
  Account: 'Account Name',
  Contact: 'Last Name',
  Lead: 'Last Name',
  Opportunity: 'Opportunity Name',
};

/** Creates records through the UI and remembers them. Handed to tests by the `records` fixture in helpers/test.ts. */
export class Records {
  readonly created: CreatedRecord[] = [];

  constructor(private readonly page: Page) {}

  /**
   * Fills and saves the object's New form, starting from the object's page, and returns the
   * new record's id. Fields are filled in the order given.
   *
   * The record is registered as soon as its id is known, before the final heading check, so
   * a failure after the save still reports which record it left behind.
   */
  async create(object: CreatableObject, fields: Record<string, FieldValue>): Promise<string> {
    const { page } = this;
    const name = fields[NAME_FIELD[object]];
    if (typeof name !== 'string') {
      throw new Error(`create('${object}') needs a text value for '${NAME_FIELD[object]}', the field that names the record.`);
    }

    await page.getByRole('button', { name: 'New', exact: true }).click();
    // Record forms are the slowest thing this org renders, hence more than the 30s default.
    await expect(page.getByRole('heading', { name: `New ${object}`, exact: true })).toBeVisible({ timeout: 60_000 });

    for (const [label, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        await page.getByRole('textbox', { name: label, exact: true }).fill(value);
      } else {
        await page.getByRole('combobox', { name: label, exact: true }).click();
        await page.getByRole('option', { name: value.option, exact: true }).click();
      }
    }

    // exact:true so this does not match "Save & New"
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Saving lands on the new record's detail page, and its URL carries the id.
    const detail = new RegExp(`/lightning/r/${object}/(\\w+)/view`);
    await expect(page).toHaveURL(detail);
    const id = page.url().match(detail)![1];
    this.created.push({ object, id, name });

    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    return id;
  }
}
