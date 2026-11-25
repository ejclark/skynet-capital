#!/usr/bin/env node
// REST WATCH — read #8289's falsifier from the allowance itself, not by hand (#8289 slice 2).
//
//   npm run rest:watch                          # one sample, appended to the log
//   npm run rest:watch -- watch --for 115       # a sample a minute, for 115 minutes
//   npm run rest:watch -- verdict [--json]      # the falsifier, read from the log
//
// WHY. #8289's falsifier: "wrong if, in the first surge hour after slice 1 merges, REST still
// reaches 0 before minute 45 of its window." Eight cuts later (#8470–#8504) every scripted reader
// is under about 80 calls a run, and every build comment since #8473 ends the same way: the
// falsifier "needs one surge hour read from a session holding the personal token". Nobody was
// scheduled to take that reading, and the build lane cannot: its `rate_limit` is the Moneypenny
// App's own bucket (#6319), which is how the 2026-11-24 07:37Z "0 left" reading was misread as
// the personal one. The surge orchestrator is a session holding the personal token (a cloud
// session's `gh` goes out with the real credential through the GitHub proxy), so `/surge` starts
// this watcher with the dial and quotes the verdict in each check-in.
//
// COST. `GET /rate_limit` does not count against the REST allowance (GitHub's REST rate-limit
// docs: "Accessing this endpoint does not count against your REST API rate limit"). Whose bucket
// a sample reads is told by `GET /user` once per process: an App installation token answers 403
// "Resource not accessible by integration". That is one call per watch, not one per sample.
//
// THE WINDOW. A REST window lasts an hour from its first call, and every sample in it carries the
// same `reset`; the window opened at `reset - 3600`. The falsifier asks, per window, at which
// minute `remaining` first read 0. Sampling is a minute apart, so a window that ran dry between
// samples is caught at the next one, never earlier: the verdict errs toward "held" by at most a
// minute, and says how many minutes of the window it actually saw.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { isMain } from "./is-main.mjs";

export const WINDOW_SECONDS = 3600;
/** The falsifier's line: REST empty before this minute of its window means the cuts did not hold. */
export const FALSIFIER_MINUTE = 45;
const DEFAULT_LOG = join(tmpdir(), "rest-watch.jsonl");

/**
 * Pure: one log line from a `gh api rate_limit` answer and whose bucket it is.
 * @param {any} rateLimit the parsed `/rate_limit` body
 * @param {"user" | "app" | "unknown"} bucket
 * @param {Date} [now]
 */
export function toSample(rateLimit, bucket, now = new Date()) {
  const pick = (r) =>
    r ? { limit: r.limit, used: r.used, remaining: r.remaining, reset: r.reset } : null;
  return {
    at: now.toISOString(),
    bucket,
    core: pick(rateLimit?.resources?.core ?? rateLimit?.rate),
    graphql: pick(rateLimit?.resources?.graphql),
  };
}

/** Pure: which bucket a `gh api user` result names. 403 "by integration" is an App token. */
export function bucketOf({ status, stdout = "", stderr = "" }) {
  if (status === 0 && /"login"\s*:/.test(stdout)) return "user";
  if (/not accessible by integration/i.test(`${stdout}\n${stderr}`)) return "app";
  return "unknown";
}

/**
 * Pure: the falsifier, read window by window.
 *
 * A window is `wrong` when REST first read 0 before FALSIFIER_MINUTE; `held` when it read 0 only
 * at or after that minute, or never did and a sample at or after it shows so; `unread` when no
 * sample reached that minute and none read 0 (the log cannot tell). Only the `bucket` asked for
 * counts (the personal one by default): the App's bucket is not the allowance #8289 measures.
 *
 * @param {ReturnType<typeof toSample>[]} samples
 * @param {{ bucket?: string }} [opts]
 */
export function judge(samples, { bucket = "user" } = {}) {
  const byReset = new Map();
  let otherBuckets = 0;
  for (const s of samples) {
    if (!s?.core || typeof s.core.reset !== "number") continue;
    if (bucket !== "any" && s.bucket !== bucket) {
      otherBuckets += 1;
      continue;
    }
    const list = byReset.get(s.core.reset) ?? [];
    list.push(s);
    byReset.set(s.core.reset, list);
  }
  const windows = [...byReset.entries()]
    .sort(([a], [b]) => a - b)
    .map(([reset, list]) => {
      const opened = reset - WINDOW_SECONDS;
      const minuteOf = (s) => Math.max(0, (Date.parse(s.at) / 1000 - opened) / 60);
      const sorted = [...list].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      const empty = sorted.find((s) => s.core.remaining === 0);
      const firstMinute = minuteOf(sorted[0]);
      const lastMinute = minuteOf(sorted[sorted.length - 1]);
      const emptyMinute = empty ? minuteOf(empty) : null;
      let verdict;
      if (emptyMinute !== null) verdict = emptyMinute < FALSIFIER_MINUTE ? "wrong" : "held";
      else verdict = lastMinute >= FALSIFIER_MINUTE ? "held" : "unread";
      return {
        opened: new Date(opened * 1000).toISOString(),
        reset: new Date(reset * 1000).toISOString(),
        samples: sorted.length,
        seen: [round(firstMinute), round(lastMinute)],
        peakUsed: Math.max(...sorted.map((s) => s.core.used ?? 0)),
        emptyAt: emptyMinute === null ? null : round(emptyMinute),
        verdict,
      };
    });
  let verdict = "unread";
  if (windows.some((w) => w.verdict === "wrong")) verdict = "wrong";
  else if (windows.some((w) => w.verdict === "held")) verdict = "held";
  return { verdict, bucket, windows, otherBuckets };
}

const round = (n) => Math.round(n * 10) / 10;

/** Pure: the verdict as a few lines, the first of which a check-in can quote alone. */
export function formatVerdict({ verdict, bucket, windows, otherBuckets }) {
  const wrong = windows.filter((w) => w.verdict === "wrong");
  const held = windows.filter((w) => w.verdict === "held");
  const head = {
    wrong: `#8289 falsifier: WRONG — REST read 0 at minute ${wrong[0]?.emptyAt} of the window opened ${wrong[0]?.opened} (line: ${FALSIFIER_MINUTE}).`,
    held: `#8289 falsifier: held — ${held.length} window(s) read past minute ${FALSIFIER_MINUTE} with REST left (${bucket} bucket).`,
    unread: `#8289 falsifier: not read yet — no ${bucket}-bucket window was sampled to minute ${FALSIFIER_MINUTE}.`,
  }[verdict];
  const lines = [head];
  for (const w of windows) {
    lines.push(
      `  ${w.opened} → ${w.reset}  ${w.verdict.padEnd(6)} peak used ${w.peakUsed}` +
        `  empty at ${w.emptyAt ?? "—"}  seen min ${w.seen[0]}–${w.seen[1]} (${w.samples} samples)`,
    );
  }
  if (otherBuckets > 0) {
    lines.push(
      `  ${otherBuckets} sample(s) from another bucket left out (an App token reads its own, #6319).`,
    );
  }
  return lines.join("\n");
}

/** Parse a JSONL log into samples, skipping lines that are not JSON. */
export function readLog(text) {
  const out = [];
  for (const line of String(text).split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // a half-written line from a killed watcher is not a sample
    }
  }
  return out;
}

function ghJson(args) {
  const gh = process.env.GH_BIN || "gh";
  return spawnSync(gh, args, { encoding: "utf8" });
}

function readBucket() {
  const r = ghJson(["api", "user"]);
  return bucketOf({ status: r.status, stdout: r.stdout, stderr: r.stderr });
}

function takeSample(log, bucket) {
  const r = ghJson(["api", "rate_limit"]);
  if (r.status !== 0) {
    console.error(`rest-watch: gh api rate_limit failed: ${(r.stderr || r.stdout).trim()}`);
    return null;
  }
  const sample = toSample(JSON.parse(r.stdout), bucket);
  mkdirSync(dirname(log), { recursive: true });
  appendFileSync(log, `${JSON.stringify(sample)}\n`);
  return sample;
}

function parseArgs(argv) {
  const opts = { mode: "sample", log: process.env.REST_WATCH_LOG || DEFAULT_LOG };
  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith("-")) opts.mode = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--log") opts.log = rest[++i];
    else if (a === "--every") opts.every = Number(rest[++i]);
    else if (a === "--for") opts.for = Number(rest[++i]);
    else if (a === "--bucket") opts.bucket = rest[++i];
    else if (a === "--json") opts.json = true;
    else opts.unknown = a;
  }
  return opts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main(argv) {
  const opts = parseArgs(argv);
  const usage =
    "usage: npm run rest:watch -- [sample | watch [--every <s>] [--for <min>] | verdict [--json] [--bucket user|app|any]] [--log <file>]";
  if (opts.unknown) {
    console.error(`rest-watch: unknown argument ${opts.unknown}\n${usage}`);
    return 2;
  }
  if (opts.mode === "verdict") {
    const samples = existsSync(opts.log) ? readLog(readFileSync(opts.log, "utf8")) : [];
    const result = judge(samples, { bucket: opts.bucket ?? "user" });
    if (opts.json) console.log(JSON.stringify(result, null, 2));
    else console.log(formatVerdict(result));
    // 0 held · 1 wrong · 3 not read yet (2 is a usage error, as in every script here).
    return { held: 0, wrong: 1, unread: 3 }[result.verdict];
  }
  if (opts.mode !== "sample" && opts.mode !== "watch") {
    console.error(usage);
    return 2;
  }
  const bucket = readBucket();
  if (bucket !== "user") {
    console.error(
      `rest-watch: this token reads the ${bucket} bucket, not the personal allowance #8289 measures; samples are logged but the verdict leaves them out.`,
    );
  }
  if (opts.mode === "sample") {
    const s = takeSample(opts.log, bucket);
    if (!s) return 1;
    console.log(
      `${s.at}  ${bucket}  REST ${s.core.remaining}/${s.core.limit} left, resets ${new Date(s.core.reset * 1000).toISOString()}  →  ${opts.log}`,
    );
    return 0;
  }
  const everyMs = Math.max(10, opts.every ?? 60) * 1000;
  const until = Date.now() + Math.max(1, opts.for ?? 115) * 60_000;
  console.error(`rest-watch: sampling every ${everyMs / 1000}s → ${opts.log}`);
  while (Date.now() < until) {
    takeSample(opts.log, bucket);
    await sleep(Math.min(everyMs, Math.max(0, until - Date.now())));
  }
  return 0;
}

if (isMain(import.meta.url)) process.exit(await main(process.argv.slice(2)));
