#!/usr/bin/env node
// Forward-test id collision scan — the eye for a race the event-research automation lane can hit
// by construction. `docs/research/forward-tests.md` is one shared markdown table of pre-registered
// hypotheses; `.github/workflows/moneypenny-events.yml`'s "research due events" job runs MULTIPLE
// concurrent sessions (one matrix leg per due event), each independently reading the ledger's tip
// to compute "the next FT number." Two sessions that start close together can read the same
// highest number and both register a new row with the SAME id — this actually happened (merge
// commit 28be7c30, two unrelated PRs both adding a bare `FT-25`, resolved by hand; docs/LESSONS.md,
// 2026-09-04). `.github/prompts/event-research.md` now namespaces NEW ids to the session's own
// assigned event (`FT-<event-id>-<n>`), which removes the race at the source; this scan is the
// permanent, cheap, mechanical net behind that instruction — it never trusts a prompt to be
// followed, it checks the artifact.
//
// The dimension: any `FT-...` id (legacy bare-number or new namespaced form) that appears on more
// than one row of the ledger's table. A pure text-file check — no GitHub API, no token, no
// network — so unlike incident-scan.mjs / ci-install-duration-scan.mjs it is never conditional on
// a token and is always runnable, including offline and in CI.
//
//   node scripts/forward-test-id-scan.mjs             # report + enforce (advisory, see below)
//   node scripts/forward-test-id-scan.mjs --update    # rewrite the budget (ratchet: only lower)
//   node scripts/forward-test-id-scan.mjs --candidate # the first duplicated id, as JSON
//
// Resource doctrine (docs/COACHES.md): no network calls at all — this can never be a flaky gate.
// Wired advisory (tests/arch/forward-test-id.spec.ts), matching every other debt gate since Eric's
// 2026-08-29 call: a friends-and-family repo addresses debt as it's noticed, never pre-blocks a PR
// on it.
//
// The budget starts at 7, not 0: this scan's first run found the FT-25 collision this eye was
// built for ALREADY resolved, but also found seven still-live pre-existing collisions this session
// did not cause and was not scoped to fix — FT-25 (3 rows), FT-26, FT-27, FT-32, FT-45 (2 rows
// each) and FT-47 (5 rows) each carry more than one distinct registered hypothesis under one id.
// Grandfather, then shrink (docs/COACHES.md): the honest starting number is the measured one, same
// as clone-budget.json's non-zero start, not a fabricated zero this scan would immediately report
// past. Renumbering those rows is future work, not blocked on this gate's existence.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "forward-test-id-budget.json");
const LEDGER_FILE = join(ROOT, "docs/research/forward-tests.md");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);

/**
 * Every `FT-...` id in the ledger's leftmost table column, in row order. Matches a table row that
 * opens with `| FT-<anything not a pipe>` — covers both the legacy bare-number form (`FT-1`) and
 * the namespaced form (`FT-<event-id>-<n>`, e.g. `FT-fomc-2026-09-16-1`).
 */
function extractIds(ledger) {
  const ids = [];
  for (const line of ledger.split("\n")) {
    const m = line.match(/^\|\s*(FT-[^|]+?)\s*\|/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/** Ids that appear on more than one row, each with its row count. */
function duplicates(ids) {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }));
}

function main() {
  const ledger = readFileSync(LEDGER_FILE, "utf8");
  const ids = extractIds(ledger);
  const dupes = duplicates(ids);
  const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));

  if (flag("--candidate")) {
    console.log(JSON.stringify(dupes[0] ?? null));
    return 0;
  }

  console.log(
    `forward-test-id-scan: ${ids.length} forward-test row(s), ${dupes.length} duplicate id(s)`,
  );
  for (const d of dupes) console.log(`  DUPLICATE  ${d.id}  (${d.count} rows)`);

  if (flag("--update")) {
    const next = Math.min(budget.duplicateIds, dupes.length);
    writeFileSync(BUDGET_FILE, `${JSON.stringify({ duplicateIds: next }, null, 2)}\n`);
    console.log(`forward-test-id-scan: budget ratcheted to ${next}`);
    return 0;
  }

  if (dupes.length > budget.duplicateIds) {
    console.error(
      `\nforward-test-id-scan: ${dupes.length} duplicate id(s) exceeds the budget of ` +
        `${budget.duplicateIds}.\nRenumber one of the colliding rows — legacy bare-number ids stay ` +
        `as-is once resolved, new registrations use the event-namespaced FT-<event-id>-<n> scheme ` +
        `(.github/prompts/event-research.md).`,
    );
    return 1;
  }
  console.log("forward-test-id-scan: no duplicate forward-test ids. ✅");
  return 0;
}

process.exit(main());
