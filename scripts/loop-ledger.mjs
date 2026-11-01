#!/usr/bin/env node
// loop-ledger.mjs — the record every loop's iterations leave, and the rule a loop stops on
// (docs/process/LEARNING-LOOP.md, field 14).
//
//   npm run loop:ledger                       # each loop: baseline, latest, verdict, price per unit
//   npm run loop:ledger -- --json             # the same, for a script
//   npm run loop:ledger -- --add --loop <name> --baseline <n> --worth <n> [--aim up] --changed "how it was read"
//   npm run loop:ledger -- --add --loop <name> --after <n> --usd <$|unknown> --changed "what changed"
//        ... [--before <n>]     defaults to the last row's after
//        ... [--tokens-m <M|unknown>]   tokens in millions; an iteration names --usd, this, or both
//        ... [--date YYYY-MM-DD] [--ledger <dir>]
//
// WHY A COMMITTED FILE. Field 14 used to ask for a row on the owning issue's Log, and the study's
// correction (2026-11-01) repeated that. No row was ever written there, and two costs explain why it
// would not last: a row on an issue dies with the issue (16 of the 20 registry rows have a closed
// owning issue) and reading one costs a REST call per loop. A row in the checkout lands in the PR
// that did the work, diffs in review, and reads for free. The issue's Log keeps its one dated line.
//
// WHY ONE FILE PER LOOP, NOT ONE FILE. Every rep's PR appends a row, and two PRs appending to one file
// conflict on GitHub, whose server-side merge honours no merge attribute: 12 of 14 research PRs sat
// `dirty` that way, and #1449's fix was to split the file (the note in .gitattributes). Two PRs now
// conflict only when they iterate the same loop at once, and those two should see each other's number.
//
// THE STOP RULE. A loop's first row is its baseline and states `worth`, how far one iteration must
// move the number to have been worth running. Every later row is an iteration. A loop is `stopped`
// when its last two iterations each moved under `worth`, `closed` when a falling number reaches 0,
// and `running` otherwise. Stopped is a reading, not a state anyone stores: a row that moves its
// worth clears it. Two rows, not one, because a single small rep is often just a small target.
//
// The cost is self-reported and `unknown` is said out loud, stored as null, and never 0: a real 0 is
// a codemod's price, and the two must not read alike. Pure core + thin I/O shell, like loop-check.mjs.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { overdueLoops } from "./loop-list-decide.mjs";

const LEDGER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "loop-iterations");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A loop's name as its file and its rows carry it; a registry row's name gives the same slug. */
export const slugOf = (loop) =>
  String(loop)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** How far a row moved the number, read in the direction the baseline row says is good. */
export const moved = (first, row) =>
  first.aim === "up" ? row.after - row.before : row.before - row.after;

/** The verdict for one loop's rows in file order: `{ state, why }`. */
export function verdict(rows) {
  const [first, ...iterations] = rows;
  const latest = rows.at(-1);
  if (first.aim !== "up" && latest.after === 0) return { state: "closed", why: "number reached 0" };
  if (!iterations.length) return { state: "running", why: "no iteration yet" };
  const lastTwo = iterations.slice(-2).map((r) => moved(first, r));
  if (lastTwo.length === 2 && lastTwo.every((m) => m < first.worth)) {
    return {
      state: "stopped",
      why: `last two moved ${lastTwo.join(" and ")}, worth ${first.worth}`,
    };
  }
  return { state: "running", why: `last moved ${lastTwo.at(-1)}` };
}

const threeFigures = (n) => Number(n.toPrecision(3));

/** One currency's price: what the priced rows cost, over what those same rows moved. Null when the
 *  rows named no price or moved nothing; `spent` keeps a cost that bought no movement in view. */
function priceIn(first, rows, field) {
  const priced = rows.filter((r) => Number.isFinite(r[field]));
  const spent = priced.reduce((sum, r) => sum + r[field], 0);
  const units = priced.reduce((sum, r) => sum + moved(first, r), 0);
  return { perUnit: units > 0 ? threeFigures(spent / units) : null, spent };
}

/** Cost per unit moved, in dollars and in millions of tokens, each null when it cannot be said. */
export function pricePerUnit(rows) {
  const [first, ...iterations] = rows;
  const usd = priceIn(first, iterations, "usd");
  const tokens = priceIn(first, iterations, "tokensM");
  return {
    usdPerUnit: usd.perUnit,
    tokensMPerUnit: tokens.perUnit,
    spentUsd: usd.spent,
    spentTokensM: tokens.spent,
  };
}

/** Rows and the problems of one file's text. A file a person can read is still a file a script
 *  must not guess at, so a line it cannot parse is named, never skipped in silence. */
export function parseLedger(text, file) {
  const rows = [];
  const problems = [];
  String(text)
    .split("\n")
    .forEach((line, i) => {
      if (!line.trim()) return;
      try {
        const row = JSON.parse(line);
        if (!(Number.isFinite(row.before) && Number.isFinite(row.after))) {
          problems.push(`${file}:${i + 1} has no before and after numbers`);
          return;
        }
        const isBaseline = rows.length === 0;
        if (isBaseline && !Number.isFinite(row.worth)) {
          problems.push(`${file}:${i + 1} is the baseline and states no worth`);
        }
        rows.push(row);
      } catch {
        problems.push(`${file}:${i + 1} is not JSON`);
      }
    });
  return { rows, problems };
}

/** Every loop's rows, in file order per loop. Absent directory: no rows, and no problem. */
export function readLedger(dir = LEDGER_DIR) {
  if (!existsSync(dir)) return { rows: [], problems: [] };
  const rows = [];
  const problems = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".jsonl")) continue;
    const read = parseLedger(readFileSync(join(dir, name), "utf8"), name);
    rows.push(...read.rows);
    problems.push(...read.problems);
  }
  return { rows, problems };
}

/**
 * The registry's due checks with no iteration on record. Only a check dated after the ledger began
 * can owe a row: warning on all 20 existing registry rows measures nothing. The start is the earliest
 * row's date, which is the day of the ledger's first commit because the seed rows landed in it. It
 * is read from the rows and not from `git log` so this stays pure, and gives one answer in a shallow
 * checkout too, where `git log` would date the file to the checkout's own tip.
 */
export function unrecordedChecks({ today, registry, ledger }) {
  if (!ledger.length) return [];
  const start = ledger.map((r) => r.date).sort()[0];
  const recorded = new Set(ledger.map((r) => r.loop));
  return overdueLoops({ today, rows: registry }).filter(
    (r) => r.nextCheck > start && !recorded.has(slugOf(r.loop)),
  );
}

/** Each loop's reading, in a stable order. */
function summarize(rows) {
  const byLoop = new Map();
  for (const row of rows) byLoop.set(row.loop, [...(byLoop.get(row.loop) ?? []), row]);
  return [...byLoop].map(([loop, mine]) => ({
    loop,
    baseline: mine[0].before,
    latest: mine.at(-1).after,
    iterations: mine.length - 1,
    worth: mine[0].worth ?? null,
    verdict: verdict(mine),
    price: pricePerUnit(mine),
  }));
}

function priceText({ usdPerUnit, tokensMPerUnit, spentUsd, spentTokensM }) {
  const parts = [];
  if (usdPerUnit !== null) parts.push(`$${usdPerUnit} per unit`);
  else if (spentUsd > 0) parts.push(`$${spentUsd} spent, nothing moved`);
  if (tokensMPerUnit !== null) parts.push(`${tokensMPerUnit}M tokens per unit`);
  else if (spentTokensM > 0) parts.push(`${spentTokensM}M tokens spent, nothing moved`);
  return parts.length ? parts.join(", ") : "price unknown";
}

/** One printed line; a registry row naming `npm run loop:ledger` gets these in its posted check. */
const lineOf = (s) =>
  `${s.loop}: baseline ${s.baseline}, latest ${s.latest}, ${s.iterations} iteration${s.iterations === 1 ? "" : "s"}, ${s.verdict.state} (${s.verdict.why}), ${priceText(s.price)}`;

function refuse(message) {
  console.error(`✗ loop-ledger: ${message}`);
  process.exit(2);
}

const numberOf = (name, raw) => {
  const n = Number(raw);
  if (raw === undefined || raw.trim() === "" || !Number.isFinite(n)) {
    refuse(`--${name} must be a number, got "${raw}"`);
  }
  return n;
};

/** A cost flag's value: a number, or null for one the author says is unknown. */
const costOf = (name, raw) => (raw === undefined || raw === "unknown" ? null : numberOf(name, raw));

/** A loop's first row: the number it starts from and what an iteration must move to be worth it. */
function baselineRow(values, stamp) {
  if (values.worth === undefined) refuse("a baseline needs --worth: the stop rule reads it");
  // A mistyped aim left to fall through would read every good row of a climbing number as a loss.
  if (values.aim !== undefined && values.aim !== "up") refuse('--aim takes only "up"');
  const number = numberOf("baseline", values.baseline);
  return {
    ...stamp,
    before: number,
    after: number,
    worth: numberOf("worth", values.worth),
    ...(values.aim === "up" ? { aim: "up" } : {}),
    tokensM: null,
    usd: null,
    changed: values.changed,
  };
}

/** A later row. `--before` continues from the last row, the usual case and the one hard to mistype. */
function iterationRow(values, stamp, last) {
  if (values.usd === undefined && values["tokens-m"] === undefined) {
    refuse("an iteration names its cost: --usd or --tokens-m, a number or `unknown`");
  }
  return {
    ...stamp,
    before: values.before === undefined ? last.after : numberOf("before", values.before),
    after: numberOf("after", values.after),
    tokensM: costOf("tokens-m", values["tokens-m"]),
    usd: costOf("usd", values.usd),
    changed: values.changed,
  };
}

function add(values, dir) {
  const loop = slugOf(values.loop ?? "");
  if (!loop) refuse("--add needs --loop <name>");
  if (!values.changed) refuse('--add needs --changed "what changed"');
  const date = values.date ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(date)) refuse("--date must be YYYY-MM-DD");
  const file = join(dir, `${loop}.jsonl`);
  const existing = existsSync(file)
    ? parseLedger(readFileSync(file, "utf8"), `${loop}.jsonl`)
    : { rows: [], problems: [] };
  if (existing.problems.length) refuse(existing.problems.join("; "));
  const last = existing.rows.at(-1);
  const isBaseline = values.baseline !== undefined;
  if (isBaseline && last) refuse(`${loop} already has a baseline; add an iteration with --after`);
  if (!(isBaseline || last)) {
    refuse(`${loop} has no baseline; add one with --baseline <n> --worth <n> first`);
  }
  const stamp = { date, loop };
  const row = isBaseline ? baselineRow(values, stamp) : iterationRow(values, stamp, last);
  mkdirSync(dir, { recursive: true });
  appendFileSync(file, `${JSON.stringify(row)}\n`);
  console.log(JSON.stringify(row));
}

function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        add: { type: "boolean" },
        json: { type: "boolean" },
        ledger: { type: "string" },
        loop: { type: "string" },
        baseline: { type: "string" },
        worth: { type: "string" },
        aim: { type: "string" },
        before: { type: "string" },
        after: { type: "string" },
        usd: { type: "string" },
        "tokens-m": { type: "string" },
        changed: { type: "string" },
        date: { type: "string" },
      },
    });
  } catch (err) {
    refuse(err.message);
  }
  const { values } = parsed;
  const dir = values.ledger ?? LEDGER_DIR;
  if (values.add) return add(values, dir);
  const { rows, problems } = readLedger(dir);
  const loops = summarize(rows);
  if (values.json) console.log(JSON.stringify(loops, null, 2));
  else for (const s of loops) console.log(lineOf(s));
  if (problems.length) {
    for (const p of problems) console.error(`✗ loop-ledger: ${p}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
