// Contract validation for the market-event calendar — split out of event-scan.mjs because it is a
// distinct concern (enforcing the shape of the tables + ledgers) from extraction and cadence math.
// See event-scan.mjs for the machine contract this enforces (docs/process/EVENT-RESEARCH.md).

import { titleOverlapWarnings } from "./event-title-overlap.mjs";
import { unscoredForwardTests } from "./forward-test-pending.mjs";

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
/** The trusted-source prefixes, spelled once. The error message below is built from this list so it
 *  cannot go stale the way the hand-written `(IR/CAL/BLS/FED/PJM/SEC)` string did — it had not been
 *  updated since `TSY:` landed, eight prefixes ago (#3117). The taxonomy that explains what each one
 *  MEANS lives in src/domain/market-events-data.ts; tests/domain/market-events.spec.ts mirrors the
 *  pattern deliberately, so a one-sided edit here fails CI. */
export const CONFIRMED_PREFIXES = [
  "IR",
  "CAL",
  "BLS",
  "FED",
  "PJM",
  "SEC",
  "TSY",
  "OCC",
  "BEA",
  "CENSUS",
  "ISM",
  "CB",
  "UMICH",
  "FHFA",
  "FRB",
  "NYSE",
  "SIFMA",
  "JPX",
];
export const CONFIRMED_PREFIX = new RegExp(`^(${CONFIRMED_PREFIXES.join("|")}):`);
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
  problems.push(...horizonProblems(cadence.horizon));
}

/** The research horizon (#2946), as a list of problems so BOTH callers share one definition:
 *  `--validate` reports them, and event-scan's loadCadence throws on any of them in every mode.
 *  Validated rather than defaulted on purpose — an absent or nonsensical horizon must never read
 *  as "no horizon", which is the uncapped behaviour that spent a weekly token quota in ~24 hours.
 *  Same fail-closed doctrine as the dispatch ceiling's budget file. */
export function horizonProblems(horizon) {
  if (!horizon || typeof horizon !== "object")
    return ["cadence: horizon { maxDaysOut, allImpactsWithinDays } is required (#2946)"];

  const { maxDaysOut, allImpactsWithinDays } = horizon;
  const problems = [];
  if (!(Number.isInteger(maxDaysOut) && maxDaysOut >= 1))
    problems.push("cadence: horizon.maxDaysOut must be an integer >= 1");
  if (!(Number.isInteger(allImpactsWithinDays) && allImpactsWithinDays >= 0))
    problems.push("cadence: horizon.allImpactsWithinDays must be an integer >= 0");
  if (problems.length === 0 && allImpactsWithinDays > maxDaysOut)
    problems.push(
      "cadence: horizon.allImpactsWithinDays must be <= maxDaysOut — the inner band cannot " +
        "reach past the outer edge",
    );
  return problems;
}

// The date policy made lintable: confirmed needs a trusted prefix, estimates an honest one.
function validateStatus(e, where, problems) {
  if (e.status === "confirmed") {
    if (!CONFIRMED_PREFIX.test(e.source ?? ""))
      problems.push(
        `${where}: confirmed but source lacks a trusted prefix (${CONFIRMED_PREFIXES.join("/")})`,
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

export const PROPOSAL_FILE_RE =
  /^proposals\/([a-z0-9][a-z0-9-]*)\.from-([a-z0-9][a-z0-9-]*)\.json$/;

/** One file per event (issue #1449): the file's name IS the id. That is what makes the calendar
 *  conflict-free — a lane can only write the file its own event id names, and a duplicate id is a
 *  duplicate file name git itself refuses. Proposals (issue #1717) extend the rule one level: an
 *  adjacent event a sweep discovers is `proposals/<id>.from-<proposer>.json`, owned by the
 *  proposer, always `estimate`, its proposer an event that exists — so two sweeps finding the same
 *  event never create the same path. Shadowed and competing proposals are reported as warnings:
 *  the event's own initial research reads them all before writing the canonical file. */
const where = (file) => `src/domain/market-events/${file}`;

/** One proposal file's naming/shape rules; returns the proposed id, or null when misnamed. */
function validateProposal(file, event, knownIds, problems) {
  const m = file.match(PROPOSAL_FILE_RE);
  if (!m) {
    problems.push(`${where(file)}: a proposal is named <id>.from-<proposer-event-id>.json`);
    return null;
  }
  const [, id, proposer] = m;
  if (event?.id !== id) problems.push(`${where(file)}: id "${event?.id}" must equal "${id}"`);
  if (event?.status !== "estimate")
    problems.push(
      `${where(file)}: a proposal is always status "estimate" — its own research confirms it in <id>.json`,
    );
  if (!knownIds.has(proposer))
    problems.push(`${where(file)}: proposer "${proposer}" is not an event this calendar knows`);
  return id;
}

/** THE PROPOSAL DEPTH CAP (#2946) — discovery gets exactly ONE generation.
 *
 *  A research session's adjacency sweep writes what it finds as `proposals/<id>.from-<proposer>`,
 *  and a proposal loads as a real event, so it becomes `never-assessed`, buys its own session, and
 *  sweeps again. That is the loop that took the calendar to 641 canonical + 469 pending in two
 *  days and spent a weekly token quota in ~24 hours. Requiring the proposer to be CANONICAL — an
 *  event someone actually researched into `<proposer>.json` — breaks the cycle: a proposal cannot
 *  parent another proposal, so each generation must be paid for by real research before it can
 *  produce the next.
 *
 *  "Established" means canonical files AND derived earnings prints. A print is established by
 *  earnings-calendar.ts, not by speculation, so it is a legitimate parent — and it has no file in
 *  this directory to point at. Treating prints as unestablished would wedge the calendar outright:
 *  the refusal below tells the author to write `<proposer>.json`, which for a print is itself
 *  refused by the "earnings are derived from earnings-calendar.ts" rule, leaving no legal move.
 *  Three print-parented proposals already exist; they pass today only because all three happen to
 *  be shadowed.
 *
 *  Honest scope: as of 2026-09-15 this fires on nothing (43 live proposals, all depth 1, after
 *  #2951's just-in-time brake choked the recursion). It is insurance against a failure that has
 *  already happened once, not a fix for a live one — free to enforce, and the calendar can no
 *  longer silently grow a second generation. */
function validateProposalDepth(file, establishedIds, problems) {
  const proposer = file.match(PROPOSAL_FILE_RE)?.[2];
  if (proposer === undefined || establishedIds.has(proposer)) return;
  problems.push(
    `${where(file)}: proposer "${proposer}" is itself only a proposal — discovery is capped at ` +
      `ONE generation (#2946). Research "${proposer}" into ${proposer}.json first, or drop this file.`,
  );
}

function validateFileNames(files, knownIds, derivedIds, problems, warnings) {
  // Derived earnings prints are established by earnings-calendar.ts and have no file here, so they
  // seed the set: they can parent a proposal, and they shadow one that duplicates their id.
  const canonicalIds = new Set(derivedIds);
  const proposalsFor = new Map();
  for (const { file, event } of files ?? []) {
    if (!file.startsWith("proposals/")) {
      canonicalIds.add(event?.id);
      if (file !== `${event?.id}.json`)
        problems.push(
          `${where(file)}: file name must equal its id — rename it to "${event?.id}.json"`,
        );
      continue;
    }
    const id = validateProposal(file, event, knownIds, problems);
    if (id !== null) proposalsFor.set(id, (proposalsFor.get(id) ?? []).concat(file));
  }
  for (const [id, list] of proposalsFor) {
    if (canonicalIds.has(id)) {
      warnings.push(
        `${id}: ${list.length} inert proposal(s) shadowed by ${id}.json — safe to prune`,
      );
      continue; // shadowed proposals never load, so the depth rule below cannot apply to them
    }
    if (list.length > 1)
      warnings.push(
        `${id}: ${list.length} competing proposals (${list.join(", ")}) — the first by name stands in until ${id}.json exists`,
      );
    for (const file of list) validateProposalDepth(file, canonicalIds, problems);
  }
}

/** RETIRING A RE-SLUG (#3101). `supersededBy` is the one field that makes an event stop loading,
 *  so it is the one field a typo can use to delete an event from the calendar silently. Every rule
 *  below exists to make that impossible to do by accident:
 *
 *  - the target is a CANONICAL `<id>.json`, never a proposal and never an unknown id — a proposal
 *    can be shadowed or pruned, so pointing at one could retire a real event in favour of nothing;
 *  - SAME DATE — two ids for one release share its date by construction, and requiring it turns a
 *    mistyped slug into a red build instead of a vanished event;
 *  - NO CHAINS — the survivor may not itself be superseded, so the loader never has to resolve a
 *    path and "which id survived" stays readable in one file;
 *  - the retiring entry is `estimate` — the survivor owns the confirming flip (both BEA copies
 *    already say exactly this in their own `source` lines);
 *  - its forward tests are already SCORED. This is the sharp one: a superseded id never reaches
 *    close-out, and `pendingForwardTests` reads the fragment of the id being closed out, so a live
 *    prediction registered against a retired id would simply never be scored by anyone. The lane
 *    retiring the id scores its own rows first — a test killed BY the fix is a kill, and the
 *    fragment has to say which kind it was. */
function validateSupersessions(superseded, canonicalIds, byId, forwardTestsDir, problems) {
  for (const e of superseded ?? []) {
    const where = `event "${e.id ?? "?"}"`;
    const target = e.supersededBy;
    if (typeof target !== "string" || !SLUG_RE.test(target)) {
      problems.push(`${where}: supersededBy must be a lowercase event-id slug`);
      continue;
    }
    if (target === e.id) {
      problems.push(`${where}: supersededBy cannot point at itself`);
      continue;
    }
    if (!canonicalIds.has(target)) {
      problems.push(
        `${where}: supersededBy "${target}" is not a canonical src/domain/market-events/${target}.json` +
          " — a survivor must be an event someone actually researched, never a proposal",
      );
      continue;
    }
    const survivor = byId.get(target);
    if (survivor?.date !== e.date)
      problems.push(
        `${where}: supersededBy "${target}" is dated ${survivor?.date} — a re-slug names the SAME ` +
          `release, so it must share this entry's date (${e.date})`,
      );
    if (survivor?.supersededBy !== undefined)
      problems.push(
        `${where}: supersededBy "${target}" is itself superseded — point at the surviving id ` +
          `("${survivor.supersededBy}"), never at a chain`,
      );
    if (e.status !== "estimate")
      problems.push(
        `${where}: a superseded entry is always status "estimate" — the survivor owns the confirming flip`,
      );
    const unscored = unscoredForwardTests(e.id, forwardTestsDir);
    if (unscored.length)
      problems.push(
        `${where}: ${unscored.length} unscored forward test(s) (${unscored.map((t) => t.id).join(", ")}) — ` +
          "a superseded id never reaches close-out, so score them in " +
          `docs/research/forward-tests/${e.id}.md first (killed BY this fix is a kill, and the row must say so)`,
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

function validate({ curated, derived, all, superseded, files }, cadence, ledgers, forwardTestsDir) {
  const problems = [];
  const warnings = [];
  const ids = new Set();
  const derivedIds = new Set((derived ?? []).map((e) => e.id));
  validateCadence(cadence, problems);
  for (const e of all) validateEvent(e, ids, problems);
  // Retired entries are validated exactly like live ones — they keep their file, so a bad date or
  // an unknown kind in one is still drift — and their ids join `ids` so their ledgers, which are
  // the whole point of mark-don't-delete, do not read as orphans.
  for (const e of superseded ?? []) validateEvent(e, ids, problems);
  const knownIds = new Set([...ids, ...ledgers.keys()]);
  validateFileNames(files, knownIds, derivedIds, problems, warnings);
  for (const e of curated)
    if (e.kind === "earnings")
      problems.push(
        `event "${e.id}": earnings are derived from earnings-calendar.ts — never hand-entered here`,
      );
  const canonicalIds = new Set(
    (files ?? []).filter((f) => !f.file.startsWith("proposals/")).map((f) => f.event?.id),
  );
  const byId = new Map([...(superseded ?? []), ...all].map((e) => [e.id, e]));
  validateSupersessions(superseded, canonicalIds, byId, forwardTestsDir, problems);
  // Advisory only (event-title-overlap.mjs explains why): a same-date near-title-match is a
  // heuristic over prose, and the enforced half is `supersededBy`. Live events only — adopting
  // the field drains the warning it produced.
  warnings.push(...titleOverlapWarnings(curated));
  validateLedgers(ledgers, ids, problems, warnings);
  return { problems, warnings };
}

export function runValidate(tables, cadence, ledgers, forwardTestsDir) {
  const { problems, warnings } = validate(tables, cadence, ledgers, forwardTestsDir);
  for (const w of warnings) console.error(`⚠ ${w}`);
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(
      `\n${problems.length} contract violation(s). A malformed calendar is worse than none —` +
        " the Routine would assess the wrong thing and look green doing so.",
    );
    process.exit(1);
  }
  const retired = tables.superseded?.length ?? 0;
  console.log(
    `✓ ${tables.all.length} event(s)${retired ? ` (+ ${retired} superseded, not loaded)` : ""} and ` +
      `${ledgers.size} ledger(s) satisfy the contract.`,
  );
}
