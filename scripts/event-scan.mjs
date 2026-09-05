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
//   node scripts/event-scan.mjs --due         # JSON array of events due for assessment ([] = no-op)
//   node scripts/event-scan.mjs --validate    # enforce the contract (exit 1 on violation)
//   node scripts/event-scan.mjs --dump        # extracted tables as JSON (the drift gate's input)
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
import { compareEventOrder, DATE_RE, runValidate } from "./event-scan-validation.mjs";

const ROOT = process.cwd();

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const EVENTS_FILE = arg("events-file") ?? join(ROOT, "src", "domain", "market-events-data.ts");
const CALENDAR_FILE = arg("calendar-file") ?? join(ROOT, "src", "domain", "earnings-calendar.ts");
const CADENCE_FILE = arg("cadence-file") ?? join(ROOT, "assessment-cadence.json");
const LEDGER_DIR = arg("ledger-dir") ?? join(ROOT, "docs", "research", "events");

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

function loadEvents() {
  const curated = extractArray(
    EVENTS_FILE,
    "export const MARKET_EVENTS: readonly MarketEvent[] = [",
  );
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
  return { curated, derived, all: [...curated, ...derived] };
}

function loadCadence() {
  if (!existsSync(CADENCE_FILE))
    throw new Error(`event-scan: cannot read ${CADENCE_FILE} — refusing to guess.`);
  return JSON.parse(readFileSync(CADENCE_FILE, "utf8"));
}

/** The ledger's machine contract: docs/research/events/<id>.md with a `**Last assessed:**` line
 *  and (once closed out) an `## Outcome` section. */
function loadLedgers() {
  const ledgers = new Map();
  if (!existsSync(LEDGER_DIR)) return ledgers;
  for (const f of readdirSync(LEDGER_DIR)) {
    if (!f.endsWith(".md") || f === "TEMPLATE.md" || f === "README.md") continue;
    const text = readFileSync(join(LEDGER_DIR, f), "utf8");
    ledgers.set(basename(f, ".md"), {
      file: `docs/research/events/${f}`,
      lastAssessed: text.match(/^\*\*Last assessed:\*\*\s*(\S+)/m)?.[1] ?? null,
      hasOutcome: /^##\s+Outcome\b/m.test(text),
    });
  }
  return ledgers;
}

/** The adaptive-cadence decision for one event — the pure function at the system's core.
 *  Tested through the CLI (--due --today=… with fixture files), matching the handoff pattern. */
function assessmentDue(event, ledger, today, cadence) {
  const days = daysBetween(today, event.date);
  const none = { due: false, reason: null, intervalDays: null, nextDueDate: null };

  if (days < 0) {
    // Passed. One closing outcome assessment inside the close-out window, then silence forever.
    if (!ledger?.hasOutcome && -days <= cadence.closeOutWithinDays)
      return { due: true, reason: "event-passed-unscored", intervalDays: null, nextDueDate: today };
    return none;
  }

  if (!ledger?.lastAssessed)
    return { due: true, reason: "never-assessed", intervalDays: null, nextDueDate: today };

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
    }));
  process.stdout.write(`${JSON.stringify(due, null, 2)}\n`);
}

function printReport(rows) {
  if (!rows.length) {
    console.log("No upcoming events. Add one to src/domain/market-events-data.ts (or a print to");
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
    runValidate(tables, cadence, ledgers);
    return;
  }

  const rows = tables.all
    .map((e) => ({ e, ledger: ledgers.get(e.id), days: daysBetween(today, e.date) }))
    .map((r) => ({ ...r, verdict: assessmentDue(r.e, r.ledger, today, cadence) }))
    .filter((r) => r.verdict.due || r.days >= 0)
    .sort((a, b) => compareEventOrder(a.e, b.e));

  if (has("due")) printDue(rows);
  else printReport(rows);
}

main();
