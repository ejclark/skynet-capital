// Contract validation for the market-event calendar — split out of event-scan.mjs because it is a
// distinct concern (enforcing the shape of the tables + ledgers) from extraction and cadence math.
// See event-scan.mjs for the machine contract this enforces (docs/process/EVENT-RESEARCH.md).

export const KINDS = [
  "earnings",
  "macro-print",
  "product-launch",
  "sector",
  "rates",
  "opex",
  "geopolitical",
];
export const TIERS = ["critical", "high", "medium", "low"];
export const CONFIRMED_PREFIX = /^(IR|CAL|BLS|FED|PJM|SEC|TSY|OCC|BEA|CENSUS|ISM|CB|UMICH):/;
export const ESTIMATE_PREFIX = /^(EST|NEWS):/;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The calendar's canonical order — (date, id). Every reader computes it (event-scan.mjs's report,
 *  market-events.ts's allEvents, the loader in market-events-data.ts). Storage order stopped
 *  mattering with issue #1449: the calendar is one JSON file per event, so there is no shared
 *  array for two lanes to insert into — the whole append-collision class (#1324/#1341) is gone
 *  rather than merged around.
 *
 *  Tolerant of a missing date/id because it runs on data this module has not validated yet. */
export const compareEventOrder = (a, b) =>
  (a.date ?? "").localeCompare(b.date ?? "") || (a.id ?? "").localeCompare(b.id ?? "");

function validateTierBands(tier, bands, problems) {
  if (!Array.isArray(bands) || bands.length === 0) {
    problems.push(`cadence: missing bands for tier "${tier}"`);
    return;
  }
  if (bands.at(-1).minDaysOut !== 0)
    problems.push(`cadence: "${tier}" terminal band must have minDaysOut 0`);
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    if (!(Number.isInteger(b.minDaysOut) && b.minDaysOut >= 0 && b.intervalDays >= 1))
      problems.push(`cadence: "${tier}" band ${i} malformed (${JSON.stringify(b)})`);
    if (i > 0 && bands[i - 1].minDaysOut <= b.minDaysOut)
      problems.push(`cadence: "${tier}" bands must be sorted by minDaysOut descending`);
  }
}

function validateCadence(cadence, problems) {
  for (const tier of TIERS) validateTierBands(tier, cadence.bands?.[tier], problems);
  if (!(Number.isInteger(cadence.closeOutWithinDays) && cadence.closeOutWithinDays >= 1))
    problems.push("cadence: closeOutWithinDays must be an integer >= 1");
}

// The date policy made lintable: confirmed needs a trusted prefix, estimates an honest one.
function validateStatus(e, where, problems) {
  if (e.status === "confirmed") {
    if (!CONFIRMED_PREFIX.test(e.source ?? ""))
      problems.push(
        `${where}: confirmed but source lacks a trusted prefix (IR/CAL/BLS/FED/PJM/SEC)`,
      );
  } else if (e.status === "estimate") {
    if (e.kind !== "earnings" && !ESTIMATE_PREFIX.test(e.source ?? ""))
      problems.push(`${where}: estimate but source lacks an EST:/NEWS: prefix`);
  } else {
    problems.push(`${where}: unknown status "${e.status}"`);
  }
}

function validateEvent(e, ids, problems) {
  const where = `event "${e.id ?? "?"}"`;
  if (!SLUG_RE.test(e.id ?? "")) problems.push(`${where}: id must be a lowercase slug`);
  if (ids.has(e.id)) problems.push(`${where}: duplicate id`);
  ids.add(e.id);
  if (!KINDS.includes(e.kind)) problems.push(`${where}: unknown kind "${e.kind}"`);
  if (!DATE_RE.test(e.date ?? "")) problems.push(`${where}: date must be YYYY-MM-DD`);
  if (!TIERS.includes(e.impact)) problems.push(`${where}: unknown impact "${e.impact}"`);
  if (!Array.isArray(e.symbols)) problems.push(`${where}: symbols must be an array`);
  validateStatus(e, where, problems);
}

/** One file per event (issue #1449): the file's name IS the id. That is what makes the calendar
 *  conflict-free — a lane can only write the file its own event id names, a proposed adjacent
 *  event is a brand-new file, and a duplicate id is a duplicate file name git itself refuses. A
 *  file whose name disagrees with its id is the one shape the loader cannot reject by type. */
function validateFileNames(files, problems) {
  for (const { file, id } of files ?? []) {
    const expected = `${id}.json`;
    if (file !== expected)
      problems.push(
        `src/domain/market-events/${file}: file name must equal its id — rename it to "${expected}"`,
      );
  }
}

function validateLedgers(ledgers, ids, problems, warnings) {
  for (const [id, ledger] of ledgers) {
    if (!(ledger.lastAssessed && DATE_RE.test(ledger.lastAssessed)))
      problems.push(`${ledger.file}: missing or malformed "**Last assessed:** YYYY-MM-DD" line`);
    if (!ids.has(id))
      warnings.push(`${ledger.file}: no matching event id "${id}" (aged out of the tables?)`);
  }
}

function validate({ curated, all, files }, cadence, ledgers) {
  const problems = [];
  const warnings = [];
  const ids = new Set();
  validateCadence(cadence, problems);
  for (const e of all) validateEvent(e, ids, problems);
  validateFileNames(files, problems);
  for (const e of curated)
    if (e.kind === "earnings")
      problems.push(
        `event "${e.id}": earnings are derived from earnings-calendar.ts — never hand-entered here`,
      );
  validateLedgers(ledgers, ids, problems, warnings);
  return { problems, warnings };
}

export function runValidate(tables, cadence, ledgers) {
  const { problems, warnings } = validate(tables, cadence, ledgers);
  for (const w of warnings) console.error(`⚠ ${w}`);
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(
      `\n${problems.length} contract violation(s). A malformed calendar is worse than none —` +
        " the Routine would assess the wrong thing and look green doing so.",
    );
    process.exit(1);
  }
  console.log(
    `✓ ${tables.all.length} event(s) and ${ledgers.size} ledger(s) satisfy the contract.`,
  );
}
