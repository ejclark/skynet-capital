#!/usr/bin/env node
// Event scan — the eye behind the market-event calendar (docs/process/EVENT-RESEARCH.md).
//
// Events live in two checked-in tables: src/domain/market-events-data.ts (macro/sector/etc,
// curated — re-exported through market-events.ts, where the query logic lives) and
// src/domain/earnings-calendar.ts (prints, derived — one source of truth for print dates).
// Each event's assessment history lives in docs/research/events/<id>.md, whose
// `**Last assessed:** YYYY-MM-DD` header line is this scanner's machine contract. The ADAPTIVE
// cadence (impact tier × days-to-event → reassess interval) is a pure function over
// assessment-cadence.json — the daily Routine's cron stays fixed; the frequency ramp
// ("weekly at two months out, daily in the final week") lives entirely here, unit-testable.
//
//   node scripts/event-scan.mjs               # human report: every event, band, due mark
//   node scripts/event-scan.mjs --due         # JSON array of events due for assessment ([] = no-op).
//                                             # Bounded by assessment-cadence.json's `horizon`
//                                             # (#2946): nothing past maxDaysOut, and past
//                                             # allImpactsWithinDays only critical/high. Close-outs
//                                             # are exempt — they expire permanently. A closed-out
//                                             # event comes BACK as `forward-test-due` when one of
//                                             # its registered forward tests reaches its score-by
//                                             # (#2884) — closing is not resolving.
//   node scripts/event-scan.mjs --validate    # enforce the contract (exit 1 on violation)
//   node scripts/event-scan.mjs --dump        # extracted tables as JSON (the drift gate's input)
//   ... --on-date=YYYY-MM-DD                  # every entry already on that date, retired ones
//                                             # included. Run this BEFORE proposing an event
//                                             # (#3361): a date lookup has no false-negative rate;
//                                             # a title-similarity scan (#3360) does.
//   ... --today=YYYY-MM-DD                    # deterministic date override for tests
//   ... --events-file= --calendar-file= --cadence-file= --ledger-dir=   # fixture overrides (tests)
//
// Enforced in CI via tests/arch/event-scan.spec.ts; consumed by .github/workflows/event-detect.yml
// and the daily event-scan Routine (docs/ROUTINES.md). Dependency-free on purpose — the workflow
// runs it WITHOUT `npm ci` (GHA minutes are the metered constraint). It reads the TS table
// literals by marker string (the same technique confirm-print-dates.ts uses to WRITE one);
// the arch spec's drift gate keeps extraction honest against the real imports.
//
// Loud-failure doctrine (from confirm-print-dates.ts): an unreadable input file is an error,
// never an empty result — a scheduled caller must not mistake "broken" for "nothing due".
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
  compareEventOrder,
  DATE_RE,
  horizonProblems,
  runValidate,
} from "./event-scan-validation.mjs";
import { closeOutHold, dueForwardTests } from "./forward-test-pending.mjs";
import { readCalendarDir } from "./market-events-read.mjs";

const ROOT = process.cwd();

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const EVENTS_DIR = arg("events-dir") ?? join(ROOT, "src", "domain", "market-events");
const CALENDAR_FILE = arg("calendar-file") ?? join(ROOT, "src", "domain", "earnings-calendar.ts");
const CADENCE_FILE = arg("cadence-file") ?? join(ROOT, "assessment-cadence.json");
const LEDGER_DIR = arg("ledger-dir") ?? join(ROOT, "docs", "research", "events");
const FORWARD_TESTS_DIR =
  arg("forward-tests-dir") ?? join(ROOT, "docs", "research", "forward-tests");

/** Whole calendar days from today's UTC date to `date` (negative = past) — mirrors
 *  earnings-calendar.ts daysUntil, re-implemented because this script must not need `npm ci`. */
const daysBetween = (fromDate, toDate) =>
  Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000,
  );

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Extract an exported array literal from a TS source file by its marker line and evaluate it.
 *  The marker includes the literal's own `= [` (the confirm-print-dates.ts technique) so the
 *  type annotation's `[]` can never be mistaken for the array. Safe here because both tables are
 *  flat literals of strings/arrays (the drift gate in tests/arch/event-scan.spec.ts fails CI the
 *  day that stops being true). Unreadable file or missing marker throws — loud, never empty. */
function extractArray(file, marker) {
  if (!existsSync(file)) throw new Error(`event-scan: cannot read ${file} — refusing to guess.`);
  const source = readFileSync(file, "utf8");
  const at = source.indexOf(marker);
  if (at === -1) throw new Error(`event-scan: marker "${marker}" not found in ${file}.`);
  const open = at + marker.length - 1; // the marker ends at the array's opening bracket
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) {
        // new Function is contained to checked-in, reviewed table literals — never remote input.
        return new Function(`return ${source.slice(open, i + 1)};`)();
      }
    }
  }
  throw new Error(`event-scan: unbalanced brackets after "${marker}" in ${file}.`);
}

/** The curated calendar: one JSON file per event under EVENTS_DIR (issue #1449 — the split that
 *  ended the research lanes' shared-file conflicts), read without `npm ci` and sorted into the
 *  canonical (date, id) order exactly as src/domain/market-events-data.ts sorts it. `files` keeps
 *  the file → id pairing for the validator: "file name == id" is the one rule the loader cannot
 *  express by shape. Unreadable dir or malformed JSON throws — loud, never empty. */
/** Canonical files, then proposals (`proposals/<id>.from-<proposer>.json`, issue #1717) for ids no
 *  canonical file names — first by file name wins, the same rule as loadMarketEvents. Entries their
 *  own lane retired with `supersededBy` (#3101) come back separately in `superseded`: they are not
 *  the calendar any more, but `--validate` still holds them to the contract. `files` carries every
 *  file read (shadowed proposals included) for the validator. */
function loadCurated() {
  try {
    const { events, superseded, files } = readCalendarDir(EVENTS_DIR);
    return { events: events.sort(compareEventOrder), superseded, files };
  } catch (err) {
    throw new Error(`event-scan: ${err.message}`);
  }
}

function loadEvents() {
  const { events: curated, superseded, files } = loadCurated();
  const prints = extractArray(
    CALENDAR_FILE,
    "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [",
  );
  const derived = prints.map((p) => ({
    id: `${p.symbol.toLowerCase()}-${p.date}-print`,
    kind: "earnings",
    title: `${p.symbol} earnings print`,
    date: p.date,
    status: p.status,
    source: p.source,
    impact: "critical",
    symbols: [p.symbol],
  }));
  return { curated, derived, all: [...curated, ...derived], superseded, files };
}

function loadCadence() {
  if (!existsSync(CADENCE_FILE))
    throw new Error(`event-scan: cannot read ${CADENCE_FILE} — refusing to guess.`);
  return JSON.parse(readFileSync(CADENCE_FILE, "utf8"));
}

/** Fail closed on the horizon for the modes that actually decide what to research (--due and the
 *  human report): an absent or nonsensical horizon must never read as "no horizon", which is the
 *  uncapped behaviour of #2946. Deliberately NOT inside loadCadence — throwing there would
 *  pre-empt `--validate`, which exists to REPORT every contract violation at once (a bad horizon
 *  would hide all the others behind a stack trace), and would couple `--dump` to a field it never
 *  reads. The rule itself lives once, in event-scan-validation.mjs, so the two callers cannot
 *  drift apart. */
function assertHorizon(cadence) {
  const problems = horizonProblems(cadence.horizon);
  if (problems.length)
    throw new Error(
      `event-scan: ${CADENCE_FILE} — refusing to scan with no valid research horizon (#2946):\n` +
        `${problems.map((p) => `  - ${p}`).join("\n")}\n` +
        "Run --validate for the full contract report.",
    );
}

/** The ledger's machine contract: docs/research/events/<id>.md with a `**Last assessed:**` line
 *  and (once closed out) an `## Outcome` section. Takes the LAST `**Last assessed:**` occurrence,
 *  not the first — event-material-decide.mjs's applyScreen APPENDS a fresh one on every screen
 *  (2026-09-19, docs/LESSONS.md) rather than rewriting the original header in place, precisely so
 *  two screens racing the same event merge as disjoint additions instead of conflicting on one
 *  line. Mirrors parseLedgerHeader's own "last occurrence wins" read in event-material-decide.mjs;
 *  kept as a local regex here rather than a cross-module import since event-scan.mjs's own read
 *  path has never otherwise depended on that file. */
function loadLedgers() {
  const ledgers = new Map();
  if (!existsSync(LEDGER_DIR)) return ledgers;
  for (const f of readdirSync(LEDGER_DIR)) {
    if (!f.endsWith(".md") || f === "TEMPLATE.md" || f === "README.md") continue;
    const text = readFileSync(join(LEDGER_DIR, f), "utf8");
    ledgers.set(basename(f, ".md"), {
      file: `docs/research/events/${f}`,
      lastAssessed: [...text.matchAll(/^\*\*Last assessed:\*\*\s*(\S+)/gm)].at(-1)?.[1] ?? null,
      hasOutcome: /^##\s+Outcome\b/m.test(text),
    });
  }
  return ledgers;
}

/** The adaptive-cadence decision for one event — the pure function at the system's core.
 *  Tested through the CLI (--due --today=… with fixture files), matching the handoff pattern.
 *
 *  THE JUST-IN-TIME BRAKE (#2946, 2026-09-10/11) — never-assessed used to fire the moment an
 *  event landed in the calendar, at ANY impact and ANY distance. With the calendar self-feeding
 *  (proposals loading as events; 641 canonical + 469 pending over 2026-09-10→11 ALONE), that made
 *  every arrival buy an Opus session immediately: 338 initial sessions in 7 days, ~89% of them
 *  for low/medium-impact events weeks or months away — where the adjacency corridor is still
 *  churning and the research goes stale before the event. High/critical keep the old behavior
 *  (an early stance is the point of tracking them — the call sheet has positioning value weeks
 *  out). Below that floor the initial becomes JUST-IN-TIME: assessed once, on entering the
 *  event's outermost cadence band (low: D-15, medium: D-31 — the distance at which its own
 *  cadence table starts pulsing it at the tighter intervals), then ordinary cadence and one
 *  close-out. Same coverage, spread over time, bought when the corridor has settled. The
 *  deterministic screen's corridor rows carry the event for free until then. */
const EARLY_STANCE_IMPACTS = new Set(["critical", "high"]);

/** The close-out is due, but its own forward tests cannot be scored yet (#2988) — not-due, with a
 *  real `nextDueDate` rather than silence, so the hold reads as a decision on the human report. */
const HELD = "close-out-held-for-forward-test";

/** THE RESEARCH HORIZON (#2946, slice 2 — the pool cut, where the dispatch ceiling was the burst
 *  cut). Nothing beyond `horizon.maxDaysOut` is ever due, and between `allImpactsWithinDays` and
 *  that outer edge only high/critical qualify. An event does not leave the calendar — it simply
 *  stops buying sessions until it comes inside the horizon, which is also when its research stops
 *  going stale before the print.
 *
 *  WHY A SNAPSHOT UNDERSTATES THIS, and the number that justifies the thresholds: "due today"
 *  only falls 108 → 98, because most of the deep backlog is already inside 30 days. But an event
 *  90 days out pulses repeatedly on its way in, so the honest measure is pulses over every
 *  upcoming event's remaining life: 5,375 → 2,320, a 57% cut (630 upcoming events, measured
 *  2026-09-15). A tighter 30-day/all-impacts horizon scores 61% — four points more for losing all
 *  long-lead preparation on high/critical prints, which is why 60/30 is the chosen knee.
 *
 *  Close-outs are deliberately upstream of this check: a passed event ages out of
 *  closeOutWithinDays permanently, so the horizon must never be able to destroy an outcome record
 *  (the same invariant the dispatch ceiling's close-out floor protects in moneypenny/events.mjs). */
function withinHorizon(event, days, cadence) {
  const horizon = cadence.horizon;
  if (days > horizon.maxDaysOut) return false;
  return days <= horizon.allImpactsWithinDays || EARLY_STANCE_IMPACTS.has(event.impact);
}

/** The verdict for an event that has already HAPPENED — split out of `assessmentDue` because the
 *  passed side now has two independent reasons to spend a session and they must stay in this
 *  order: the close-out first (it expires permanently), the forward-test re-dispatch after (it
 *  never does). Called only when `days < 0`, and deliberately ahead of the horizon check — see
 *  withinHorizon's note on permanent ageing-out. `none` is passed in so both sides share one
 *  not-due shape. */
function passedEventDue(event, ledger, today, cadence, days, none) {
  if (!ledger?.hasOutcome && -days <= cadence.closeOutWithinDays) {
    // THE FORWARD-TEST HOLD (#2988) — a close-out that cannot score its own predictions yet is
    // a dispatch that can only re-read state and leave. See forward-test-pending.mjs for the
    // measurement (3 sessions in 38 minutes on gastech-2026-09-14) and the parsing rules.
    const { hold, until, beyondWindow } = closeOutHold(
      event.id,
      event.date,
      today,
      cadence.closeOutWithinDays,
      FORWARD_TESTS_DIR,
    );
    if (hold) return { ...none, reason: HELD, nextDueDate: until };
    // Structural, not timing: the test scores after this event's close-out ceiling, so waiting
    // would age the outcome record out entirely. Dispatch now and NAME it, so the session
    // records those rows unscoreable at close-out on purpose rather than by omission. `reason`
    // itself is deliberately unchanged — moneypenny/events.mjs sorts on the exact string.
    return {
      due: true,
      reason: "event-passed-unscored",
      intervalDays: null,
      nextDueDate: today,
      ...(beyondWindow.length ? { forwardTestsBeyondWindow: beyondWindow } : {}),
    };
  }

  // THE SCORE-BY RE-DISPATCH (#2884). Closing out an event used to silence it forever, which is
  // fine for the ledger and wrong for the register: a forward test is deliberately allowed to key
  // on data that does not exist yet, and a quarter of honest registrations score past the 6-day
  // close-out ceiling. Those rows had NO second net — `forward-test-id-scan.mjs` never reads the
  // `Score by` column and no other lane fills an Outcome cell — so they sat `_open_` forever,
  // cited in stance notes as predictions that would settle and silently never settling. Measured
  // 2026-09-20: 21 events × 31 rows already permanently orphaned, 6 of them decided by the tape
  // and unrecorded, up from 6 events five days earlier.
  //
  // So the owning lane is sent BACK when one of its own rows comes due, rather than a gate
  // refusing the registration up front (which would only pressure lanes into short, dishonest
  // score-by dates and would fix none of the stock). Deliberately AFTER the close-out branch: an
  // event still owed its `## Outcome` gets that first, and this only ever fires on a ledger that
  // has already closed out. `nextDueDate` is today because the row is due now, not on a cadence —
  // this is a one-shot pulse that stops the moment the row carries any verdict, which
  // docs/process/EVENT-RESEARCH.md's terminal-verdict rule is what guarantees.
  if (ledger?.hasOutcome) {
    const due = dueForwardTests(event.id, today, FORWARD_TESTS_DIR);
    if (due.length)
      return {
        due: true,
        reason: "forward-test-due",
        intervalDays: null,
        nextDueDate: today,
        forwardTestsDue: due,
      };
  }
  return none;
}

function assessmentDue(event, ledger, today, cadence) {
  const days = daysBetween(today, event.date);
  const none = { due: false, reason: null, intervalDays: null, nextDueDate: null };

  if (days < 0) return passedEventDue(event, ledger, today, cadence, days, none);

  // `beyond-horizon` rather than a bare `none`, so the human report says WHY an event is quiet
  // instead of printing an empty cadence note. `due` stays false, so it never reaches --due.
  if (!withinHorizon(event, days, cadence)) return { ...none, reason: "beyond-horizon" };

  if (!ledger?.lastAssessed) {
    if (
      !EARLY_STANCE_IMPACTS.has(event.impact) &&
      days > (cadence.bands[event.impact]?.[0]?.minDaysOut ?? 0)
    )
      return none;
    return { due: true, reason: "never-assessed", intervalDays: null, nextDueDate: today };
  }

  const band = cadence.bands[event.impact].find((b) => days >= b.minDaysOut);
  const interval = band.intervalDays;
  const nextDueDate = addDays(ledger.lastAssessed, interval);
  const due = daysBetween(today, nextDueDate) <= 0;
  return { due, reason: due ? "interval-elapsed" : null, intervalDays: interval, nextDueDate };
}

// Contract validation (validateEvent, validateCadence, validateLedgers, runValidate) lives in
// event-scan-validation.mjs — a distinct concern from extraction and cadence math below.

function printDue(rows) {
  const due = rows
    .filter((r) => r.verdict.due)
    .map(({ e, ledger, days, verdict }) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      date: e.date,
      status: e.status,
      source: e.source,
      impact: e.impact,
      symbols: e.symbols,
      daysUntil: days,
      lastAssessed: ledger?.lastAssessed ?? null,
      intervalDays: verdict.intervalDays,
      reason: verdict.reason,
      ledger: ledger?.file ?? `docs/research/events/${e.id}.md`,
      // Present only on a close-out whose own forward tests score AFTER its window closes (#2988):
      // the session is told the conflict is structural rather than its own timing. The workflow's
      // matrix forwards `{id, reason}` only, so this reaches a human reading `--due`, not the
      // prompt — moneypenny-events.yml is envelope-protected and not this lane's to widen.
      ...(verdict.forwardTestsBeyondWindow
        ? { forwardTestsBeyondWindow: verdict.forwardTestsBeyondWindow }
        : {}),
      // Present only on a `forward-test-due` re-dispatch (#2884): the rows whose score-by has
      // arrived on an event that already closed out. Unlike the field above this one DOES reach a
      // human meaningfully on its own, but the session finds the same rows by re-reading its own
      // fragment — the mode in EVENT-RESEARCH.md tells it to, and `reason` is all the matrix
      // forwards.
      ...(verdict.forwardTestsDue ? { forwardTestsDue: verdict.forwardTestsDue } : {}),
    }));
  process.stdout.write(`${JSON.stringify(due, null, 2)}\n`);
}

function printReport(rows) {
  if (!rows.length) {
    console.log("No upcoming events. Add one as src/domain/market-events/<id>.json (or a print to");
    console.log("earnings-calendar.ts) — see docs/process/EVENT-RESEARCH.md.");
    return;
  }
  for (const { e, ledger, days, verdict } of rows) {
    const mark = verdict.due ? "▶" : "·";
    const when = days < 0 ? `D+${-days}` : `D-${days}`;
    const cadenceNote = verdict.intervalDays
      ? `every ${verdict.intervalDays}d`
      : (verdict.reason ?? "");
    console.log(
      `${mark} ${when}\t${e.date}  ${e.impact.padEnd(8)} ${e.id} — ${e.title}` +
        `  [${e.status}; last: ${ledger?.lastAssessed ?? "never"}; ${cadenceNote}` +
        `${verdict.due ? ` — DUE (${verdict.reason})` : `; next ${verdict.nextDueDate}`}]`,
    );
  }
  const due = rows.filter((r) => r.verdict.due);
  console.log(
    `\n${rows.length} event(s) on the horizon, ${due.length} due for assessment.` +
      (due.length ? " The Routine will pick these up (docs/ROUTINES.md)." : ""),
  );
}

/** THE DATE LOOKUP (#3361) — what a lane reads BEFORE it proposes an event.
 *
 *  WHY A LISTING AND NOT A SEARCH. The measured failure was one mis-specified search string: a
 *  D-14 sweep looked for "U.S. IIP", which is not a substring of BEA's own "International
 *  Transactions and Investment Position", and filed a third copy of a release the calendar already
 *  carried twice. A lookup keyed on the DATE is keyed on data the proposing lane already holds —
 *  it is proposing FOR that date — so its recall does not depend on the lane's own vocabulary at
 *  all. #3360's same-date title-overlap warning is the post-hoc half and is a heuristic tuned on
 *  seven positives; reading nine titles is a decision procedure with no false-negative rate.
 *
 *  SAME-DATE ONLY, AND THAT IS A MEASUREMENT, NOT A DEFAULT (#3361's open question — whether to
 *  also list D±1, since an off-by-one re-slug evades a same-date check exactly as it evades
 *  #3360's same-date scan). Re-scoring titleOverlapWarnings at #3360's 0.45 over each date's D+1
 *  cohort across the 720 committed live events returns 14 cross-date pairs and NOT ONE is a
 *  re-slug: nine are Treasury auctions (a different tenor every day of a settlement week), the
 *  rest cpi×ppi, dallas-fed-mfg×dallas-fed-tssos, iea-omr×opec-momr. A neighbour cohort would put
 *  three near-identical adjacent rows in front of every auction proposal, scoring 0/14 against the
 *  one failure it exists to catch. FALSIFIER: the first confirmed same-release re-slug whose two
 *  entries carry different dates — one such pair and the D±1 cohort earns its place.
 *
 *  RETIRED ENTRIES PRINT, THEY DO NOT VANISH. `supersededBy` (#3360) stops an entry loading as the
 *  calendar, but a lane about to re-file that release is the one caller who most needs to see the
 *  slug was already tried and which id won — omit it and the next sweep re-proposes the very id a
 *  lane just retired. Ahead of `assertHorizon` for the same reason `--dump` is: a listing of what
 *  exists must not be able to fail on the cadence file's research horizon, which it never reads. */
function printOnDate(tables, date) {
  const rows = [...tables.all, ...tables.superseded]
    .filter((e) => e?.date === date)
    .sort(compareEventOrder);

  // Loud-failure doctrine, applied to the caller rather than the file: an unreadable calendar has
  // already thrown by now, so silence here would be the ONE output a lane could misread as "the
  // check ran and found nothing" when it meant "the check never ran". Say it in words.
  if (!rows.length) {
    console.log(`No calendar entry on ${date} — nothing on that date to collide with.`);
    console.log("(A real answer, not an empty read: an unreadable calendar throws instead.)");
    return;
  }

  const idWidth = Math.max(...rows.map((e) => String(e.id).length));
  for (const e of rows) {
    const retired = e.supersededBy !== undefined;
    console.log(
      `${retired ? "✗" : "·"} ${String(e.id).padEnd(idWidth)}  ` +
        `${String(e.status).padEnd(9)}  ${String(e.impact).padEnd(8)}  ${e.title}` +
        (retired ? `  [RETIRED — superseded by ${e.supersededBy}]` : ""),
    );
  }

  const retired = rows.filter((e) => e.supersededBy !== undefined).length;
  console.log(
    `\n${rows.length} entr${rows.length === 1 ? "y" : "ies"} on ${date}` +
      (retired ? ` (${retired} retired)` : "") +
      ". If one of them is the release you are about to propose, it is already on the calendar —" +
      "\nfile nothing (see docs/process/EVENT-RESEARCH.md).",
  );
}

function main() {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(today)) throw new Error("event-scan: --today must be YYYY-MM-DD.");
  const tables = loadEvents();
  const cadence = loadCadence();
  const ledgers = loadLedgers();

  if (has("dump")) {
    process.stdout.write(
      `${JSON.stringify({ curated: tables.curated, derived: tables.derived }, null, 2)}\n`,
    );
    return;
  }
  if (has("validate")) {
    runValidate(tables, cadence, ledgers, FORWARD_TESTS_DIR);
    return;
  }
  // `has` as well as `arg` on purpose: a bare `--on-date 2026-09-16` (space, not `=`) would
  // otherwise fall through and print the whole report, which a lane would read as "nothing on that
  // date is flagged". A malformed value throws exactly as `--today` does.
  const onDate = arg("on-date");
  if (onDate !== undefined || has("on-date")) {
    if (!DATE_RE.test(onDate ?? "")) throw new Error("event-scan: --on-date must be YYYY-MM-DD.");
    printOnDate(tables, onDate);
    return;
  }

  assertHorizon(cadence);

  const rows = tables.all
    .map((e) => ({ e, ledger: ledgers.get(e.id), days: daysBetween(today, e.date) }))
    .map((r) => ({ ...r, verdict: assessmentDue(r.e, r.ledger, today, cadence) }))
    // A held close-out (#2988) has already passed, so `days >= 0` would hide it — and a hold that
    // is invisible is indistinguishable from an event the scanner forgot. Keep it on the report.
    .filter((r) => r.verdict.due || r.days >= 0 || r.verdict.reason === HELD)
    .sort((a, b) => compareEventOrder(a.e, b.e));

  if (has("due")) printDue(rows);
  else printReport(rows);
}

main();
