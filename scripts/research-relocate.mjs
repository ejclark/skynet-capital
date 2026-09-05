#!/usr/bin/env node
// research-relocate — move research writes out of the two shared files and into the per-event
// files that own them. The migration tool for the fragment architecture (issue #1449).
//
// WHY THIS EXISTS. Every research lane owns exactly one event, but until 2026-09-05 two of its
// write targets were repo-wide aggregates every sibling lane appended to at the same time:
// `docs/research/forward-tests.md` (one markdown table of every pre-registered hypothesis) and
// `src/domain/market-events-data.ts` (one TypeScript array literal of every calendar entry). Three
// merge-side fixes in 24 h (#1340 custom driver, #1359 date-sorted insertion, #1334 merge=union)
// each made the LOCAL merge clean and changed nothing on GitHub, whose server-side merge runs no
// driver and reads no attribute: 12 of the 14 research PRs open at the time still conflicted, and
// each conflict cost a paid repair session. The structural fix is towncrier's news-fragment shape
// ("rather than … one single file which developers all write to and produce merge conflicts"):
// one file per owner, aggregate on the read side.
//
//   node scripts/research-relocate.mjs init
//       One-shot, on a checkout that still carries the legacy files: split every register row into
//       docs/research/forward-tests/<event-id>.md (legacy bare-number rows → legacy.md) and every
//       calendar entry into src/domain/market-events/<id>.json. Leaves the legacy files in place
//       for the caller to replace/delete (the build PR rewrites them by hand).
//
//   node scripts/research-relocate.mjs branch --base <ref> --head <ref> [--restore-from <ref>]
//                                             [--proposals-yield]
//       On a research branch that pre-dates the split, after `git merge origin/main` (conflicted or
//       not): take what <head> changed relative to <base> in the two legacy files — added or
//       edited register rows, added/edited/removed calendar entries — write those changes into the
//       per-event files, then restore both legacy files from <restore-from> (default origin/main)
//       so the merge resolves to main's shape. Refuses (exit 2, nothing written) when both sides
//       edited the same row or entry differently — that is a genuine content conflict for a human,
//       never something a relocation should paper over. `--proposals-yield` names the one
//       exception: an `estimate` adjacency proposal for an id main already carries yields to
//       main's entry (reported, never silent) — see planCalendar.
//
// Primitives live in research-relocate-lib.mjs. Loud-failure doctrine: an unparseable input is an
// error, never an empty relocation.
import { existsSync, readFileSync, rmSync } from "node:fs";
import {
  EVENTS_DIR,
  eventFile,
  FRAGMENT_DIR,
  formatJson,
  fragmentFor,
  git,
  knownEventIds,
  LITERAL_FILE,
  parseLiteral,
  parseRows,
  REGISTER_FILE,
  ROW_RE,
  readEventFile,
  readFragments,
  sameJson,
  showAt,
  writeEvent,
  writeFragment,
} from "./research-relocate-lib.mjs";

const REL_LITERAL = "src/domain/market-events-data.ts";
const REL_REGISTER = "docs/research/forward-tests.md";

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

function runInit() {
  const literal = parseLiteral(
    existsSync(LITERAL_FILE) ? readFileSync(LITERAL_FILE, "utf8") : null,
  );
  if (literal.size === 0)
    throw new Error("research-relocate init: no MARKET_EVENTS literal to split — already split?");
  const written = [];
  for (const event of literal.values()) {
    writeEvent(event);
    written.push(eventFile(event.id));
  }
  formatJson(written);

  const rows = parseRows(readFileSync(REGISTER_FILE, "utf8"));
  const known = knownEventIds();
  const grouped = new Map();
  for (const row of rows) {
    const frag = fragmentFor(row.id, known);
    if (!grouped.has(frag)) grouped.set(frag, []);
    grouped.get(frag).push(row);
  }
  for (const [frag, fragRows] of grouped) writeFragment(frag, fragRows);
  console.log(
    `research-relocate init: ${literal.size} event(s) → ${EVENTS_DIR}; ${rows.length} row(s) → ` +
      `${grouped.size} fragment(s) in ${FRAGMENT_DIR}`,
  );
}

/** One <head> entry against <base> and main: "same" (nothing to do), "write", "yield" (an
 *  `estimate` proposal main already carries, under `--proposals-yield`), or a conflict string. */
function classifyEntry(id, headEntry, baseEntry, head, yields) {
  if (sameJson(headEntry, baseEntry)) return "same";
  const onMain = readEventFile(id);
  if (onMain === null) return "write";
  if (baseEntry !== null)
    return sameJson(onMain, baseEntry)
      ? "write"
      : `calendar entry "${id}" changed on both main and ${head}`;
  if (sameJson(onMain, headEntry)) return "same";
  if (yields && headEntry.status === "estimate") return "yield";
  return `calendar entry "${id}" added on both main and ${head} with different bodies`;
}

/** Calendar half of a branch plan: what <head> changed, checked against what main has done to the
 *  same entry since the fork. Same-entry-both-sides is a conflict, never an overwrite — with one
 *  named exception under `--proposals-yield`: an adjacency PROPOSAL (`status: "estimate"`, added
 *  by <head>, absent at <base>) for an id main already carries yields to main's entry. The lane's
 *  own contract makes a proposal provisional (docs/process/EVENT-RESEARCH.md: estimates widen
 *  caution, never trigger action), and by the time this runs main's version has usually been
 *  through that event's own initial research. Every yield is reported, never silent. */
function planCalendar(baseEntries, headEntries, head, conflicts, yields) {
  const events = [];
  const removals = [];
  for (const [id, headEntry] of headEntries) {
    const verdict = classifyEntry(id, headEntry, baseEntries.get(id) ?? null, head, yields);
    if (verdict === "write") events.push(headEntry);
    else if (verdict === "yield") yields.push(id);
    else if (verdict !== "same") conflicts.push(verdict);
  }
  for (const id of baseEntries.keys()) {
    if (headEntries.has(id) || headEntries.size === 0) continue;
    const onMain = readEventFile(id);
    if (onMain === null) continue;
    if (!sameJson(onMain, baseEntries.get(id)))
      conflicts.push(`calendar entry "${id}" removed on ${head} but changed on main`);
    else removals.push(id);
  }
  return { events, removals };
}

/** Register half: diff by exact row text (a multiset — duplicate ids are real rows), pair a
 *  removed line with an added line of the same id as an EDIT (scoring an Outcome cell), and treat
 *  the rest as new registrations placed in the fragment their id names. */
function planRegister(baseRows, headRows, fragments, known, head, conflicts) {
  const rows = [];
  const baseLines = baseRows.map((r) => r.line);
  const headLines = headRows.map((r) => r.line);
  const added = headRows.filter((r) => !baseLines.includes(r.line));
  const removed = baseRows.filter((r) => !headLines.includes(r.line));
  const locateLine = (line) =>
    [...fragments.entries()].find(([, rs]) => rs.some((r) => r.line === line))?.[0] ?? null;
  for (const gone of removed) {
    const where = locateLine(gone.line);
    if (where === null) {
      conflicts.push(
        `register row "${gone.id}" edited on ${head}, but main no longer carries the base row`,
      );
      continue;
    }
    const replacement = added.find((r) => r.id === gone.id);
    if (replacement) added.splice(added.indexOf(replacement), 1);
    rows.push({
      id: gone.id,
      line: replacement?.line ?? null,
      fragment: where,
      replaces: gone.line,
    });
  }
  for (const row of added) {
    if (locateLine(row.line) !== null) continue; // already on main verbatim
    rows.push({ id: row.id, line: row.line, fragment: fragmentFor(row.id, known), replaces: null });
  }
  return rows;
}

function applyPlan(plan, fragments) {
  const written = [];
  for (const event of plan.events) {
    writeEvent(event);
    written.push(eventFile(event.id));
  }
  formatJson(written);
  for (const id of plan.removals) rmSync(eventFile(id));
  for (const { line, fragment, replaces } of plan.rows) {
    const rows = fragments.get(fragment) ?? [];
    if (replaces === null) rows.push({ id: line.match(ROW_RE)[1], line });
    else {
      const at = rows.findIndex((r) => r.line === replaces);
      if (line === null) rows.splice(at, 1);
      else rows[at] = { id: rows[at].id, line };
    }
    fragments.set(fragment, rows);
    writeFragment(fragment, rows);
  }
}

function report(plan, restoreFrom) {
  console.log(
    `research-relocate branch: ${plan.events.length} calendar entr(y/ies) written, ` +
      `${plan.removals.length} removed, ${plan.rows.length} register row(s) placed; ` +
      `${REL_LITERAL} and ${REL_REGISTER} restored from ${restoreFrom}.`,
  );
  for (const e of plan.events) console.log(`  event  ${e.id}`);
  for (const id of plan.removals) console.log(`  remove ${id}`);
  for (const id of plan.yields)
    console.log(
      `  yield  ${id} — main already carries this event; the branch's estimate proposal dropped`,
    );
  for (const r of plan.rows) {
    const how = r.replaces === null ? "" : r.line === null ? " (removed)" : " (edited)";
    console.log(`  row    ${r.id} → forward-tests/${r.fragment}.md${how}`);
  }
}

function runBranch() {
  const base = opt("base");
  const head = opt("head");
  const restoreFrom = opt("restore-from", "origin/main");
  if (!(base && head))
    throw new Error("research-relocate branch: --base <ref> and --head <ref> are required");

  const baseLiteralSrc = showAt(base, REL_LITERAL);
  const headLiteralSrc = showAt(head, REL_LITERAL);
  const conflicts = [];
  const yields = args.includes("--proposals-yield") ? [] : null;
  const fragments = readFragments();
  const known = knownEventIds([headLiteralSrc, baseLiteralSrc]);
  const { events, removals } = planCalendar(
    parseLiteral(baseLiteralSrc),
    parseLiteral(headLiteralSrc),
    head,
    conflicts,
    yields,
  );
  const rows = planRegister(
    parseRows(showAt(base, REL_REGISTER)),
    parseRows(showAt(head, REL_REGISTER)),
    fragments,
    known,
    head,
    conflicts,
  );

  if (conflicts.length) {
    for (const c of conflicts) console.error(`✗ ${c}`);
    console.error(
      `\nresearch-relocate branch: ${conflicts.length} genuine content conflict(s) — nothing written.`,
    );
    process.exit(2);
  }

  const plan = { events, removals, rows, yields: yields ?? [] };
  applyPlan(plan, fragments);
  // Resolve the merge to main's shape for the two legacy files (the split deleted the literal and
  // emptied the register; <head>'s hunks now live in the files written above).
  git("checkout", restoreFrom, "--", REL_LITERAL, REL_REGISTER);
  git(
    "add",
    "--",
    REL_LITERAL,
    REL_REGISTER,
    "docs/research/forward-tests",
    "src/domain/market-events",
  );
  report(plan, restoreFrom);
}

try {
  if (mode === "init") runInit();
  else if (mode === "branch") runBranch();
  else {
    console.error(
      "usage: research-relocate.mjs init | branch --base <ref> --head <ref> [--restore-from <ref>]",
    );
    process.exit(1);
  }
} catch (err) {
  console.error(`research-relocate: ${err.message}`);
  process.exit(1);
}
