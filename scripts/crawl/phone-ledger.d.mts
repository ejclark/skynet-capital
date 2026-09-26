// Type surface for phone-ledger.mjs's fold — same arrangement as ledger.d.mts (`allowJs` is off).

/** A crawl step's phone finding, located and tagged with where it was seen. */
export interface PhoneRow {
  page: string;
  member: string;
  journey: string;
  step: string;
  kind: string;
  what: string;
  where: string;
  severity: string;
  fix: string;
}

/** One row per page · finding; `hits` maps each member to the journey·step ids that saw it. */
export function foldPhoneRows(rows: PhoneRow[]): (PhoneRow & { hits: Map<string, string[]> })[];
