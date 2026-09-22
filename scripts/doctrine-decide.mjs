// doctrine-decide.mjs — the pure decision core for doctrine-scan.mjs (issue #2287, PR 8).
//
// This repo has a well-worn loop for market-event research (event-scan.mjs → forward-test-pending.mjs)
// and none for bot TRADING BEHAVIOR — a persona's own doctrine (its stated rules, its stops, its
// invalidation conditions) is asserted once in code and never re-checked against the tape. The
// dossier (docs/BOTS-SAURON.md) is where that doctrine now lives, in an append-only "Adaptation
// ledger" table (`| Date | Change | Why | Evidence | Next check |`) — this module answers exactly
// one question about it: is the ledger's most recent row due for another look?
//
// Table shape, mirroring forward-test-pending.mjs's own house convention (split on unescaped
// pipes, never trust a fixed column index — hand-authored markdown rows drift): the LAST row in
// the "## Adaptation ledger" table is the current state; its "Next check" cell is the due date.
// Editing a past row is falsification (append-only, same rule as the forward-test register), so
// the loop never needs to ask "which row is still open" — there is only ever one live row, the
// last one, exactly like event-scan.mjs's "**Last assessed:**" line answers the same question for
// an event ledger.
//
// Reason tags mirror event-scan.mjs's assessmentDue()/passedEventDue() family:
//   never-scored             — the ledger has no rows yet (or the table itself is missing)
//   scoring-interval-elapsed — a row exists with no "Next check" date; falls back to a fixed
//                              default cadence measured from its own "Date" cell
//   past-score-by-unscored   — a row's own "Next check" date has arrived or passed
import { existsSync, readFileSync } from "node:fs";

/** Table cells of a markdown row, split on unescaped pipes only (`\|` is literal text inside a
 *  cell) — the same primitive forward-test-pending.mjs uses, for the same reason: hand-authored
 *  rows are not column-uniform enough to trust a fixed split("|"). */
export function cells(line) {
  return line
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim());
}

const DATE_RE = /^(\d{4}-\d{2}-\d{2})\b/;
const HEADING = "## Adaptation ledger";

/** A cell's leading date, tolerant of markdown emphasis wrapping it (`**2026-10-06**` reads fine
 *  to a human and is the house convention for calling out a due date in prose — same allowance
 *  forward-test-pending.mjs's `isUnscored()` makes for leading `**`/`_`/`(` before its own markers).
 *  `null` when the cell doesn't lead with a date at all — never guessed at. */
function leadingDate(cell) {
  const stripped = cell.replace(/^[*_\s]+/, "");
  return DATE_RE.test(stripped) ? stripped.match(DATE_RE)[1] : null;
}

/** Every row of the dossier's "## Adaptation ledger" table, as `{date, change, why, evidence,
 *  nextCheck}` (nextCheck is `null` when the cell doesn't lead with a date). `[]` when the file
 *  doesn't exist, carries no such heading, or the table has no data rows. */
export function parseLedgerRows(md) {
  const headingAt = md.indexOf(HEADING);
  if (headingAt === -1) return [];
  const rows = [];
  for (const line of md.slice(headingAt).split("\n")) {
    if (!line.startsWith("|")) continue;
    const row = cells(line);
    if (row.length < 5) continue;
    const [dateCell, change, why, evidence, nextCheckCell] = row;
    const date = leadingDate(dateCell);
    if (!date) continue; // header/separator row, or unparseable — skip, don't guess
    rows.push({ date, change, why, evidence, nextCheck: leadingDate(nextCheckCell) });
  }
  return rows;
}

/** Loud-failure doctrine (event-scan.mjs): an unreadable dossier is an error, never an empty
 *  result — a scheduled caller must not mistake "broken" for "nothing due". A dossier that exists
 *  but genuinely carries no ledger rows yet (first boot) is the one legitimate "nothing to check"
 *  case, and is handled by decide()'s `never-scored` branch, not by throwing here. */
export function readDossier(path) {
  if (!existsSync(path)) throw new Error(`doctrine-scan: cannot read ${path} — refusing to guess.`);
  return readFileSync(path, "utf8");
}

/** The default review cadence for a ledger row that names no explicit "Next check" date — the
 *  same 30-day drift-check interval `SafetyController`'s own risk ladder assumes as "a while".
 *  Only used as a fallback; an explicit "Next check" cell always wins. */
export const DEFAULT_REVIEW_DAYS = 30;

function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** The pure decision: given the dossier's parsed ledger rows and today's date, is doctrine review
 *  due, and why? State shape: `{ rows: ReturnType<typeof parseLedgerRows> }`. No fs, no network —
 *  every input is a plain value, exactly the event-material-decide.mjs `decide(state)` shape. */
export function decide(state) {
  const { today, rows } = state;
  if (!rows || rows.length === 0) {
    return { due: true, reason: "never-scored", nextDueDate: null };
  }
  const last = rows[rows.length - 1];
  if (last.nextCheck) {
    return {
      due: last.nextCheck <= today,
      reason: last.nextCheck <= today ? "past-score-by-unscored" : null,
      nextDueDate: last.nextCheck,
    };
  }
  const fallbackDue = addDays(last.date, DEFAULT_REVIEW_DAYS);
  return {
    due: fallbackDue <= today,
    reason: fallbackDue <= today ? "scoring-interval-elapsed" : null,
    nextDueDate: fallbackDue,
  };
}

/** Appends a new ledger row — never edits an existing one (append-only, per the dossier's own
 *  rule: "editing a past row is falsification"). Throws if the heading is missing, exactly like
 *  event-material-decide.mjs's insertLedgerRow() throws rather than silently no-op'ing on a
 *  malformed target. */
export function appendLedgerRow(md, row) {
  const headingAt = md.indexOf(HEADING);
  if (headingAt === -1) throw new Error(`doctrine-scan: dossier is missing "${HEADING}"`);
  const lines = md.split("\n");
  const startLine = md.slice(0, headingAt).split("\n").length - 1;
  let lastTableLine = -1;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("|")) lastTableLine = i;
    else if (line.trim() !== "" && lastTableLine !== -1) break;
  }
  if (lastTableLine === -1)
    throw new Error(`doctrine-scan: dossier's "${HEADING}" has no table to append to`);
  const cellsOut = [row.date, row.change, row.why, row.evidence, row.nextCheck ?? ""];
  lines.splice(lastTableLine + 1, 0, `| ${cellsOut.join(" | ")} |`);
  return lines.join("\n");
}
