// How long a failure lasts, end to end (#6470). Eric asked for faster verification and problem
// resolution, and docs/process/PILLARS.md calls detection lag the measure of the measures, but every
// stored number stopped short: a capsule's close, a PR's merge. So per failure this reads four times
// (it failed · someone filed it · a fix merged · it was verified) and three stages by source:
//
//   detection lag        failed → filed
//   filed to fix merged  filed → the fix's merge
//   failure to verified  failed → the first green run or passing contract
//
// What each source's times mean, since no two have the same evidence:
//
//   main CI      A red streak of pipeline.yml on main is one failure, however many pushes it spans:
//                12 straight reds on 2026-10-31 were one bots deploy. Failed is when the streak's
//                first run ended; verified is when the next green run ended. That green is a floor:
//                a push with nothing to deploy passes the deploy job too, and read its jobs and they
//                say success (2026-10-03, -06 and -25 all did), so a job-level check buys nothing.
//                Filed is the repair lane's capsule (its **Run** row names the run). A streak under
//                a capsule already open has no new filing, so it reads unknown, not 0.
//   contracts    The read that fails is the read that files, so read to filed would be 0 by
//                construction, and when the failure began is stored nowhere. Lag reads unknown: a 0
//                here would be a claim about alerts that went unheard for two weeks.
//   audit        A finding has no failing run, so its clock is how long the defect sat on main: the
//                Introduced in PR's merge to the fix's merge. "before #N" means it predates #N, so
//                its reading is a floor, and is flagged.
//
// The links come from `git log --first-parent origin/main`, not REST: a squash merge's commit
// carries the PR number, the merge time and the PR body's closing line, for nothing. A shallow or
// stale checkout therefore reads unknown rather than wrong. Every missing link is null and counted,
// never 0, because a 0 would be the best number on the page.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEDGER_DIR, parseLedger, slugOf } from "../loop-ledger.mjs";
import { FOUND_BY, introducedIn } from "./defects.mjs";
import { defectIssues, failedJobsOf, searchIssues } from "./github.mjs";
import { listRuns, noop } from "./lanes.mjs";

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** A capsule filed before the window can still be the one a streak inside it recurs under. */
const CAPSULE_LOOKBACK_MS = 30 * DAY;
const LEDGER_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "loop-ledger.mjs");
export const LEDGER_LOOP = "failure-to-verified-main-ci";

/** The value at quantile q of a list of numbers, or null when the list is empty. */
export function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

// ── the commits ────────────────────────────────────────────────────────────────────────────────

/** Time, subject, body, split on separators no commit message contains. */
export const LOG_FORMAT = "%ct%x1f%s%x1f%b%x1e";

/** Issues a message closes, by GitHub's keywords; a bare mention or "Part of #N" closes nothing. */
export function closersIn(text) {
  const closes = /(?<![\w-])(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)/gi;
  return [...String(text).matchAll(closes)].map((m) => Number(m[1]));
}

export function parseCommitLog(text) {
  const mergedAtByPr = new Map();
  const closers = new Map();
  for (const entry of String(text).split("\x1e")) {
    const [time, subject = "", body = ""] = entry.trim().split("\x1f");
    if (!time) continue;
    const at = Number(time) * 1000;
    const pr = /\(#(\d+)\)\s*$/.exec(subject) ?? /^Merge pull request #(\d+)/.exec(subject);
    const number = pr ? Number(pr[1]) : null;
    if (number) mergedAtByPr.set(number, at);
    for (const issue of closersIn(`${subject}\n${body}`))
      closers.set(issue, [...(closers.get(issue) ?? []), { pr: number, at }]);
  }
  return {
    mergedAtByPr,
    closersOf: (issue) => [...(closers.get(issue) ?? [])].sort((a, b) => a.at - b.at),
  };
}

function readCommits(cwd) {
  const git = (...args) =>
    spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  const res = git("log", "--first-parent", `--format=${LOG_FORMAT}`, "origin/main");
  if (res.status !== 0)
    return { commits: parseCommitLog(""), ref: "unavailable: origin/main could not be read" };
  // A shallow log succeeds with one commit, so without this every link reads unknown for no reason.
  const shallow = git("rev-parse", "--is-shallow-repository").stdout.trim() === "true";
  return {
    commits: parseCommitLog(res.stdout),
    ref: shallow ? "shallow checkout: origin/main's history is cut" : "origin/main",
  };
}

// ── the episodes ───────────────────────────────────────────────────────────────────────────────

/** A span in ms, or null when either end is missing or the two are out of order. */
const span = (from, to) => (from === null || to === null || to < from ? null : to - from);
const iso = (ms) => (ms === null ? null : new Date(ms).toISOString());
const msOf = (text) => (text ? Date.parse(text) : null);
const inWindow = (issue, w) => {
  const at = Date.parse(issue.created_at);
  return at >= w.sinceMs && at <= w.untilMs;
};

function episode({ id, failedAt, filedAt, fixedAt, verifiedAt, ...rest }) {
  return {
    id,
    failedAt: iso(failedAt),
    filedAt: iso(filedAt),
    fixedAt: iso(fixedAt),
    verifiedAt: iso(verifiedAt),
    lagMs: span(failedAt, filedAt),
    filedToFixMs: span(filedAt, fixedAt),
    toVerifiedMs: span(failedAt, verifiedAt),
    ...rest,
  };
}

/** The repair lane wakes only on `failure`, so a timeout reads as a streak nobody filed: a real gap. */
const RED = new Set(["failure", "timed_out", "startup_failure"]);

/** Red streaks in run order: each with its runs and the green run that ended it, if any. */
function redStreaks(runs) {
  const told = runs
    // A cancelled or skipped run says nothing about main.
    .filter((run) => run.conclusion === "success" || RED.has(run.conclusion))
    // By creation, so an older commit's run finishing late cannot end a streak it predates.
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id);
  const streaks = [];
  let open = null;
  told.forEach((run, at) => {
    if (RED.has(run.conclusion)) {
      open ??= { runs: [], firstSeen: at === 0, green: null };
      open.runs.push(run);
    } else if (open) {
      open.green = run;
      streaks.push(open);
      open = null;
    }
  });
  if (open) streaks.push(open);
  return streaks;
}

const RUN_ROW = /\*\*Run\*\*\s*\|\s*\[(\d+)\]/;
/** A matrix leg folds onto its job, as the repair lane's capsule title does. */
const jobTitle = (job) => job.replace(/\s*\(.*\)$/, "");

/**
 * The capsule that filed this streak, or the one already open that it recurs under. The order
 * matters: during the bots outage a later run of the same streak filed #6406 about a different fault
 * (its job list could not be read), and reading that as the streak's filing gave a lag of 5.7 days
 * under #5955, which had been open the whole time.
 */
function capsuleOf(streak, job, capsules) {
  const nameOf = (c) => RUN_ROW.exec(c.body ?? "")?.[1];
  const firstRun = String(streak.runs[0].id);
  const namedFirst = capsules.find((c) => nameOf(c) === firstRun);
  if (namedFirst) return { capsule: namedFirst, recurrence: false };
  if (!job) {
    const ids = new Set(streak.runs.map((run) => String(run.id)));
    return { capsule: capsules.find((c) => ids.has(nameOf(c))) ?? null, recurrence: false };
  }
  const sameJob = capsules.filter((c) => c.title.endsWith(`— ${jobTitle(job)}`));
  const firstEnded = Date.parse(streak.runs[0].updated_at);
  const open = sameJob.find(
    (c) =>
      Date.parse(c.created_at) < firstEnded && (!c.closed_at || msOf(c.closed_at) >= firstEnded),
  );
  if (open) return { capsule: open, recurrence: true };
  const greenEnded = streak.green ? Date.parse(streak.green.updated_at) : Infinity;
  const filed = sameJob.find((c) => {
    const at = Date.parse(c.created_at);
    return at >= firstEnded && at <= greenEnded;
  });
  return { capsule: filed ?? null, recurrence: false };
}

/**
 * The capsule's fix. Filed by this streak: its first closing merge, even after the streak went
 * green, since it is still this fault's fix. Recurring under an open capsule: only a merge inside
 * the streak, or a fix for the outage's last streak would be credited to every earlier one.
 */
function fixOf(capsule, recurrence, firstCreated, verifiedAt, commits) {
  if (!capsule) return null;
  const closers = commits.closersOf(capsule.number);
  return recurrence
    ? closers.find((c) => c.at >= firstCreated && (!verifiedAt || c.at <= verifiedAt))
    : closers.find((c) => c.at >= Date.parse(capsule.created_at));
}

/** Pure. `runs` may reach past the window on either side; only what it can see is timed. */
export function mainEpisodes(runs, capsules, commits, w) {
  const seen = runs.filter((run) => Date.parse(run.created_at) <= w.untilMs);
  return redStreaks(seen).flatMap((streak) => {
    const [first] = streak.runs;
    if (Date.parse(streak.runs.at(-1).created_at) < w.sinceMs) return [];
    // With no earlier run in view, the streak's true start is out of sight.
    const startedBeforeWindow = streak.firstSeen || Date.parse(first.created_at) < w.sinceMs;
    const firstEnded = Date.parse(first.updated_at);
    const verifiedAt = streak.green ? msOf(streak.green.updated_at) : null;
    const failed = first.failedJobs?.[0] ?? null;
    const { capsule, recurrence } = capsuleOf(streak, failed?.job ?? null, capsules);
    const fix = fixOf(capsule, recurrence, Date.parse(first.created_at), verifiedAt, commits);
    return [
      episode({
        id: `run ${first.id}`,
        failedAt: startedBeforeWindow ? null : firstEnded,
        filedAt: capsule && !recurrence ? msOf(capsule.created_at) : null,
        fixedAt: fix?.at ?? null,
        verifiedAt,
        name: failed ? `${failed.job} › ${failed.step ?? "?"}` : "unknown (job not read)",
        runs: streak.runs.length,
        capsule: capsule?.number ?? null,
        fix: fix?.pr ?? null,
        recurrence,
        greenBeforeFix: Boolean(verifiedAt && (!fix || fix.at > verifiedAt)),
        stillRed: !verifiedAt,
        startedBeforeWindow,
      }),
    ];
  });
}

/** `[fitness] <id>` issues; `[fitness] cannot read <source>` is blindness, not a failed contract. */
export function contractEpisodes(issues, commits, w) {
  return issues
    .filter(
      (i) =>
        !i.pull_request &&
        /^\[fitness\] /.test(i.title) &&
        !/^\[fitness\] cannot read /.test(i.title) &&
        inWindow(i, w),
    )
    .map((issue) => {
      const filedAt = Date.parse(issue.created_at);
      const fix = commits.closersOf(issue.number).find((c) => c.at >= filedAt);
      const passed = issue.closed_at && issue.state_reason !== "not_planned";
      return {
        ...episode({
          id: `#${issue.number}`,
          failedAt: filedAt,
          filedAt,
          fixedAt: fix?.at ?? null,
          verifiedAt: passed ? msOf(issue.closed_at) : null,
          name: issue.title.replace(/^\[fitness\] /, ""),
          fix: fix?.pr ?? null,
        }),
        lagMs: null,
      };
    });
}

export function auditEpisodes(issues, commits, w) {
  return issues.flatMap((issue) => {
    const introduced = introducedIn(issue.body ?? "");
    if (
      issue.pull_request ||
      !introduced ||
      !FOUND_BY.test(issue.body ?? "") ||
      !inWindow(issue, w)
    )
      return [];
    const merges = introduced.prs.flatMap((pr) => commits.mergedAtByPr.get(pr) ?? []);
    const filedAt = Date.parse(issue.created_at);
    const fix = commits.closersOf(issue.number).find((c) => c.at >= filedAt);
    const fixedAt = fix?.at ?? null;
    return [
      episode({
        id: `#${issue.number}`,
        failedAt: merges.length ? Math.min(...merges) : null,
        filedAt,
        fixedAt,
        // No run says the defect is gone; its fix merging is the last time on the record.
        verifiedAt: fixedAt,
        fix: fix?.pr ?? null,
        floor: introduced.floor,
        introducedIn: introduced.prs,
      }),
    ];
  });
}

// ── the reading ────────────────────────────────────────────────────────────────────────────────

function stage(spans) {
  const known = spans.filter((ms) => ms !== null).map((ms) => ms / MINUTE);
  const minutes = (q) => {
    const value = quantile(known, q);
    // Two places, because the repair lane files in seconds and a tenth of a minute would round it.
    return value === null ? null : Math.round(value * 100) / 100;
  };
  return {
    n: known.length,
    unknown: spans.length - known.length,
    p50Min: minutes(0.5),
    p90Min: minutes(0.9),
  };
}

export function stagesOf(episodes) {
  return {
    detectionLag: stage(episodes.map((e) => e.lagMs)),
    filedToFix: stage(episodes.map((e) => e.filedToFixMs)),
    toVerified: stage(episodes.map((e) => e.toVerifiedMs)),
  };
}

export function formatDuration(minutes) {
  if (minutes < 1) return `${Math.round(minutes * 60)} s`;
  if (minutes < 90) return `${Math.round(minutes)} min`;
  if (minutes < 2880) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

const statsOf = ({ n, unknown, p50Min, p90Min }) =>
  `p50 ${formatDuration(p50Min)}, p90 ${formatDuration(p90Min)} (n=${n}${unknown ? `, ${unknown} unknown` : ""})`;

/** One stage's line. Unknown is spelled out, because a blank or a 0 would read as a good number. */
export function formatStage(label, s) {
  if (s.n) return `${label}: ${statsOf(s)}`;
  return s.unknown
    ? `${label}: unknown (no failure of ${s.unknown} has the link)`
    : `${label}: unknown (no failure in the window)`;
}

const sourceOf = (episodes, extra = {}) => ({ episodes, stages: stagesOf(episodes), ...extra });

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * The main-push runs with their failing job, read from the meter's cache and otherwise read once
 * per streak: the job names the failure and links a recurrence, and only the first run's is needed.
 */
function namedMainRuns(rest, cache, w, maxRest, persist) {
  cache.pipeline ??= {};
  const runs = listRuns(rest, "pipeline.yml", w.sinceMs, w.untilMs, "push").filter(
    (run) => run.head_branch === "main",
  );
  for (const streak of redStreaks(runs)) {
    const [first] = streak.runs;
    if (cache.pipeline[first.id] || rest.calls >= maxRest) continue;
    cache.pipeline[first.id] = failedJobsOf(rest, first.id);
    persist();
  }
  return runs.map((run) => ({ ...run, failedJobs: cache.pipeline[run.id] ?? null }));
}

/**
 * Reads the window's reading. A caller that already holds the main runs or the audit's issues
 * passes them, so the full meter pays for each list once.
 */
export function readFailureToFix({
  rest,
  cache,
  w,
  maxRest,
  persist = noop,
  mainRuns,
  auditIssues,
  gitDir,
}) {
  const { commits, ref } = readCommits(gitDir);
  const runs = mainRuns ?? namedMainRuns(rest, cache, w, maxRest, persist);
  const capsules = searchIssues(
    rest,
    `label:ci-failure is:issue created:>=${dayOf(w.sinceMs - CAPSULE_LOOKBACK_MS)}`,
  );
  const pipelineCapsules = capsules.filter((c) => c.title.startsWith("[ci] Pipeline — "));
  const fitness = searchIssues(rest, `"[fitness]" in:title is:issue created:>=${dayOf(w.sinceMs)}`);
  const audit = auditIssues ?? defectIssues(rest, w.sinceMs);
  return {
    window: w,
    commits: ref,
    sources: {
      mainCi: sourceOf(mainEpisodes(runs, pipelineCapsules, commits, w), {
        // Lane workflows file capsules too. Their runs are not listed here, so they are counted out
        // loud rather than left to look like a clean record.
        otherWorkflowCapsules: capsules.filter(
          (c) => !pipelineCapsules.includes(c) && inWindow(c, w),
        ).length,
      }),
      contracts: sourceOf(contractEpisodes(fitness, commits, w), {
        // A check that could not read its source is neither a pass nor a failure, so it is a count.
        blind: fitness.filter((i) => /^\[fitness\] cannot read /.test(i.title) && inWindow(i, w))
          .length,
      }),
      audit: sourceOf(auditEpisodes(audit, commits, w)),
    },
    rest: { calls: rest.calls, cap: maxRest },
  };
}

// ── the ledger row ─────────────────────────────────────────────────────────────────────────────

/** Worth: a third of the first reading's p50 of 15 minutes. */
const LEDGER_WORTH_MIN = 5;

const stagesText = (s) =>
  [
    formatStage("lag", s.detectionLag),
    formatStage("filed to fix", s.filedToFix),
    formatStage("verified", s.toVerified),
  ].join("; ");

/**
 * The row's arguments for `loop-ledger.mjs --add`. The number is main CI's failure to verified p50
 * in minutes, the one source with a reading every week: a p50 across all three would move whenever
 * an audit happened to run. The other two ride in the row's words so nothing is lost.
 */
export function ledgerArgs(reading, rows, date) {
  const { mainCi, contracts, audit } = reading.sources;
  const p50 = mainCi.stages.toVerified.p50Min;
  if (p50 === null)
    throw new Error("no main CI reading in this window, so no row: a ledger row needs a number");
  if (rows.at(-1)?.date === date) throw new Error(`${LEDGER_LOOP} already has a row for ${date}`);
  const number = String(Math.round(p50));
  const changed = [
    `${Math.round(reading.window.hours / 24)} days to ${dayOf(Date.parse(reading.window.until))}.`,
    `main CI, ${stagesText(mainCi.stages)}.`,
    `[fitness] contracts, ${stagesText(contracts.stages)}.`,
    `audit, time on main, ${stagesText(audit.stages)}.`,
  ].join(" ");
  const base = ["--add", "--loop", LEDGER_LOOP, "--date", date, "--changed", changed];
  return rows.length
    ? [...base, "--after", number, "--usd", "unknown"]
    : [...base, "--baseline", number, "--worth", String(LEDGER_WORTH_MIN)];
}

/** Through the ledger's own command, so its refusals and its row shape stay the only ones. */
export function writeLedgerRow(reading, { dir = LEDGER_DIR, date }) {
  const file = join(dir, `${slugOf(LEDGER_LOOP)}.jsonl`);
  const { rows } = existsSync(file) ? parseLedger(readFileSync(file, "utf8"), file) : { rows: [] };
  const args = ledgerArgs(reading, rows, date);
  const res = spawnSync(process.execPath, [LEDGER_SCRIPT, ...args, "--ledger", dir], {
    encoding: "utf8",
  });
  if (res.status !== 0) throw new Error(res.stderr.trim());
  return res.stdout.trim();
}
