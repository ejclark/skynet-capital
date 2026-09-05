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

/** The calendar's canonical order — (date, id). Every reader already computed it (event-scan.mjs's
 *  report, market-events.ts's allEvents); since #1341 the FILE is stored in it too, and that is a
 *  merge fix, not a tidiness one. Research lanes used to append every new event to the end of the
 *  array, so two concurrent lanes always inserted at the same anchor line — the one case plain
 *  git cannot merge (22 of 47 PRs touching the file flagged conflicted, median 13.4 h to merge
 *  against 1 min unflagged, #1324). The custom merge driver #1324 wired fixes that locally, but
 *  GitHub's server-side mergeable computation never runs a custom driver, so PRs kept reading
 *  `dirty` in the UI. File order is the only lever that works server-side: entries for different
 *  dates now land at different anchors and plain git merges them with no driver at all. Same-date
 *  pairs still collide and still fall back to the driver — the two slices compose by design.
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

/** Storage order is part of the contract (see compareEventOrder). Curated events only — the
 *  derived earnings rows are generated from earnings-calendar.ts and never hand-placed. Reports
 *  every inversion, not just the first: a lane that pasted two entries wants both named at once. */
function validateOrder(curated, problems) {
  for (let i = 1; i < curated.length; i++) {
    const prev = curated[i - 1];
    const e = curated[i];
    if (compareEventOrder(prev, e) > 0)
      problems.push(
        `event "${e.id}" (${e.date}): out of (date, id) order — it belongs before "${prev.id}" ` +
          `(${prev.date}). Run \`node scripts/sort-market-events.mjs\` to re-sort the whole file.`,
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

function validate({ curated, all }, cadence, ledgers) {
  const problems = [];
  const warnings = [];
  const ids = new Set();
  validateCadence(cadence, problems);
  for (const e of all) validateEvent(e, ids, problems);
  validateOrder(curated, problems);
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
