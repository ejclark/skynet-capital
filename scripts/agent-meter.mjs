#!/usr/bin/env node
// The before-and-after numbers for the agentic process work (#6470): does a change to memory,
// context or loops actually move first-pass errors, fix speed, or what a session pays at startup?
// Later steps of that work are judged by these numbers, so each one states what it leaves out.
//
// Fix-after-feat chains are deliberately absent: a placebo test showed same-scope fixes land before
// a feat as often as after it (78 vs 70 within a day), so they measure busy scopes, not rework.
// PR-run CI is a floor, not a first-pass rate: scripts/ship.sh verifies before pushing, so mistakes
// caught locally never reach CI; that half comes from the verify log ship.sh appends. Main-branch
// failures are named by their failing job, because 12 straight failures on 2026-10-31 were one bots
// deploy, not twelve agent mistakes. Post-merge defects sit beside how many PRs were audited.
//
//   npm run meter -- [--json] [--hours N | --days N | --since ISO [--until ISO]] [--max-rest N]
//   npm run meter -- --row "<loop>" --before N --after N --tokens N [--usd N] [--minutes N]
//   npm run meter -- --audit-receipt --prs 6307,6323 --confirmed N [--local-only]
//     (also appends the row to the data/pr-review branch, which later meter runs read: #6683)
//   npm run meter -- --failure-to-fix [--json] [--days N | ...] [--write-ledger [--date D] [--ledger DIR]]
//   npm run meter:workers -- [--json] [--days N | ...]   # exits 1 if the worker's oracle fails
//   npm run meter:flow -- [--json] [--days N | ...]      # the same as npm run meter -- --flow
//   npm run meter -- --jobs [--json] [--days N | ...]    # tokens per verified result, per job (#6609)
//
// Seams (env, so a spec can drive it): AGENT_RUNS_DIR, AGENT_TRANSCRIPTS_DIR, AGENT_PROJECTS_DIR,
// AGENT_MEMORY_DIR, AGENT_GIT_DIR, AGENT_CHECKOUT_DIR; `gh` on PATH is the REST layer. Transcripts are
// read from the folders named for this checkout (agent-meter/project.mjs, #6689); with none, every
// section that reads them says unknown, never zero.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  agentSummary,
  scanWorkflowAgents,
  stagesByType,
  workerOracle,
} from "./agent-meter/agents.mjs";
import {
  auditedInWindow,
  branchReceipts,
  defectsFromIssues,
  mergeReceipts,
  recordAuditReceipt,
} from "./agent-meter/defects.mjs";
import { quantile, readFailureToFix, writeLedgerRow } from "./agent-meter/failure-to-fix.mjs";
import { readFlow } from "./agent-meter/flow.mjs";
import { defectIssues, mergedPrs, pipelineRuns } from "./agent-meter/github.mjs";
import { readJobs } from "./agent-meter/jobs.mjs";
import {
  createRest,
  loadCache,
  readLanes,
  SESSION_FLOOR_SEC,
  saveCache,
} from "./agent-meter/lanes.mjs";
import { currentProject, NO_TRANSCRIPTS, projectFolders } from "./agent-meter/project.mjs";
import {
  render,
  renderFailureToFix,
  renderFlow,
  renderJobs,
  renderWorkerStages,
} from "./agent-meter/render.mjs";
import { isMain } from "./is-main.mjs";

export { quantile };

const CHARS_PER_TOKEN = 4;
const HOUR = 3600000;
/** GitHub's shared REST bucket also feeds the lanes; one meter run stays well under it. */
const DEFAULT_MAX_REST = 250;

function flag(args, name) {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
}

/** A true rolling window: --days 1 is the last 24 hours, never "since yesterday's date". */
export function windowFromArgs(args, nowMs = Date.now()) {
  const num = (name) => {
    const raw = flag(args, name);
    if (raw === undefined) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
      throw new Error(`${name} needs a positive number, got "${raw}"`);
    return n;
  };
  const iso = (name) => {
    const raw = flag(args, name);
    if (raw === undefined) return undefined;
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) throw new Error(`${name} needs an ISO date, got "${raw}"`);
    return ms;
  };
  const untilMs = iso("--until") ?? nowMs;
  const hours = num("--hours") ?? (num("--days") ?? 0) * 24;
  const sinceMs = iso("--since") ?? untilMs - (hours || 7 * 24) * HOUR;
  return {
    sinceMs,
    untilMs,
    hours: Math.round((untilMs - sinceMs) / HOUR),
    since: new Date(sinceMs).toISOString(),
    until: new Date(untilMs).toISOString(),
    crossesRepeatedHour: crossesRepeatedHour(sinceMs, untilMs),
  };
}

/** Clocks fell back on 2026-11-01; the API's times in that hour read an hour late. */
export function crossesRepeatedHour(sinceMs, untilMs) {
  return (
    sinceMs < Date.parse("2026-11-01T08:00:00Z") && untilMs > Date.parse("2026-11-01T06:00:00Z")
  );
}

/** Non-cancelled CI runs split by trigger, so a main-only outage cannot pose as agent mistakes. */
export function ciByTrigger(runs) {
  const out = {};
  for (const run of runs) {
    if (run.conclusion === "cancelled" || run.conclusion === "skipped" || !run.conclusion) continue;
    const row = out[run.event] ?? { runs: 0, failed: 0 };
    out[run.event] = row;
    row.runs += 1;
    if (run.conclusion === "failure") row.failed += 1;
  }
  return out;
}

/** Failed main runs named by their failing job and step; an unread job list stays unknown. */
export function mainFailuresByJob(runs) {
  const out = { runs: 0, failed: 0, byJob: {} };
  for (const run of runs) {
    if (run.conclusion === "cancelled" || run.conclusion === "skipped" || !run.conclusion) continue;
    out.runs += 1;
    if (run.conclusion !== "failure") continue;
    out.failed += 1;
    const names = run.failedJobs?.map((j) => `${j.job} › ${j.step ?? "?"}`) ?? [
      "unknown (jobs not read)",
    ];
    for (const name of names.length ? names : ["unknown (no failed job named)"])
      out.byJob[name] = (out.byJob[name] ?? 0) + 1;
  }
  return out;
}

/** Inside [sinceMs, untilMs]: a fixed past window must read the same on every run (#6690). */
const inWindow = (at, sinceMs, untilMs) => {
  const ms = Date.parse(at);
  return ms >= sinceMs && ms <= untilMs;
};

/** Open-to-merge minutes for merged feat and fix PRs; research and docs merges would swamp it. */
export function mergeMinutes(prs, sinceMs, untilMs = Number.POSITIVE_INFINITY) {
  const minutes = prs
    .filter(
      (pr) =>
        pr.mergedAt && inWindow(pr.mergedAt, sinceMs, untilMs) && /^(feat|fix)\b/.test(pr.title),
    )
    .map((pr) => (Date.parse(pr.mergedAt) - Date.parse(pr.createdAt)) / 60000);
  return { n: minutes.length, p50: quantile(minutes, 0.5), p90: quantile(minutes, 0.9) };
}

/** Counts of local verify outcomes from ship.sh's log, failures named by the step that failed. */
export function localVerify(rows, sinceMs, untilMs = Number.POSITIVE_INFINITY) {
  const recent = rows.filter((row) => inWindow(row.at, sinceMs, untilMs));
  const bySteps = {};
  for (const row of recent.filter((r) => r.ok === false)) {
    const step =
      row.step ||
      ("step" in row ? "unknown (no step named)" : "unknown (row predates the step field)");
    bySteps[step] = (bySteps[step] ?? 0) + 1;
  }
  return { runs: recent.length, failed: recent.filter((row) => row.ok === false).length, bySteps };
}

/**
 * Per-run loop numbers from attempts.jsonl rows: how many attempts it took and how long from the
 * first attempt until one verified. An unverified run reports null, never a flattering partial.
 */
export function runLoop(rows) {
  const attempts = rows.filter((row) => row.kind === "attempt");
  const verified = attempts.find((row) => row.verified === true);
  const start = attempts[0] ? Date.parse(attempts[0].at) : null;
  return {
    attempts: attempts.length,
    verified: Boolean(verified),
    minutesToVerified: verified ? (Date.parse(verified.at) - start) / 60000 : null,
  };
}

// Attachment types that are copies of other context, not extra load on the first call.
const SKIP_ATTACHMENTS = new Set(["prompt_snapshot", "queued_command", "edited_text_file"]);

/**
 * What a session paid before its first answer, attributed from the transcript's attachments. The
 * remainder is the system prompt and loaded tool schemas, which transcripts do not itemize; it is
 * reported as such rather than spread across the named sources.
 */
export function startupFromTranscript(lines) {
  const sources = {};
  let firstCall = null;
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.type === "assistant" && row.message?.usage) {
      const u = row.message.usage;
      firstCall =
        (u.input_tokens ?? 0) +
        (u.cache_creation_input_tokens ?? 0) +
        (u.cache_read_input_tokens ?? 0);
      break;
    }
    const type = row.attachment?.type;
    if (!type || SKIP_ATTACHMENTS.has(type)) continue;
    sources[type] =
      (sources[type] ?? 0) + Math.round(JSON.stringify(row.attachment).length / CHARS_PER_TOKEN);
  }
  if (firstCall === null) return null;
  const named = Object.values(sources).reduce((sum, tokens) => sum + tokens, 0);
  return { firstCall, sources, unitemized: Math.max(0, firstCall - named) };
}

/** The one fixed row a loop's Log takes per iteration, so no session has to remember the shape. */
export function iterationRow({ loop, before, after, tokens, usd, minutes, date }) {
  for (const [name, value] of Object.entries({ loop, before, after, tokens, date }))
    if (value === undefined || value === null || value === "")
      throw new Error(`--${name} is required for an iteration row`);
  for (const [name, value] of Object.entries({ before, after, tokens, usd, minutes }))
    if (value !== undefined && !Number.isFinite(Number(value)))
      throw new Error(`--${name} needs a number, got "${value}"`);
  const k = (n) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
  const tail = [
    usd !== undefined ? `$${Number(usd).toFixed(2)}` : null,
    minutes !== undefined ? `${minutes} min` : null,
  ].filter(Boolean);
  return [
    `- ${date} · ${loop} · iteration · ${before} → ${after} · ${k(Number(tokens))} tokens`,
    ...tail,
  ].join(" · ");
}

const readLines = (path) =>
  existsSync(path) ? readFileSync(path, "utf8").split("\n").filter(Boolean) : [];
const readJsonl = (path) =>
  readLines(path).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
const fileBytes = (path) => (existsSync(path) ? statSync(path).size : null);

function newestTranscripts(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => ({ path: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

async function measure(w, { maxRest }) {
  const home = homedir();
  const runsDir = process.env.AGENT_RUNS_DIR ?? join(home, ".claude", "runs");
  const projectsDir = process.env.AGENT_PROJECTS_DIR ?? join(home, ".claude", "projects");
  const project = currentProject();
  const transcripts = process.env.AGENT_TRANSCRIPTS_DIR ?? join(projectsDir, project);
  const memoryDir = process.env.AGENT_MEMORY_DIR ?? join(transcripts, "memory");
  // No folder for this checkout is no reading, not a quiet window: a cloud session's sessions sit
  // under its own checkout's name, and the laptop's name matched none of them (#6689).
  const hasAgents = projectFolders(projectsDir, project).length > 0;
  const hasStartup = existsSync(transcripts);
  const hasMemory = Boolean(process.env.AGENT_MEMORY_DIR) || hasStartup;
  const rest = createRest();
  const cachePath = join(runsDir, "agent-meter-cache.json");
  const cache = loadCache(cachePath);
  const attempt = (read) => {
    try {
      return read();
    } catch (err) {
      return `unavailable: ${err.message.split("\n")[0]}`;
    }
  };

  // The cache is written as runs are read, so a cold run cut short keeps what it paid for.
  mkdirSync(runsDir, { recursive: true });
  const persist = () => saveCache(cachePath, cache);

  const pipeline = attempt(() => pipelineRuns(rest, cache, w, maxRest, persist));
  const prs = attempt(() => mergedPrs(rest, w.sinceMs));
  const issues = attempt(() => defectIssues(rest, w.sinceMs));
  const lanes = attempt(() =>
    readLanes({ rest, cache, sinceMs: w.sinceMs, untilMs: w.untilMs, maxRest, persist }),
  );
  const failureToFix = attempt(() =>
    readFailureToFix({
      rest,
      cache,
      w,
      maxRest,
      persist,
      mainRuns: typeof pipeline === "string" ? undefined : pipeline.main,
      auditIssues: typeof issues === "string" ? undefined : issues,
      gitDir: process.env.AGENT_GIT_DIR,
    }),
  );
  persist();

  const runRows = existsSync(runsDir)
    ? readdirSync(runsDir)
        .filter((name) => existsSync(join(runsDir, name, "attempts.jsonl")))
        .map((name) => ({
          run: name,
          ...runLoop(readJsonl(join(runsDir, name, "attempts.jsonl"))),
        }))
    : [];
  const startups = newestTranscripts(transcripts)
    .slice(0, 5)
    .map((file) => startupFromTranscript(readLines(file.path)))
    .filter(Boolean);
  const agents = hasAgents
    ? agentSummary(await scanWorkflowAgents(projectsDir, project, w.sinceMs, w.untilMs))
    : NO_TRANSCRIPTS;
  const audited = auditedInWindow(
    mergeReceipts(
      readJsonl(join(runsDir, "post-merge-audit.jsonl")),
      branchReceipts(rest, w.sinceMs, w.untilMs),
    ),
    w.sinceMs,
    w.untilMs,
  );
  return {
    window: w,
    firstPass: {
      defects:
        typeof issues === "string"
          ? issues
          : { ...defectsFromIssues(issues, w.sinceMs, w.untilMs), audited },
      mainFailures: typeof pipeline === "string" ? pipeline : mainFailuresByJob(pipeline.main),
      ci: typeof pipeline === "string" ? pipeline : ciByTrigger(pipeline.all),
      localVerify: localVerify(readJsonl(join(runsDir, "ship-verify.jsonl")), w.sinceMs, w.untilMs),
      note: "pull_request CI is a floor; local verify is the other half; defects without an audit receipt read unknown, not zero",
    },
    lanes: typeof lanes === "string" ? lanes : { ...lanes, floorSec: SESSION_FLOOR_SEC },
    speed: {
      openToMergeMinutes: typeof prs === "string" ? prs : mergeMinutes(prs, w.sinceMs, w.untilMs),
      runs: runRows,
      note: "open-to-merge excludes local verify and agent time; run rows are the fuller measure",
    },
    failureToFix,
    flow: await readFlow(w),
    agents,
    startup: hasStartup
      ? {
          recentFirstCalls: startups.map((s) => s.firstCall),
          newest: startups[0] ?? null,
          note: "the first-call total is measured; the named source rows are chars/4 and run about 25% low, so unitemized reads high by the same amount",
        }
      : NO_TRANSCRIPTS,
    limits: {
      claudeMdBytes: fileBytes(resolve("CLAUDE.md")),
      orientBytes: fileBytes(resolve(".claude/output-styles/orient.md")),
      // null when no transcript folder was found: the memory index lives inside it.
      memoryIndexLines: hasMemory ? readLines(join(memoryDir, "MEMORY.md")).length : null,
      memoryIndexLimit: 200,
      memoryFiles: !hasMemory
        ? null
        : existsSync(memoryDir)
          ? readdirSync(memoryDir).filter((n) => n.endsWith(".md")).length
          : 0,
    },
    rest: { calls: rest.calls, cap: maxRest },
  };
}

/** Local transcripts only, so the worker's oracle is free to read as often as a check wants. */
async function workerStages(args, w) {
  const projectsDir = process.env.AGENT_PROJECTS_DIR ?? join(homedir(), ".claude", "projects");
  const project = currentProject();
  const stages = stagesByType(await scanWorkflowAgents(projectsDir, project, w.sinceMs, w.untilMs));
  // loop-check posts this from a runner, which holds no transcripts: unknown there, not "0 of 20".
  const oracle = projectFolders(projectsDir, project).length
    ? workerOracle(stages.find((row) => row.type === "worker"))
    : { verdict: "unknown", line: `worker oracle: ${NO_TRANSCRIPTS}` };
  if (oracle.verdict === "fail") process.exitCode = 1;
  const reading = { window: w, stages, oracle };
  return args.includes("--json") ? JSON.stringify(reading, null, 2) : renderWorkerStages(reading);
}

function failureToFixReading(w, maxRest) {
  const runsDir = process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs");
  mkdirSync(runsDir, { recursive: true });
  const cachePath = join(runsDir, "agent-meter-cache.json");
  const cache = loadCache(cachePath);
  const reading = readFailureToFix({
    rest: createRest(),
    cache,
    w,
    maxRest,
    persist: () => saveCache(cachePath, cache),
    gitDir: process.env.AGENT_GIT_DIR,
  });
  saveCache(cachePath, cache);
  return reading;
}

/** The scoreboard. A GitHub that will not answer costs one row its reading, not the whole board. */
async function jobsOnly(args, w, maxRest) {
  const projectsDir = process.env.AGENT_PROJECTS_DIR ?? join(homedir(), ".claude", "projects");
  const reading = await readJobs({
    w,
    projectsDir,
    project: currentProject(),
    runsDir: process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs"),
    sharedReceipts: branchReceipts(createRest(), w.sinceMs, w.untilMs),
    readFixes: () => {
      try {
        return failureToFixReading(w, maxRest);
      } catch (err) {
        return `unavailable: ${err.message.split("\n")[0]}`;
      }
    },
  });
  return args.includes("--json") ? JSON.stringify(reading, null, 2) : renderJobs(reading);
}

/** This section alone: a 30-day baseline must not pay for 30 days of lane logs. */
function failureToFixOnly(args, w, maxRest) {
  const reading = failureToFixReading(w, maxRest);
  if (args.includes("--write-ledger"))
    return writeLedgerRow(reading, {
      dir: flag(args, "--ledger"),
      date: flag(args, "--date") ?? new Date().toISOString().slice(0, 10),
    });
  return args.includes("--json") ? JSON.stringify(reading, null, 2) : renderFailureToFix(reading);
}

async function main(args) {
  if (args.includes("--row")) {
    const n = (name) => (flag(args, name) === undefined ? undefined : Number(flag(args, name)));
    return iterationRow({
      loop: flag(args, "--row"),
      before: n("--before"),
      after: n("--after"),
      tokens: n("--tokens"),
      usd: n("--usd"),
      minutes: n("--minutes"),
      date: flag(args, "--date") ?? new Date().toISOString().slice(0, 10),
    });
  }
  if (args.includes("--audit-receipt"))
    return recordAuditReceipt({
      prs: flag(args, "--prs"),
      confirmed: flag(args, "--confirmed"),
      localOnly: args.includes("--local-only"),
      runsDir: process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs"),
    });
  const w = windowFromArgs(args);
  if (args.includes("--worker-stages")) return workerStages(args, w);
  if (args.includes("--flow")) {
    const reading = await readFlow(w);
    return args.includes("--json") ? JSON.stringify(reading, null, 2) : renderFlow(reading);
  }
  const maxRest = Number(flag(args, "--max-rest") ?? DEFAULT_MAX_REST);
  if (args.includes("--failure-to-fix")) return failureToFixOnly(args, w, maxRest);
  if (args.includes("--jobs")) return jobsOnly(args, w, maxRest);
  const m = await measure(w, { maxRest });
  return args.includes("--json") ? JSON.stringify(m, null, 2) : render(m);
}

if (isMain(import.meta.url)) {
  try {
    console.log(await main(process.argv.slice(2)));
  } catch (err) {
    // A wrong flag is a one-line answer, not a stack trace.
    console.error(`agent-meter: ${err.message}`);
    process.exit(1);
  }
}
