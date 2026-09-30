// loop-list-decide.mjs — the pure core behind the digest's overdue-loop-check flag (#4060, slice 2
// of #3955). docs/process/LEARNING-LOOP.md carries a "## Loops running now" table, one row per
// learning loop with a dated `Next check` cell. This module answers one question of it: which
// still-running loops have reached their `Next check` date?
//
// Why a sibling of doctrine-decide.mjs rather than a second heading inside it: the doctrine ledger
// is append-only (the LAST row is the only live one), while the loop list is a register — every row
// is live at once, and a loop's check is settled by moving its `Next check` date forward (or ending
// the loop) in place. Different table semantics, same cell primitives. doctrine-scan.mjs --due runs
// both, so the secretary-digest Routine picks this up with no schedule change (#3955 constraint).
//
// Columns are found by header name, never by index — hand-authored tables drift.
import { cells, leadingDate } from "./doctrine-decide.mjs";

export const LOOP_LIST_HEADING = "## Loops running now";

/** States that end a loop's checks. Anything else (running, piloting, scaling, blocked-on-fix…)
 *  is still owed its next check. `pivoted` counts as ended for the ROW — the pivot is a new row. */
const ENDED = new Set(["closed", "killed", "pivoted", "replaced"]);

const bare = (cell) => cell.replace(/[*_`]/g, "").trim();

/** Every data row of the loop-list table, as `{ loop, issue, state, nextCheck }` (`nextCheck` is
 *  `null` when the cell doesn't lead with a date). `null` — not `[]` — when the heading is absent,
 *  so a caller can tell "no list yet" from "a list with nothing on it". Throws when the heading is
 *  present but its table lacks a `Loop` or `Next check` column: a list the scan can't read is
 *  broken, never quietly "nothing due". */
export function parseLoopList(md) {
  const at = md.indexOf(LOOP_LIST_HEADING);
  if (at === -1) return null;
  const tableLines = [];
  for (const line of md.slice(at + LOOP_LIST_HEADING.length).split("\n")) {
    if (line.startsWith("## ")) break;
    if (line.startsWith("|")) tableLines.push(line);
    else if (tableLines.length && line.trim() !== "") break;
  }
  const [header, , ...body] = tableLines;
  const names = header ? cells(header).map((c) => bare(c).toLowerCase()) : [];
  const col = (name) => names.indexOf(name);
  if (col("loop") === -1 || col("next check") === -1) {
    throw new Error(
      `loop-list: "${LOOP_LIST_HEADING}" needs a table with "Loop" and "Next check" columns — refusing to guess.`,
    );
  }
  return body.map((line) => {
    const row = cells(line);
    const at = (name) => (col(name) === -1 ? "" : (row[col(name)] ?? ""));
    return {
      loop: bare(at("loop")),
      issue: bare(at("owning issue")),
      state: bare(at("state")).toLowerCase(),
      nextCheck: leadingDate(at("next check")),
    };
  });
}

/** The pure decision: the rows whose check is owed — not ended, and `nextCheck` on or before
 *  `today` (the same "arrived or passed" line doctrine-decide.mjs draws). A running row with no
 *  date is not flagged here; the template (slice 1) requires one, and inventing a cadence for a
 *  loop that never stated one would be a guess. */
export function overdueLoops({ today, rows }) {
  return (rows ?? [])
    .filter((r) => !ENDED.has(r.state.split(/\s/)[0]))
    .filter((r) => r.nextCheck && r.nextCheck <= today)
    .map((r) => ({ ...r, due: true, reason: "loop-check-overdue", nextDueDate: r.nextCheck }));
}
