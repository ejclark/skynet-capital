// Each lane's cost, read from the rendered log of every lane job, over REST and with no workflow
// change (#6470: every Claude job's log already prints the session's result envelope, and nothing
// read it; the spend brake matched the raw `::notice::` form and read $0 on 12 of 12 ticks).
//
// Shape of a read: list a workflow's runs (one call per 100), then one call per run that could
// have carried a session, for the run's whole log zip. A run shorter than SESSION_FLOOR_SEC never
// set up a Claude session (checkout plus the action's own install take longer), so it is skipped
// and counted; a run still in flight is counted and read next time. Every completed run read goes
// into a local cache, so a repeat run spends only the listings. The REST bucket is shared with the
// lanes themselves, so a read stops at --max-rest and says how many runs it left unread rather than
// printing a partial total as if it were the week.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const REPO = "ejclark/skynet-capital";
export const LANE_WORKFLOWS = ["moneypenny-events.yml", "moneypenny-repair.yml", "claude.yml"];
/** The shortest run that carried a priced session was 53s of job after a 15s route job. */
export const SESSION_FLOOR_SEC = 40;
/** Lane by job-name prefix; a matrix leg is "<job> (<event id>)" and still matches. */
const LANES = [
  ["research due events", "research"],
  ["build feedback issue", "feedback"],
  ["build plan issue", "plan"],
  ["repair the failure", "repair"],
  ["dep-warden review", "dep-warden"],
];
/** Listings use the API's clock, which read an hour late on 2026-11-01; the log's clock decides. */
const LIST_SLACK_MS = 2 * 3600000;

export function laneOf(jobName) {
  if (jobName === "claude") return "claude.yml";
  const hit = LANES.find(([prefix]) => jobName.startsWith(prefix));
  return hit ? hit[1] : null;
}

/**
 * The session's result envelope as the action prints it in a rendered log, each line stamped by
 * the runner. The cost notice step prints a second, shorter form (`##[notice]cost — … usd=`); the
 * raw `::notice::` form exists only in workflow source and is never a reading.
 */
export function costFromLog(text) {
  const usd = /"total_cost_usd":\s*([\d.]+)/.exec(text);
  if (usd) {
    const turns = /"num_turns":\s*(\d+)/.exec(text);
    const model = /"model":\s*"(claude-[^"]+)"/.exec(text);
    const err = /"is_error":\s*(true|false)/.exec(text);
    return {
      usd: Number(usd[1]),
      turns: turns ? Number(turns[1]) : null,
      model: model ? model[1] : null,
      isError: err ? err[1] === "true" : null,
    };
  }
  const notice = /##\[notice\]cost — event=\S+ usd=([\d.]+)(?: turns=(\d+|\?))?/.exec(text);
  if (!notice) return null;
  return {
    usd: Number(notice[1]),
    turns: notice[2] && notice[2] !== "?" ? Number(notice[2]) : null,
    model: null,
    isError: null,
  };
}

/** The job's start from its log's first runner timestamp (after the byte-order mark). */
export function logStart(text) {
  const m = /^\uFEFF?(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z)/.exec(text);
  return m ? Date.parse(m[1]) : null;
}

/** Top-level `N_<job name>.txt` entries of a run's log zip; step logs sit in folders below them. */
export function jobFiles(names) {
  return names
    .filter((name) => !name.includes("/"))
    .map((file) => ({ file, name: file.replace(/^\d+_/, "").replace(/\.txt$/, "") }))
    .filter((entry) => entry.name !== entry.file);
}

export function runNeedsRead(run, floorSec = SESSION_FLOOR_SEC) {
  if (!run.conclusion) return false;
  const seconds = (Date.parse(run.updated_at) - Date.parse(run.run_started_at)) / 1000;
  return seconds >= floorSec;
}

/** Sums by lane for jobs whose log start falls inside the window; unpriced jobs are counted, not $0. */
export function laneRows(runs, sinceMs, untilMs) {
  const rows = {};
  for (const run of Object.values(runs)) {
    for (const job of run.jobs ?? []) {
      const at = Date.parse(job.startedAt);
      if (!(at >= sinceMs && at <= untilMs)) continue;
      const row = rows[job.lane] ?? { usd: 0, jobs: 0, unpriced: 0 };
      rows[job.lane] = row;
      row.jobs += 1;
      if (job.usd === null || job.usd === undefined) row.unpriced += 1;
      else row.usd = Math.round((row.usd + job.usd) * 1e6) / 1e6;
    }
  }
  return rows;
}

/** The real REST layer: every call goes through `gh api` and is counted, zips included. */
export function createRest() {
  const rest = {
    calls: 0,
    api(path) {
      rest.calls += 1;
      const res = spawnSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      if (res.status !== 0) throw new Error(`gh api ${path}: ${res.stderr.trim().slice(0, 200)}`);
      return JSON.parse(res.stdout);
    },
    zip(runId) {
      rest.calls += 1;
      // The zip is bytes; without --allow-escape-sequences gh refuses to print it.
      const res = spawnSync(
        "gh",
        ["api", "--allow-escape-sequences", `repos/${REPO}/actions/runs/${runId}/logs`],
        { maxBuffer: 256 * 1024 * 1024 },
      );
      if (res.status !== 0)
        throw new Error(`gh api logs ${runId}: ${String(res.stderr).slice(0, 200)}`);
      return res.stdout;
    },
  };
  return rest;
}

/** A workflow's runs created from the window's start (less slack) up to now, newest first. */
export function listRuns(rest, workflowFile, sinceMs, filters = {}) {
  const created = new Date(sinceMs - LIST_SLACK_MS).toISOString().replace(/\.\d+Z$/, "Z");
  const query = Object.entries({ created: `>=${created}`, per_page: 100, ...filters })
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const runs = [];
  for (let page = 1; page <= 20; page += 1) {
    const body = rest.api(
      `repos/${REPO}/actions/workflows/${workflowFile}/runs?${query}&page=${page}`,
    );
    const items = body.workflow_runs ?? [];
    runs.push(...items);
    if (items.length < 100) break;
  }
  return runs;
}

/** The lane jobs inside one run's log zip, each priced from its own rendered log. */
export function jobsFromZip(zipBytes, run) {
  const dir = mkdtempSync(join(tmpdir(), "agent-meter-zip-"));
  try {
    const zipPath = join(dir, "run.zip");
    writeFileSync(zipPath, zipBytes);
    const list = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
    // A cancelled run can leave an empty archive: a known zero, not an unreadable log.
    if (list.status !== 0 && /Empty zipfile/.test(`${list.stdout}${list.stderr}`)) return [];
    if (list.status !== 0) throw new Error(`unzip -Z1 failed for run ${run.id}`);
    const jobs = [];
    for (const { file, name } of jobFiles(list.stdout.split("\n").filter(Boolean))) {
      const lane = laneOf(name);
      if (!lane) continue;
      // unzip reads its member argument as a pattern: escape its wildcard characters.
      const member = file.replace(/([[\]*?\\])/g, "\\$1");
      const text =
        spawnSync("unzip", ["-p", zipPath, member], {
          encoding: "utf8",
          maxBuffer: 256 * 1024 * 1024,
        }).stdout ?? "";
      const cost = costFromLog(text);
      const startedAt = logStart(text);
      jobs.push({
        name,
        lane,
        startedAt: new Date(startedAt ?? Date.parse(run.run_started_at)).toISOString(),
        usd: cost?.usd ?? null,
        turns: cost?.turns ?? null,
        model: cost?.model ?? null,
        isError: cost?.isError ?? null,
      });
    }
    return jobs;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Read every lane workflow's runs in the window, pricing the ones the cache has not seen. The
 * cache holds completed runs only; the counts say what was skipped, in flight, or left unread.
 */
export function readLanes({ rest, cache, sinceMs, untilMs, maxRest, jobsOf = jobsFromZip }) {
  const counts = {
    newRuns: 0,
    cachedRuns: 0,
    skippedShort: 0,
    inProgress: 0,
    unreadRuns: 0,
    unreadableRuns: 0,
  };
  cache.runs ??= {};
  /** Which counter a listed run lands in; only "read" spends a call. */
  const classify = (run) => {
    if (cache.runs[run.id]) return "cachedRuns";
    if (!run.conclusion) return "inProgress";
    if (!runNeedsRead(run)) return "skippedShort";
    return rest.calls >= maxRest ? "unreadRuns" : "newRuns";
  };
  const inWindow = (run) => {
    const startedMs = Date.parse(run.run_started_at);
    return startedMs <= untilMs + LIST_SLACK_MS && startedMs >= sinceMs - LIST_SLACK_MS;
  };
  for (const workflow of LANE_WORKFLOWS) {
    if (rest.calls >= maxRest) break;
    for (const run of listRuns(rest, workflow, sinceMs).filter(inWindow)) {
      const bucket = classify(run);
      counts[bucket] += 1;
      if (bucket !== "newRuns") continue;
      // A run whose log cannot be read today is counted and left out of the cache, so the next
      // run tries it again instead of carrying a hole forward as a zero.
      try {
        cache.runs[run.id] = {
          workflow,
          event: run.event,
          conclusion: run.conclusion,
          startedAt: run.run_started_at,
          jobs: jobsOf(rest.zip(run.id), run),
        };
      } catch {
        counts.unreadableRuns += 1;
      }
    }
  }
  // An unread run makes every lane total a floor, not the week: say so instead of printing one.
  const rows = counts.unreadRuns ? {} : laneRows(cache.runs, sinceMs, untilMs);
  return { rows, counts };
}

export function loadCache(path) {
  if (!existsSync(path)) return { version: 1, runs: {}, pipeline: {} };
  try {
    const cache = JSON.parse(readFileSync(path, "utf8"));
    return cache.version === 1 ? cache : { version: 1, runs: {}, pipeline: {} };
  } catch {
    return { version: 1, runs: {}, pipeline: {} };
  }
}

export function saveCache(path, cache) {
  writeFileSync(path, JSON.stringify(cache));
}
