#!/usr/bin/env node
// DOES THE DIAL MOVE BURN? (#6470)
//
//   node scripts/dial-spend.mjs --since 2026-10-12 --until 2026-11-01 [--max-calls 250] [--json]
//
// The test the design panel's plan dropped, and the premise under any rule that moves the dial: for
// each position, dollars per hour and legs per hour, by lane, from #4153's label events and each
// lane's own job logs. Read-only. It also prints the two numbers that explain the answer, runs per
// hour and legs per run: spend per hour is their product times the price of a leg, and the dial's
// caps touch only legs per run.
//
// WHAT THE NUMBERS ARE. Dollars are the CLI's imputed `total_cost_usd`, a usage proxy on a flat-fee
// plan and never a charge. A window is the time a label sat on #4153, which is what the lanes read
// (an expired end date is not modelled). A leg counts in the position its job STARTED in.
//
// WHAT THEY CANNOT SHOW. This is an observational split, not an experiment: nobody randomised the
// dial, the backlog and the merge rate differ between windows, and he usually moves the dial BECAUSE
// of how the week is going. Only moneypenny-events.yml's three session lanes are read; local and cloud
// sessions, repair, dep-warden and the claude.yml lane are not, and nothing here says how large those
// are. A row that says "at least" had runs the REST budget did not reach, or a leg whose log carried
// no price (a session cut off before its cost was written); the notes under the table count both.
//
// ITS COST. One paged run list per day and event (a busy day's `issues` list is two or three pages,
// counted as one call here, so the printed count is a floor), then one log download per run long
// enough to hold a session. A run's zip holds every job, so one call prices all its legs; the jobs endpoint
// would take two calls and a per-job download for the same numbers, which is why the local cache is
// keyed by run id rather than job id. The cache holds only lane, start time and price, never a log.
// A run already in the cache costs nothing, so a second reading of the same span costs nothing but
// the listing of today.
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { isMain } from "./is-main.mjs";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const LIST_SETTLE_MS = 6 * HOUR_MS;
const DIAL_PREFIX = "work-mode:";
const TRACKING_ISSUE = 4153;
const WORKFLOW = "moneypenny-events.yml";

/** Job-name prefix → the lane the dial throttles. A job not listed here holds no priced session. */
const LANES = [
  [/^\d*_?research due events/, "research"],
  [/^\d*_?build feedback issue/, "feedback"],
  [/^\d*_?build plan issue/, "plan"],
];

/** Seconds below which a run cannot hold a session, by event. A dispatch run's route alone takes
 *  about a minute and a half, and the cheapest research leg on record (a $0.31 one, 2026-11-01) took
 *  53 seconds on top of that. An `issues` or `issue_comment` run with no build ends in under a minute,
 *  and on the six days read for this bar nothing of those events sits between 2 and 3 minutes. */
const MIN_RUN_SECONDS = { workflow_dispatch: 150, issues: 180, issue_comment: 180 };

/**
 * Pure: the spans each dial label sat on the issue, oldest first, clipped to `[since, until)`.
 * Only a `labeled` event opens or closes a span, since a tap's two events land in one second and
 * the `unlabeled` half says nothing the next `labeled` does not.
 */
export function dialWindows(events, { since = 0, until }) {
  const labeled = events
    .filter((e) => e.event === "labeled" && e.label?.startsWith(DIAL_PREFIX))
    .map((e) => ({ position: e.label.slice(DIAL_PREFIX.length), from: Date.parse(e.at) }))
    .sort((a, b) => a.from - b.from);
  return labeled
    .map((w, i) => ({ ...w, to: labeled[i + 1]?.from ?? until }))
    .map((w) => ({ ...w, from: Math.max(w.from, since), to: Math.min(w.to, until) }))
    .filter((w) => w.to > w.from);
}

/** The last numeric `total_cost_usd` in a log, else its cost notice, else null. The workflow echoes
 *  its own script into the log, so the pattern insists on a number right after the name. */
function priceOf(text) {
  const envelope = [...text.matchAll(/"total_cost_usd": ([\d.]+)/g)].at(-1)?.[1];
  const notice = /##\[notice\]cost — event=\S+ usd=([\d.]+)/.exec(text)?.[1];
  const price = envelope ?? notice;
  return price === undefined ? null : Number(price);
}

/** Pure: one job's log as a leg, or null when the job holds no session. */
export function legFromLog(fileName, text, run) {
  const lane = LANES.find(([pattern]) => pattern.test(fileName))?.[1];
  if (!lane) return null;
  const first = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/.exec(text)?.[1];
  if (!first) return null; // an empty log says neither when nor how much
  return { lane, at: new Date(Date.parse(first)).toISOString(), usd: priceOf(text), run };
}

const inWindow = (w, at) => at >= w.from && at < w.to;

/** Pure: one row per position and lane, so a lane that spent nothing reads $0.00 rather than being
 *  absent, which is what a reading that never reached it would look like. `unread` are runs the
 *  budget did not reach. */
export function summarize(legs, windows, { unread = [] } = {}) {
  const hoursOf = {};
  for (const w of windows)
    hoursOf[w.position] = (hoursOf[w.position] ?? 0) + (w.to - w.from) / HOUR_MS;
  const positionOf = (iso) => windows.find((w) => inWindow(w, Date.parse(iso)))?.position;

  const rows = new Map();
  for (const position of Object.keys(hoursOf))
    for (const [, lane] of LANES)
      rows.set(`${position}|${lane}`, {
        position,
        lane,
        legs: 0,
        usd: 0,
        unpriced: 0,
        runIds: new Set(),
      });
  for (const leg of legs) {
    const row = rows.get(`${positionOf(leg.at)}|${leg.lane}`);
    if (!row) continue;
    row.runIds.add(leg.run);
    row.legs += 1;
    if (leg.usd === null) row.unpriced += 1;
    else row.usd += leg.usd;
  }
  const unreadOf = {};
  for (const u of unread) {
    const position = positionOf(u.at);
    if (position) unreadOf[position] = (unreadOf[position] ?? 0) + 1;
  }
  return [...rows.values()].map(({ runIds, ...row }) => {
    const hours = hoursOf[row.position];
    return {
      ...row,
      hours,
      runs: runIds.size,
      usdPerHour: row.usd / hours,
      legsPerHour: row.legs / hours,
      legsPerRun: runIds.size > 0 ? row.legs / runIds.size : 0,
      usdPerLeg: row.legs > row.unpriced ? row.usd / (row.legs - row.unpriced) : null,
      unreadRuns: unreadOf[row.position] ?? 0,
    };
  });
}

const money = (n) => `$${n.toFixed(2)}`;

/** The table for a person. A row with unread runs, or with a leg that carried no price, says its
 *  dollars are a floor: neither adds to `usd`, so an exact figure there would read cheaper than the
 *  position ran (#6693). The notes under the table say how many of each. */
export function renderTable(rows) {
  const order = ["halt", "conserve", "normal", "surge"];
  const sorted = [...rows].sort(
    (a, b) => order.indexOf(a.position) - order.indexOf(b.position) || (a.lane < b.lane ? -1 : 1),
  );
  const lines = [
    "| Position | Lane | Hours | Runs per hour | Legs per run | Legs per hour | Dollars per leg | Dollars per hour |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of sorted) {
    const floor = r.unreadRuns > 0 || r.unpriced > 0 ? "at least " : "";
    const leg = r.usdPerLeg === null ? "no price" : money(r.usdPerLeg);
    lines.push(
      `| ${r.position} | ${r.lane} | ${r.hours.toFixed(0)} | ${(r.runs / r.hours).toFixed(2)} | ${r.legsPerRun.toFixed(1)} | ${r.legsPerHour.toFixed(2)} | ${leg} | ${floor}${money(r.usdPerHour)} |`,
    );
  }
  const unread = sorted.filter((r) => r.unreadRuns > 0);
  if (unread.length > 0) {
    const counts = [...new Map(unread.map((r) => [r.position, r.unreadRuns]))];
    lines.push(
      "",
      `Unread runs: ${counts.map(([p, n]) => `${p} ${n}`).join(", ")}. Those rows are floors.`,
    );
  }
  // Unpriced legs are counted per row, not per position: the leg was read, so its lane is known.
  const unpriced = sorted.filter((r) => r.unpriced > 0);
  if (unpriced.length > 0) {
    if (unread.length === 0) lines.push("");
    lines.push(
      `Legs with no price: ${unpriced.map((r) => `${r.position} ${r.lane} ${r.unpriced}`).join(", ")}. Those rows are floors.`,
    );
  }
  return lines.join("\n");
}

/** Real `gh` by default. Raw bytes, because one of its answers is a zip. */
function defaultExec(cmd, args) {
  return execFileSync(cmd, args, { maxBuffer: 1 << 30 });
}

/** An archive with nothing in it. A run cancelled while queued comes back as exactly this: no jobs,
 *  no logs, no spend, though its queue time can look long (7 of 7 sampled, 2026-11-01). */
const EMPTY_ZIP_BYTES = 22;

/** The job logs at the top of a run's zip, as `{ name, text }`. */
function defaultUnzip(zipBytes) {
  if (zipBytes.length <= EMPTY_ZIP_BYTES) return [];
  const dir = mkdtempSync(join(tmpdir(), "dial-spend-zip-"));
  try {
    const zip = join(dir, "r.zip");
    writeFileSync(zip, zipBytes);
    const out = join(dir, "x");
    const done = spawnSync("unzip", ["-q", "-o", zip, "-d", out]);
    if (done.status !== 0) throw new Error("the log archive would not unpack");
    return readdirSync(out)
      .filter((name) => name.endsWith(".txt"))
      .map((name) => ({ name, text: readFileSync(join(out, name), "latin1") }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const jsonLines = (out) =>
  String(out)
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

const longEnough = (run, event) =>
  (Date.parse(run.updated_at) - Date.parse(run.run_started_at)) / 1000 >= MIN_RUN_SECONDS[event];

/**
 * Impure, with `exec`, `unzip` and the clock injected: the legs in `[since, until)`, from the cache
 * where it can and from GitHub up to `maxCalls`. What the budget did not reach comes back in
 * `unread`, never as a smaller total.
 */
export function readLegs({
  since,
  until,
  cacheDir,
  maxCalls,
  exec = defaultExec,
  unzip = defaultUnzip,
  now = Date.now(),
}) {
  mkdirSync(cacheDir, { recursive: true });
  let calls = 0;
  const unread = [];
  const legs = [];

  const listRuns = (day, event) => {
    const file = join(cacheDir, `runs-${event}-${day}.json`);
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    if (calls >= maxCalls) return null;
    calls += 1;
    const query = `event=${event}&created=${day}&per_page=100`;
    // One object per line across every page: `--paginate` prints each page's own answer.
    const jq = ".workflow_runs[] | {id, run_started_at, updated_at, event}";
    const path = `repos/{owner}/{repo}/actions/workflows/${WORKFLOW}/runs?${query}`;
    const runs = jsonLines(exec("gh", ["api", "--paginate", path, "--jq", jq]));
    // Only a day well finished is kept: a run in flight across midnight lists with a short duration,
    // and a cached short duration would hide its session from every later reading.
    if (dayOf(now - LIST_SETTLE_MS) > day) writeFileSync(file, JSON.stringify(runs));
    return runs;
  };

  const readRun = (run) => {
    const file = join(cacheDir, `legs-${run.id}.json`);
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    if (calls >= maxCalls) return null;
    calls += 1;
    let found = [];
    try {
      const zip = exec("gh", ["api", `repos/{owner}/{repo}/actions/runs/${run.id}/logs`]);
      found = unzip(zip)
        .map((f) => legFromLog(f.name, f.text, run.id))
        .filter(Boolean);
    } catch {
      // Logs age out, and a read that fails says nothing about what the run spent: report it unread.
      return null;
    }
    writeFileSync(file, JSON.stringify(found));
    return found;
  };

  const inSpan = (run) => {
    const started = Date.parse(run.run_started_at);
    return started >= since && started < until;
  };
  // Every day's list first, so a budget that runs out says how many runs it left, not just days.
  const candidates = [];
  for (let day = Date.parse(dayOf(since)); day < until; day += DAY_MS) {
    for (const event of Object.keys(MIN_RUN_SECONDS)) {
      const name = dayOf(day);
      const runs = listRuns(name, event);
      if (runs === null) unread.push({ at: `${name}T12:00:00Z`, day: name, event });
      else candidates.push(...runs.filter((run) => longEnough(run, event) && inSpan(run)));
    }
  }
  for (const run of candidates) {
    const found = readRun(run);
    if (found === null) unread.push({ at: run.run_started_at, run: run.id });
    else legs.push(...found);
  }
  return {
    legs: legs.filter((l) => Date.parse(l.at) >= since && Date.parse(l.at) < until),
    unread,
    calls,
  };
}

/** The dial's label events, oldest first. */
function readEvents(exec = defaultExec) {
  const jq =
    '.[] | select(.event == "labeled" or .event == "unlabeled") | {event, label: .label.name, at: .created_at}';
  const out = exec("gh", [
    "api",
    "--paginate",
    `repos/{owner}/{repo}/issues/${TRACKING_ISSUE}/events?per_page=100`,
    "--jq",
    jq,
  ]);
  return jsonLines(out);
}

const flagValue = (argv, flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

function main(argv) {
  const since = Date.parse(flagValue(argv, "--since") ?? "");
  if (Number.isNaN(since)) {
    console.error("usage: dial-spend.mjs --since YYYY-MM-DD [--until YYYY-MM-DD] [--max-calls N]");
    process.exit(2);
  }
  const untilFlag = flagValue(argv, "--until");
  const until = untilFlag ? Date.parse(untilFlag) : Date.now();
  const maxCalls = Number(flagValue(argv, "--max-calls") ?? 250);
  // A NaN here would read as an empty span or, worse, as no REST budget at all.
  if (Number.isNaN(until) || !(maxCalls >= 0)) {
    console.error("dial-spend.mjs: --until must be a date and --max-calls a number");
    process.exit(2);
  }
  const cacheDir =
    flagValue(argv, "--cache") ??
    process.env.DIAL_SPEND_CACHE ??
    join(homedir(), ".cache", "skynet-dial-spend");

  const events = readEvents();
  const windows = dialWindows(events, { since, until });
  const { legs, unread, calls } = readLegs({ since, until, cacheDir, maxCalls });
  const rows = summarize(legs, windows, { unread });
  if (argv.includes("--json")) {
    console.log(JSON.stringify({ rows, windows, unread: unread.length, calls }, null, 2));
    return;
  }
  console.log(renderTable(rows));
  console.log(
    `\n${legs.length} legs read, ${unread.length} runs or days unread, ${calls} REST calls (and one for the label events).`,
  );
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
