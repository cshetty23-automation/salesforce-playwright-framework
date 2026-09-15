// npm run records — lists every test record this suite has left in the org, with links.
//
// Read-only. Test records are never deleted automatically, so this is how to see what has
// built up before deleting any: `npm run cleanup:delete` for Account, Lead and Opportunity,
// by hand for Contact.
import fs from 'fs';
import { AUTH_FILE, ORG_URL } from '../config/env';
import { apiFromCookies } from '../helpers/api';
import { MARKER } from '../helpers/marker';

const OBJECTS = ['Account', 'Contact', 'Lead', 'Opportunity'];

type Row = { Id: string; Name: string; CreatedDate: string };

async function main() {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error('No saved Salesforce session. Run `npm run auth` first.');
  }
  const api = apiFromCookies(JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')).cookies);

  let total = 0;
  for (const object of OBJECTS) {
    // LIKE only narrows the query. MARKER is the exact name shape cleanup deletes by, so a
    // real record that merely starts with "PW " is not listed as test data.
    const rows = (
      await api.query<Row>(`SELECT Id, Name, CreatedDate FROM ${object} WHERE Name LIKE 'PW %' ORDER BY CreatedDate`)
    ).filter((r) => MARKER.test(r.Name));

    console.log(`\n${object} (${rows.length})`);
    for (const r of rows) {
      console.log(`  ${r.Name}   created ${new Date(r.CreatedDate).toLocaleString()}`);
      console.log(`    ${ORG_URL}/lightning/r/${object}/${r.Id}/view`);
    }
    total += rows.length;
  }

  console.log(`\n${total} test record(s) in total.`);
  if (total) {
    console.log('Delete Account, Lead and Opportunity records with `npm run cleanup:delete`; Contacts by hand.');
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
