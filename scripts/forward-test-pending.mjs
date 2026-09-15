#!/usr/bin/env node
// Pending forward tests — "can this event's close-out actually score its own predictions yet?"
//
// WHY THIS EXISTS (#2988, measured on gastech-2026-09-14). `event-scan.mjs` marks a passed event
// `event-passed-unscored` from D+1, and a close-out is never deterministically screened — so every
// one of those days buys a full Claude session. But the close-out's contract is to score the
// event's registered forward tests from settled data (docs/research/forward-tests.md: scored "from
// the cached instrument data (re-run the study script after the score-by date), never from memory
// of the tape"), and a test whose score-by date is later than D+1 simply cannot be scored by the
// session the scanner dispatches. On 2026-09-15 that produced THREE dispatches for one low-impact
// event in 38 minutes — the close-out correctly declined to write `## Outcome` (scoring a
// prediction before its stated window closes is falsification under the append-only rule), each
// merge to main re-triggered the push-driven sweep, and the branch-name dedupe key
// (`research/<event-id>`) only suppresses a re-dispatch while that PR is still OPEN.
//
// So the scanner waits instead: hold the close-out until the latest unscored score-by, PROVIDED
// the wait stays inside `closeOutWithinDays`. A test scoring beyond that ceiling is a structural
// conflict, not a timing one — the event would age out of its close-out window entirely — so the
// scanner still dispatches immediately and names the test, and the session records it unscoreable
// at close-out exactly as it does today.
//
// THE READ IS PURE TEXT — no GitHub API, no token, no network, and no `npm ci`, the same three
// properties `forward-test-id-scan.mjs` holds for the same directory and `event-scan.mjs` holds
// for the whole calendar. This can never be a flaky gate.
//
// PARSING, and why it is shaped defensively. The 571 fragments on the shelf are hand-authored
// markdown and are NOT column-uniform: measured 2026-09-15, rows carry 5, 6 and 8 cells against a
// 6-column header, cells contain escaped pipes (`\|4-session move\|`), 41 score-by cells trail a
// qualifier (`2027-12-22 (est.)`), and 27 rows carry a date-leading PREDICTION cell before the
// real score-by. Header-index mapping breaks on all of that. The rule that survives it: split on
// UNESCAPED pipes, take the LAST cell that starts with a YYYY-MM-DD as the score-by, and treat
// everything after it as the outcome. Verified against all 1,700 committed rows — in every
// multi-date row the last date is the score-by, and no scored outcome cell starts with a date.
//
// A row this cannot read is SKIPPED, never guessed at: an unparseable row leaves the event due
// today exactly as before. The failure mode of a wrong hold is a close-out that ages out of its
// window forever (`withinHorizon`'s note), so every ambiguity resolves toward dispatching.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Table cells of a markdown row, split on unescaped pipes only (`\|` is literal text inside a
 *  cell — the fragments use it for absolute-value bars). Leading/trailing empties dropped. */
const cells = (line) =>
  line
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim());

const LEADING_DATE = /^(\d{4}-\d{2}-\d{2})\b/;
const FT_ROW = /^\|\s*FT-/;
const ID = /^(FT-\S+)/;

/** An outcome cell that records no verdict. The three spellings actually in use for "not scored
 *  yet" are an empty cell, an em dash, and an open marker (counted across the whole register
 *  2026-09-15: 738 em dash, 713 open-ish, 142 empty). The open marker is written at least six ways
 *  — `_open_`, `— (open)`, `*(open)*`, `**_open_ — …`, `_open — …`, `_open_ — **not scoreable…` —
 *  so the leading markdown emphasis is stripped rather than pattern-matched (a `\b` after `open`
 *  does NOT fire on `_open_`, whose trailing underscore is a word character; that cost one round
 *  of this build). Anything else — `**pass**`, `**VOID**`, `` **`unscoreable`** `` — is a verdict,
 *  and a verdict is a scored row. */
const isUnscored = (text) =>
  text === "" || text === "—" || text === "-" || /^open/i.test(text.replace(/^[—\-\s*_(]+/, ""));

/** Every unscored row in one event's fragment whose score-by is still in the future, as
 *  `{ id, scoreBy }`. Empty when the fragment does not exist, carries no rows, or every row is
 *  scored or already past its date — all of which mean "nothing to wait for". */
export function pendingForwardTests(eventId, today, dir) {
  const file = join(dir, `${eventId}.md`);
  if (!existsSync(file)) return [];
  const pending = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!FT_ROW.test(line)) continue;
    const row = cells(line);
    let at = -1;
    for (let i = row.length - 1; i >= 0; i--)
      if (LEADING_DATE.test(row[i])) {
        at = i;
        break;
      }
    if (at === -1) continue; // no readable score-by — skip the row rather than guess
    const scoreBy = row[at].match(LEADING_DATE)[1];
    const outcome = row.slice(at + 1).join(" ");
    if (scoreBy <= today || !isUnscored(outcome.trim())) continue;
    pending.push({ id: row[0].match(ID)?.[1] ?? row[0], scoreBy });
  }
  return pending;
}

/** The close-out verdict for a passed, un-outcomed event: whether to hold, and what for.
 *
 *  `hold` is true only when EVERY pending test scores on or before the event's own close-out
 *  ceiling — waiting past that ceiling would destroy the outcome record rather than delay it.
 *  `beyondWindow` names the tests that cannot be scored inside it, so the session that does get
 *  dispatched knows the conflict is structural and records them unscoreable on purpose. */
export function closeOutHold(eventId, eventDate, today, closeOutWithinDays, dir) {
  const pending = pendingForwardTests(eventId, today, dir);
  if (!pending.length) return { hold: false, until: null, pending, beyondWindow: [] };
  const ceiling = new Date(Date.parse(`${eventDate}T00:00:00Z`) + closeOutWithinDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const beyondWindow = pending.filter((p) => p.scoreBy > ceiling);
  const until = pending.reduce((a, p) => (p.scoreBy > a ? p.scoreBy : a), pending[0].scoreBy);
  return { hold: beyondWindow.length === 0, until, pending, beyondWindow };
}
