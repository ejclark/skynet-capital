#!/usr/bin/env node
// THRASH SCAN — repetition with no state change, read from GitHub's own data (#3939 slice 1).
//
// #3939 measured the backlog before building this: people barely thrash (1 of 1,115 issues flipped
// status twice), machines do (#3719–#3724 took 24–78 identical "Failed again" comments each; 398
// `[event-research]` filings landed on 2026-09-09 and nobody saw the burst for four days). So the
// signals below are aimed at machine-made repetition, and every one of them requires NO STATE
// CHANGE — same key, same outcome, again. Repetition alone is not thrash: 217 `research/*` branches
// carry several merged PRs each, and that is the intended d-30 → d-4 pulse cadence, not a storm.
// That is why no signal here keys on branches or PR counts (the negative control in the spec).
//
//   node scripts/thrash-scan.mjs                   # human report (digest-paste-ready)
//   node scripts/thrash-scan.mjs --json            # machine shape (for /secretary, slice 2)
//   ... --since=YYYY-MM-DD                         # window start (default: 30 days before --today)
//   ... --today=YYYY-MM-DD                         # deterministic "now" (window end, exclusive+1d)
//   ... --explain                                  # state as JSON on stdin instead of GitHub (specs)
//   node scripts/thrash-scan.mjs --digest          # digest lines + snapshot marker (slice 2)
//   ... --digest --file                            # …and file the two-scan repeats as `bottleneck`
//   ... --prev=<digest.md>|none                    # previous scan (default: newest committed digest)
//
// SIGNALS (#3939's table; T6 from the OWNER comment of 2026-09-29):
//   T1  same author, ≥5 near-identical comments on one issue/PR
//   T2  an issue opens with the same title key as one opened in the previous 14 days
//   T3  one lane's issue filings in a day > 5× its trailing 7-day median (and ≥ BURST_FLOOR)
//   T4  one status label added/removed ≥3× on one issue
//   T5  a revert of a PR merged < 7 days earlier
//   T6  a plan re-plans a surface an earlier plan (≤30 days) already planned, without citing it
//
// ADVISORY ONLY — never a gate (COACHES.md: a gate is a momentum breaker unless it protects a
// constraint). No schedule of its own: /secretary runs it when a digest is due.
// Loud-failure doctrine: an unreadable GitHub response is an error (exit 1), never a silent zero.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { digestFiles } from "./digest-scan.mjs";
import { lintIssue } from "./issue-lint.mjs";
import { ghRest, ghRestAll, sh } from "./moneypenny/gh.mjs";
import {
  alreadyFiled,
  bottleneckIssue,
  digestLines,
  filingUnits,
  MAX_FILES_PER_RUN,
  parseSnapshot,
  repeatUnits,
  snapshotMarker,
} from "./thrash/digest.mjs";
import { addDays, renderReport, scan, summarize, T3_BASELINE_DAYS } from "./thrash/signals.mjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 30;

// ── Impure: GitHub over the core REST bucket (ghRest's header explains why never GraphQL) ──────

const refsOf = (body) => [
  ...new Set((String(body ?? "").match(/#\d+/g) ?? []).map((r) => Number(r.slice(1)))),
];

const labelNames = (ls = []) => ls.map((l) => (typeof l === "string" ? l : l.name));

export function gatherState(since) {
  // T3's baseline reaches T3_BASELINE_DAYS behind the window; `since=` filters on updated_at, which
  // is always ≥ created_at, so this reads every issue created from the baseline start onward.
  const from = `${addDays(since, -T3_BASELINE_DAYS)}T00:00:00Z`;
  const raw = ghRestAll(`issues?state=all&since=${from}&sort=created&direction=asc`, {
    maxPages: 80,
  });
  const issues = raw.map((i) => ({
    number: i.number,
    title: i.title,
    // A PR keeps only the `#N`s its body cites (T5's revert resolution); an issue keeps its body
    // (T6 reads the Surface cell). Whole PR bodies would triple the capture for nothing.
    body: i.pull_request ? undefined : i.body,
    refs: i.pull_request ? refsOf(i.body) : undefined,
    labels: labelNames(i.labels),
    createdAt: i.created_at,
    isPr: Boolean(i.pull_request),
    mergedAt: i.pull_request?.merged_at ?? null,
  }));
  const comments = ghRestAll(
    `issues/comments?since=${since}T00:00:00Z&sort=created&direction=asc`,
    {
      maxPages: 150,
    },
  ).map((c) => ({
    issue: Number(c.issue_url.split("/").pop()),
    author: c.user?.login,
    body: c.body,
    createdAt: c.created_at,
  }));
  return { issues, comments, events: gatherEvents(since) };
}

/** Repo-wide issue events are newest-first with no `since`; page until one reaches before the
 *  window. Running out of pages first is a truncated answer — thrown, never returned. */
function gatherEvents(since) {
  const stop = Date.parse(`${since}T00:00:00Z`);
  const events = [];
  for (let page = 1; page <= 400; page++) {
    const batch = ghRest(`issues/events?per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("thrash-scan: issues/events did not return a list.");
    for (const e of batch) {
      if (e.event === "labeled" || e.event === "unlabeled") {
        events.push({
          issue: e.issue?.number,
          event: e.event,
          label: e.label?.name,
          createdAt: e.created_at,
        });
      }
    }
    if (batch.length && Date.parse(batch.at(-1).created_at) < stop) return events;
    if (batch.length < 100) {
      throw new Error(
        `thrash-scan: issues/events ran out at page ${page} before reaching ${since} — T4 would be ` +
          "a truncated answer, not a clean one.",
      );
    }
  }
  throw new Error("thrash-scan: issues/events still newer than the window after 400 pages.");
}

/** A revert's `#N` outside the window. `issues/N`, not `pulls/N`: the ref is often an issue, and
 *  `pulls/N` on an issue is a 404 that `ghRest` (rightly) throws on. */
function lookupPr(number) {
  const i = ghRest(`issues/${number}`);
  return i?.pull_request
    ? { number, title: i.title, mergedAt: i.pull_request.merged_at, refs: refsOf(i.body) }
    : undefined;
}

/** `--explain`: stdin IS the input, so an unreadable stream is UNKNOWN, never zero hits. */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch (err) {
    console.error(`thrash-scan: --explain could not read stdin (${err.code ?? err.message}).`);
    process.exit(1);
  }
}

/** The previous scan: `--prev=<file>`, else the newest committed digest that is not today's (so a
 *  re-run on the day a digest was written still diffs against the one before it). */
function previousDigest(today) {
  const path =
    arg("prev") ??
    digestFiles()
      .filter((f) => f.slice(0, 10) < today)
      .map((f) => join(process.cwd(), "docs", "digests", f))[0];
  if (!path || path === "none") return { prev: null, lastDigest: null };
  const date = /(\d{4}-\d{2}-\d{2})\.md$/.exec(path)?.[1] ?? null;
  return { prev: parseSnapshot(readFileSync(path, "utf8")), lastDigest: date };
}

/** Create one issue over REST. Linted first: a body issue-lint refuses is a bug here, never filed. */
function fileIssue({ title, body, labels }) {
  const { problems } = lintIssue({ title, body, labels });
  if (problems.length)
    throw new Error(`thrash-scan: refusing to file "${title}": ${problems.join("; ")}`);
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  const out = sh(
    "curl",
    [
      "-sS",
      "--fail",
      "-X",
      "POST",
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "User-Agent: skynet-thrash-scan",
      `https://api.github.com/repos/${repo}/issues`,
      "--data-binary",
      "@-",
    ],
    { input: JSON.stringify({ title, body, labels }) },
  );
  return JSON.parse(out).number;
}

/** Slice 2: the digest block, and — with `--file`, never under `--explain` — the filings. */
function digest(hits, state, win, explain) {
  const units = filingUnits(hits);
  const { prev, lastDigest } = previousDigest(win.today);
  const repeats = repeatUnits(units, prev);
  const bottlenecks = explain
    ? (state.bottlenecks ?? [])
    : ghRestAll("issues?labels=bottleneck&state=all", { maxPages: 20 });
  const due = repeats.filter((u) => !alreadyFiled(u, bottlenecks));
  const filed = [];
  const skipped =
    due.length > MAX_FILES_PER_RUN
      ? [`${due.length - MAX_FILES_PER_RUN} over the ${MAX_FILES_PER_RUN}-per-run cap, next digest`]
      : [];
  const drafts = due
    .slice(0, MAX_FILES_PER_RUN)
    .map((u) => ({ unit: u, ...bottleneckIssue(u, win) }));
  if (has("file") && !explain) {
    for (const d of drafts)
      filed.push({ number: fileIssue(d), signal: d.unit.signal, key: d.unit.key });
  } else if (drafts.length) {
    skipped.push(`${drafts.length} would file without --file`);
  }
  const lines = digestLines(hits, units, { ...win, lastDigest, filed, skipped });
  return {
    ...lines,
    marker: snapshotMarker(units),
    baseline: !prev,
    repeats: repeats.length,
    drafts,
    filed,
  };
}

function renderDigest(d) {
  return [
    "## Needs you",
    ...(d.needsYou.length ? d.needsYou.map((l, n) => `${n + 1}. ${l}`) : ["(no thrash burst)"]),
    "",
    "## Noise absorbed",
    ...d.noise.map((l) => (l.startsWith("  ") ? l : `- ${l}`)),
    ...(d.baseline
      ? ["- Thrash snapshot: baseline set; the next digest can auto-file repeats."]
      : []),
    "",
    d.marker,
  ].join("\n");
}

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const has = (name) => process.argv.includes(`--${name}`);

function main() {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(today)) throw new Error("thrash-scan: --today must be YYYY-MM-DD.");
  const since = arg("since") ?? addDays(today, -DEFAULT_WINDOW_DAYS);
  if (!DATE_RE.test(since)) throw new Error("thrash-scan: --since must be YYYY-MM-DD.");
  const win = { since, today };

  const explain = has("explain");
  const state = explain ? JSON.parse(readStdin() || "{}") : gatherState(since);
  const hits = scan(state, win, explain ? {} : { lookup: lookupPr });

  if (has("digest")) {
    const d = digest(hits, state, win, explain);
    console.log(has("json") ? JSON.stringify(d, null, 2) : renderDigest(d));
    return;
  }
  if (has("json")) {
    console.log(JSON.stringify({ since, today, summary: summarize(hits, win), hits }, null, 2));
    return;
  }
  console.log(renderReport(hits, win));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
