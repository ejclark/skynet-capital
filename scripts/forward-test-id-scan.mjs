#!/usr/bin/env node
// Forward-test register scan — two eyes on docs/research/forward-tests/ (one markdown fragment
// per event, issue #1449), both pure text-file checks: no GitHub API, no token, no network, so
// this can never be a flaky gate and is always runnable, including offline and in CI.
//
//   node scripts/forward-test-id-scan.mjs             # duplicate-id report, ADVISORY (budget)
//   node scripts/forward-test-id-scan.mjs --update    # rewrite the budget (ratchet: only lower)
//   node scripts/forward-test-id-scan.mjs --candidate # the first duplicated id, as JSON
//   node scripts/forward-test-id-scan.mjs --contract  # placement contract, BLOCKING (exit 1)
//
// EYE 1 — duplicate ids (advisory). The event-research automation lane runs one concurrent
// session per due event (moneypenny-events.yml); until 2026-09-04 every session computed "the
// next FT number" off the shared register's live tip, and two that started close together both
// registered `FT-25` (merge commit 28be7c30, resolved by hand; docs/LESSONS.md). The prompt now
// namespaces new ids to the session's own event (`FT-<event-id>-<n>`); this eye never trusts the
// prompt to be followed, it checks the artifact. Wired advisory (tests/arch/forward-test-id.spec.ts)
// like every debt gate since Eric's 2026-08-29 call. The budget started at the measured 7 (the
// pre-existing legacy collisions the FT-25 fix did not cause), never a fabricated 0 — grandfather,
// then shrink (docs/COACHES.md).
//
// EYE 2 — placement (blocking). The fragment split exists so that a lane only ever writes the file
// its own event id names; that property is what makes every research PR merge clean on GitHub.
// It holds only if (a) the index `docs/research/forward-tests.md` carries NO rows — a row there
// is a shared write, the thing that produced 12 conflicted PRs in one night; (b) a namespaced row
// `FT-<event-id>-<n>` lives in `<event-id>.md`, never in a sibling's file or legacy.md; (c) every
// fragment file name is an event slug (or `legacy`) and carries the table header. A violation
// fails `npm test` with a message that names the right file — the mechanism by which a session
// following a stale instruction self-corrects, since the research prompt is envelope-protected
// and cannot be taught any other way in the moment.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "forward-test-id-budget.json");
export const INDEX_FILE = join(ROOT, "docs/research/forward-tests.md");
export const FRAGMENT_DIR = join(ROOT, "docs/research/forward-tests");
const LEGACY = "legacy";
const ROW_RE = /^\|\s*(FT-[^|]+?)\s*\|/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
/** A namespaced id: FT-<event-id>-<n>, the event id ending in a YYYY-MM-DD (+ optional tail). */
const NAMESPACED_RE = /^FT-(.+-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)*)-(\d+)$/;
const TABLE_HEADER_RE = /^\|\s*#\s*\|\s*Hypothesis\s*\|/m;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);

/** Every `FT-…` id in a markdown's leftmost table column, in row order — legacy bare-number
 *  (`FT-1`) and namespaced (`FT-fomc-2026-09-16-1`) forms alike. */
export function extractIds(md) {
  const ids = [];
  for (const line of md.split("\n")) {
    const m = line.match(ROW_RE);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/** [{file, eventId, ids}] for every fragment on disk, sorted by file name. */
export function readFragments(dir = FRAGMENT_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const md = readFileSync(join(dir, file), "utf8");
      return {
        file,
        eventId: basename(file, ".md"),
        ids: extractIds(md),
        hasHeader: TABLE_HEADER_RE.test(md),
      };
    });
}

/** Ids that appear on more than one row across all fragments, each with its row count. */
export function duplicates(ids) {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }));
}

/** The placement contract as a pure function: problems (strings) for an index + fragments pair. */
export function placementProblems({ indexMd, fragments }) {
  const problems = [];
  const indexRows = extractIds(indexMd ?? "");
  for (const id of indexRows)
    problems.push(
      `docs/research/forward-tests.md carries row "${id}" — the index holds no rows. Register it in ` +
        `docs/research/forward-tests/<event-id>.md (the file your own event id names).`,
    );
  for (const { file, eventId, ids, hasHeader } of fragments) {
    if (eventId !== LEGACY && !SLUG_RE.test(eventId))
      problems.push(`docs/research/forward-tests/${file}: file name must be an event slug`);
    if (!hasHeader)
      problems.push(
        `docs/research/forward-tests/${file}: missing the table header ` +
          "(`| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |`)",
      );
    for (const id of ids) {
      const m = id.match(NAMESPACED_RE);
      if (!m) {
        if (eventId !== LEGACY)
          problems.push(
            `docs/research/forward-tests/${file}: row "${id}" is not namespaced — new rows are ` +
              `FT-${eventId}-<n>; bare-number ids live only in legacy.md`,
          );
        continue;
      }
      if (m[1] !== eventId)
        problems.push(
          `docs/research/forward-tests/${file}: row "${id}" belongs in ` +
            `docs/research/forward-tests/${m[1]}.md — a lane writes only its own event's file`,
        );
    }
  }
  return problems;
}

function main() {
  const fragments = readFragments();
  const ids = fragments.flatMap((f) => f.ids);
  const dupes = duplicates(ids);

  if (flag("--candidate")) {
    console.log(JSON.stringify(dupes[0] ?? null));
    return 0;
  }

  if (flag("--contract")) {
    const indexMd = existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, "utf8") : "";
    const problems = placementProblems({ indexMd, fragments });
    for (const p of problems) console.error(`✗ ${p}`);
    if (problems.length) {
      console.error(
        `\n${problems.length} placement violation(s). One file per event is what keeps research PRs ` +
          "from conflicting (issue #1449) — fix the placement, never the gate.",
      );
      return 1;
    }
    console.log(
      `✓ forward-test placement: ${fragments.length} fragment(s), ${ids.length} row(s), index carries no rows.`,
    );
    return 0;
  }

  const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
  console.log(
    `forward-test-id-scan: ${ids.length} forward-test row(s) across ${fragments.length} fragment(s), ` +
      `${dupes.length} duplicate id(s)`,
  );
  for (const { id, count } of dupes) console.log(`  ✗ ${id} appears on ${count} rows`);

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
        "as-is once resolved, new registrations use the event-namespaced FT-<event-id>-<n> scheme " +
        "in the event's own fragment.",
    );
    return 1;
  }
  console.log("forward-test-id-scan: no duplicate forward-test ids beyond budget. ✅");
  return 0;
}

if (process.argv[1] && /forward-test-id-scan\.mjs$/.test(process.argv[1])) process.exit(main());
