// Every record this suite creates is named `PW <label> <13-digit epoch>`. That shape is the
// only thing distinguishing test data from real data in a live org, and it is what
// maintenance/cleanup.spec.ts searches on — so it is defined here, once, for both sides.
const BODY = String.raw`PW [A-Za-z ]*\d{13}`;

/** Matches a name that is exactly a suite marker. Only these are eligible for deletion. */
export const MARKER = new RegExp(`^${BODY}$`);

/** Every marker-shaped substring of `text`. Builds a fresh global regex per call, so there is no shared `lastIndex`. */
export function markersIn(text: string): string[] {
  return text.match(new RegExp(BODY, 'g')) ?? [];
}

/**
 * A unique record name for this run: `marker('Test Lead')` → `PW Test Lead 1789304415826`.
 *
 * Throws rather than returning a name MARKER would not match — a label with a digit or a
 * hyphen would otherwise create records that cleanup silently never finds.
 */
export function marker(label: string): string {
  const name = `PW ${label} ${Date.now()}`;
  if (!MARKER.test(name)) {
    throw new Error(`marker(${JSON.stringify(label)}): labels must be letters and spaces only, or cleanup cannot find the record.`);
  }
  return name;
}
