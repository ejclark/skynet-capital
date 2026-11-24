// REST BUDGET — read GitHub's `x-ratelimit-remaining` on every REST call, say who is spending once it
// runs low, and tell the caller when to move its writes to GraphQL (#8289 slice 1).
//
// WHY. Every session — the surge orchestrator, five cloud build sessions, Moneypenny's lanes acting
// for Eric — draws on ONE 5,000/hr REST allowance, because a person's tokens and the apps acting for
// that person share it. Measured 2026-11-24: 622 calls in 4 minutes, empty by ~07:34Z, refilled
// 08:02Z — dry 28 minutes an hour, while the separate 5,000-point GraphQL allowance read 9 used.
// Nobody could say which caller drained it, so nothing could be cut. Two answers live here:
//
//   1. NAME THE SPENDER. Under REST_LOG_BELOW remaining, the first call that sees it logs one line
//      to stderr naming the caller (script, subcommand, branch, CI run, session). Slice 2 cuts
//      whichever caller those lines name most.
//   2. FALL BACK. Under GRAPHQL_BELOW, `budget.useGraphql()` turns true and issues.mjs sends its
//      writes through GraphQL (scripts/issues-graphql.mjs), keeping the last ~300 REST calls for
//      the reads that have no cheap GraphQL twin.
//
// CORE ONLY. GitHub stamps every response with its own bucket in `x-ratelimit-resource`; the search
// bucket allows 30 a minute, so reading its `remaining` as the hourly one would log "29 left" on
// every search. Only `core` (or an unnamed bucket) counts.
//
// The header comes from curl's `-D <file>`, not `%header{}` in `-w` (curl 7.84+) and not `-D -`
// (a proxy's CONNECT answer and a `100 Continue` each add a header block to stdout). The LAST
// `x-ratelimit-remaining` in the file is the API's own.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { sh, withResponseBody } from "./moneypenny/gh.mjs";

export const REST_LOG_BELOW = 1000;
export const GRAPHQL_BELOW = 300;

/**
 * `{ remaining, reset, resource }` from a raw header dump — the last value of each, header names
 * matched case-insensitively. `remaining` is null when no header carried it (a stub, a network
 * failure before any answer). Pure.
 */
export function parseRateHeaders(text) {
  const last = (name) => {
    const re = new RegExp(`^${name}:\\s*(\\S+)`, "gim");
    let value = null;
    for (const m of String(text ?? "").matchAll(re)) value = m[1];
    return value;
  };
  const remaining = last("x-ratelimit-remaining");
  const reset = last("x-ratelimit-reset");
  return {
    remaining: remaining === null || !/^\d+$/.test(remaining) ? null : Number(remaining),
    reset: reset && /^\d+$/.test(reset) ? Number(reset) : null,
    resource: last("x-ratelimit-resource"),
  };
}

/**
 * Who is spending: the script and its first argument, then whatever names the session — branch,
 * CI workflow and run, Claude Code session. One line, ` · ` between parts. Pure (`branch` injected).
 */
export function callerLabel({ argv = process.argv, env = process.env, branch = "" } = {}) {
  const script = argv[1] ? basename(argv[1]) : "node";
  const parts = [[script, argv[2], argv[3]].filter(Boolean).join(" ")];
  if (branch) parts.push(`branch ${branch}`);
  if (env.GITHUB_RUN_ID)
    parts.push(`run ${env.GITHUB_RUN_ID}${env.GITHUB_WORKFLOW ? ` (${env.GITHUB_WORKFLOW})` : ""}`);
  if (env.CLAUDE_CODE_SESSION_ID) parts.push(`session ${env.CLAUDE_CODE_SESSION_ID}`);
  return parts.join(" · ");
}

const resetClock = (reset) =>
  reset ? ` (refills ${new Date(reset * 1000).toISOString().slice(11, 16)}Z)` : "";

/**
 * One process's view of the REST allowance. `observe` takes each response's parsed headers; it logs
 * once on crossing REST_LOG_BELOW and once on crossing GRAPHQL_BELOW, never per call — a session
 * making 40 calls under the line still writes two lines. `caller` is a function so the branch read
 * (one `git` call) happens only when a line is actually written.
 */
export function createBudget({
  log = (line) => console.error(line),
  caller = () => callerLabel(),
} = {}) {
  let remaining = null;
  let reset = null;
  const said = new Set();
  const say = (key, line) => {
    if (said.has(key)) return;
    said.add(key);
    log(line);
  };
  const observe = ({ remaining: r, reset: t, resource } = {}) => {
    if (typeof r !== "number") return;
    if (resource && resource !== "core") return;
    remaining = r;
    reset = t ?? reset;
    if (r < REST_LOG_BELOW)
      say(
        "low",
        `rate-limit: REST ${r} left of the shared hourly allowance${resetClock(reset)} — caller: ${caller()}`,
      );
    if (r < GRAPHQL_BELOW)
      say(
        "graphql",
        `rate-limit: REST under ${GRAPHQL_BELOW} — this run's issue writes go through GraphQL (#8289)`,
      );
  };
  return {
    observe,
    /** A REST write GitHub refused for rate limit: the allowance is spent, whatever we last read. */
    exhausted: () => observe({ remaining: 0, reset, resource: "core" }),
    useGraphql: () => remaining !== null && remaining < GRAPHQL_BELOW,
    remaining: () => remaining,
  };
}

const gitBranch = () => {
  try {
    return sh("git", ["branch", "--show-current"]);
  } catch {
    return "";
  }
};

/** The process-wide budget every REST call in this process reports into. */
export const budget = createBudget({ caller: () => callerLabel({ branch: gitBranch() }) });

/**
 * One REST call over curl (HTTPS_PROXY honoured, as gh.mjs's ghRest), its rate headers reported to
 * `into` whether it succeeded or failed — a 403 for rate limit still carries `remaining: 0`.
 * `path` is repo-relative or a full URL. A failure throws with GitHub's own reason appended.
 */
export function restCall(
  method,
  path,
  payload,
  {
    repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital",
    token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "",
    run = sh,
    into = budget,
    agent = "skynet-issues",
  } = {},
) {
  const url = path.startsWith("http")
    ? path
    : `https://api.github.com/repos/${repo}/${path.replace(/^\//, "")}`;
  const dir = mkdtempSync(join(tmpdir(), "rest-budget-"));
  const headers = join(dir, "headers");
  const args = ["-sS", "--fail-with-body", "-D", headers];
  if (method !== "GET") args.push("-X", method);
  args.push(
    "-H",
    `Authorization: Bearer ${token}`,
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    `User-Agent: ${agent}`,
  );
  // Without Content-Type curl sends `--data-binary` as form-urlencoded and the API answers 415.
  if (payload !== undefined)
    args.push("-H", "Content-Type: application/json", "--data-binary", "@-");
  args.push(url);
  try {
    const out = run("curl", args, payload === undefined ? {} : { input: JSON.stringify(payload) });
    return JSON.parse(out || "null");
  } catch (err) {
    throw withResponseBody(err);
  } finally {
    let text = "";
    try {
      text = readFileSync(headers, "utf8");
    } catch {
      // no answer reached us (or a stub curl wrote none) — nothing to report
    }
    into.observe(parseRateHeaders(text));
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A REST read with the budget attached — the drop-in for gh.mjs's `ghRest(path)`. */
export const restRead = (path, opts) => restCall("GET", path, undefined, opts);
