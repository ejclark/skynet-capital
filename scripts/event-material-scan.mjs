#!/usr/bin/env node
// Event material-scan — the deterministic gate between "a pulse is due" (event-scan.mjs --due) and
// "spend a Claude research session on it" (.github/workflows/postmaster.yml build-events).
// docs/process/EVENT-RESEARCH.md documents the protocol; scripts/event-material-decide.mjs holds
// the pure decision logic this CLI/fetch shell drives. Issue: #724.
//
//   node scripts/event-material-scan.mjs <event-id> [--today=YYYY-MM-DD] [--apply]
//       # live check on one event: fetches price/VIX, prints the verdict as JSON.
//       # --apply writes the screen's ledger row + probe-ref block to disk on a "screen" verdict
//       #   (never on "material" — a full session writes its own row, same as today).
//       # exit 0 = screen, 1 = material, 2 = probe error (fetch/table/ledger failure).
//
//   node scripts/event-material-scan.mjs --screen-due [--today=YYYY-MM-DD]
//       # batch mode for the postmaster workflow: reads the due-events JSON array on stdin (the
//       # SAME shape `event-scan.mjs --due` emits, already filtered through dueForResearch), and
//       # for every `interval-elapsed` item either screens it (writing its ledger in place) or
//       # leaves it in the list. `never-assessed`/`event-passed-unscored` items pass through
//       # untouched — only interval-elapsed pulses are ever screened (docs/process/
//       # EVENT-RESEARCH.md's constraint). Prints {stillDue, screened} JSON to stdout; `stillDue`
//       # is exactly what still needs a session.
//
//   node scripts/event-material-scan.mjs --explain
//       # the spec entrypoint (house pattern, see deploy-lag.mjs / tests/scripts/*.spec.ts): takes
//       # the FULL decision state as JSON on stdin instead of touching the network or filesystem —
//       # {event, today, cadence, ledger, market, adjacentIds, ledgerText?}. Runs decide() and, on
//       # a "screen" verdict with `ledgerText` supplied, applyScreen() too, returning the updated
//       # text. Same exit-code convention as the live mode.
//
// LOUD-FAILURE DOCTRINE (event-scan.mjs's, inherited): a probe that can't fetch its data is an
// ERROR, never a quiet pulse — "broken != quiet" (issue #724). Every impure failure here — an
// unreadable table, an unreadable ledger, a failed fetch — throws, and every caller (this file's
// own CLI, and the workflow step around --screen-due) treats a probe failure exactly like a
// material verdict: dispatch the session.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyScreen,
  computeAdjacentIds,
  decide,
  parseLedgerHeader,
} from "./event-material-decide.mjs";

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
const UA = "skynet-capital event-material-scan (ejclark83@gmail.com)";

/** Same marker-string technique as event-scan.mjs, re-implemented here rather than imported —
 *  event-scan.mjs runs `main()` unconditionally at module scope (no CLI guard), so importing it
 *  would execute its own argv handling as a side effect. Kept behavior-identical on purpose; the
 *  drift gate for THAT extraction lives in tests/arch/event-scan.spec.ts and covers this file too,
 *  since both read the exact same marker lines out of the exact same table files. */
function extractArray(file, marker) {
  if (!existsSync(file)) throw new Error(`event-material-scan: cannot read ${file}.`);
  const source = readFileSync(file, "utf8");
  const at = source.indexOf(marker);
  if (at === -1) throw new Error(`event-material-scan: marker "${marker}" not found in ${file}.`);
  const open = at + marker.length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      // new Function is contained to checked-in, reviewed table literals — never remote input.
      if (depth === 0) return new Function(`return ${source.slice(open, i + 1)};`)();
    }
  }
  throw new Error(`event-material-scan: unbalanced brackets after "${marker}" in ${file}.`);
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
    date: p.date,
    impact: "critical",
    symbols: [p.symbol],
  }));
  return [...curated, ...derived];
}

function loadCadence() {
  if (!existsSync(CADENCE_FILE))
    throw new Error(`event-material-scan: cannot read ${CADENCE_FILE}.`);
  return JSON.parse(readFileSync(CADENCE_FILE, "utf8"));
}

/** Latest daily close for a Yahoo-recognized symbol ("^VIX" included). Throws loud on any HTTP or
 *  shape failure — never returns a stale or guessed price. */
async function latestClose(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    throw new Error(
      `event-material-scan: ${symbol} price fetch -> ${res.status} ${res.statusText}`,
    );
  }
  const body = await res.json();
  const closes = body.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null) return Math.round(closes[i] * 100) / 100;
  }
  throw new Error(`event-material-scan: no close price found for ${symbol}`);
}

/** Assemble the full decision state for one event id: the table row, its ledger header, live
 *  price/VIX readings, and the current adjacency list. `allEvents`/`cadence` are accepted as
 *  options so --screen-due loads the tables once for the whole batch instead of once per event. */
async function buildState(id, today, opts = {}) {
  const allEvents = opts.allEvents ?? loadEvents();
  const cadence = opts.cadence ?? loadCadence();
  const event = allEvents.find((e) => e.id === id);
  if (!event) throw new Error(`event-material-scan: unknown event id "${id}"`);
  const ledgerPath = join(LEDGER_DIR, `${id}.md`);
  if (!existsSync(ledgerPath)) throw new Error(`event-material-scan: cannot read ${ledgerPath}`);
  const ledgerText = readFileSync(ledgerPath, "utf8");
  const ledger = parseLedgerHeader(ledgerText);
  const symbols = event.symbols ?? [];
  const prices = await Promise.all(symbols.map((sym) => latestClose(sym)));
  const vix = await latestClose("^VIX");
  const adjacentIds = computeAdjacentIds(event, allEvents);
  const state = {
    event,
    today,
    cadence,
    ledger,
    market: { symbols: Object.fromEntries(symbols.map((s, i) => [s, prices[i]])), vix },
    adjacentIds,
  };
  return { state, ledgerPath, ledgerText };
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function runExplain() {
  const input = JSON.parse(readStdin() || "{}");
  const decision = decide(input);
  const out = {
    verdict: decision.verdict,
    reasons: decision.reasons,
    readings: decision.readings,
    intervalDays: decision.intervalDays,
    daysOut: decision.daysOut,
  };
  if (decision.verdict === "screen" && typeof input.ledgerText === "string") {
    out.ledgerText = applyScreen(input.ledgerText, input, decision);
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(decision.verdict === "screen" ? 0 : 1);
}

async function runSingle(id) {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  const { state, ledgerPath, ledgerText } = await buildState(id, today);
  const decision = decide(state);
  if (decision.verdict === "screen" && has("apply")) {
    writeFileSync(ledgerPath, applyScreen(ledgerText, state, decision));
  }
  console.log(JSON.stringify({ id, ...decision }, null, 2));
  process.exit(decision.verdict === "screen" ? 0 : 1);
}

async function runScreenDue() {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  const due = JSON.parse(readStdin() || "[]");
  const allEvents = loadEvents();
  const cadence = loadCadence();
  const stillDue = [];
  const screened = [];
  for (const item of due) {
    if (item.reason !== "interval-elapsed") {
      stillDue.push(item);
      continue;
    }
    try {
      const { state, ledgerPath, ledgerText } = await buildState(item.id, today, {
        allEvents,
        cadence,
      });
      const decision = decide(state);
      if (decision.verdict === "screen") {
        writeFileSync(ledgerPath, applyScreen(ledgerText, state, decision));
        screened.push({ id: item.id, reasons: decision.reasons });
      } else {
        stillDue.push({ ...item, materialReasons: decision.reasons });
      }
    } catch (err) {
      console.error(`event-material-scan: probe failed for ${item.id} — ${err.message}`);
      stillDue.push({ ...item, materialReasons: [`probe-error:${err.message}`] });
    }
  }
  console.log(JSON.stringify({ stillDue, screened }, null, 2));
}

async function main() {
  if (has("explain")) {
    runExplain();
    return;
  }
  if (has("screen-due")) {
    await runScreenDue();
    return;
  }
  const id = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined;
  if (!id) {
    console.error("usage: event-material-scan.mjs <event-id> [--today=YYYY-MM-DD] [--apply]");
    console.error(
      "       event-material-scan.mjs --screen-due [--today=YYYY-MM-DD]   (stdin: JSON array)",
    );
    console.error(
      "       event-material-scan.mjs --explain                            (stdin: JSON state)",
    );
    process.exit(2);
    return;
  }
  await runSingle(id);
}

if (process.argv[1]?.endsWith("event-material-scan.mjs")) {
  main().catch((err) => {
    console.error(`event-material-scan: ${err.message}`);
    console.log(JSON.stringify({ verdict: "error", reasons: ["probe-error"], error: err.message }));
    process.exit(2);
  });
}
