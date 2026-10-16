#!/usr/bin/env node
// Read a Workflow run's agents, status and results in one call — so the orchestrating session stops
// writing a fresh python parser every time it checks a fan-out (#5194).
//
//   node scripts/wf-read.mjs                        # recent runs: id · started · agents done/started
//   node scripts/wf-read.mjs --latest               # one line per agent of the newest run
//   node scripts/wf-read.mjs <run-id> [--json]      # same for a named run; --json = full results
//   node scripts/wf-read.mjs --task <id> [--json]   # the result JSON inside a task's .output file
//   node scripts/wf-read.mjs --agent <id> --tail N  # that agent's last N tool calls, one line each
//
//   --session <id>        read this session instead of the newest one with workflow runs
//   --project-dir <path>  read this ~/.claude/projects/<slug> dir instead of the cwd's
//   --limit N             runs to list (default 10)
//
// WHY A SCRIPT. A token-burn audit of 2026-10-08..11 counted 71 hand-parsed reads of workflow results
// in 4 sessions, at a median 468K-token context — ~64K input-equivalent tokens each, because the raw
// output then rides in context for the rest of the session. The parsing is mechanical; only the
// turns spent writing it cost anything. Falsifier: a week after merge, sessions still hand-parse a
// journal or task output more than 5 times, counted the same way.
//
// WHERE THE DATA LIVES (as observed 2026-10-11 — Claude Code's own layout, not a contract we own):
//   <project-dir>/<session>/subagents/workflows/<run-id>/journal.jsonl
//       {"type":"started","key","agentId","label","phase"} · {"type":"result","key","agentId","result"}
//   <run-dir>/agent-<id>.jsonl       that agent's transcript (assistant tool_use · user tool_result)
//   <run-dir>/agent-<id>.meta.json   {description, workflowPhase, …} — label/phase when the journal lacks them
//   /private/tmp|/tmp/claude-<uid>/<slug>/<session>/tasks/<task-id>.output   text with the result JSON in it
// Every file may be mid-write while a run is live, so a line that will not parse is skipped, never fatal.
//
// Read-only, no network, Node built-ins only. Exit 2 = could not find what was asked for.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";

/** Every line of a JSONL text that parses — a half-written tail line is skipped, not an error. */
export function parseJsonl(text) {
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // partially written — the run is still going
    }
  }
  return out;
}

const readText = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "");
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
};
const dirs = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];
const oneLine = (s, n) => {
  const flat = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
};
const stamp = (line) => line?.timestamp ?? line?.ts ?? line?.time ?? null;

/** Claude Code's project slug: every non-alphanumeric character of the absolute cwd becomes `-`. */
export function projectSlug(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}

export function defaultProjectDir(cwd = process.cwd(), env = process.env) {
  const base = env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");
  return join(base, "projects", projectSlug(cwd));
}

function agentFor(agents, line) {
  const key = line.key ?? line.agentId;
  if (key === undefined) return null;
  if (!agents.has(key)) {
    agents.set(key, {
      key,
      agentId: null,
      label: null,
      phase: null,
      status: "running",
      result: null,
    });
  }
  const a = agents.get(key);
  a.agentId ??= line.agentId ?? null;
  a.label ??= line.label ?? null;
  a.phase ??= line.phase ?? null;
  return a;
}

/** Fold one journal line into the agent it names: started → running, result → done or failed. */
function applyJournalLine(agents, line) {
  const isResult = line.type === "result";
  const isFailure = !isResult && /fail|error/i.test(String(line.type));
  if (line.type !== "started" && !isResult && !isFailure) return; // `launched` and other markers
  const a = agentFor(agents, line);
  if (!a || line.type === "started") return;
  const failed =
    isFailure || line.error !== undefined || line.ok === false || line.status === "failed";
  a.status = failed ? "failed" : "done";
  a.result = line.result ?? line.error ?? line.message ?? null;
}

/** When the run started: the journal's earliest timestamp, else its first transcript line's, else the dir's mtime. */
function startedAt(runDir, journal, agents) {
  const stamps = journal.map(stamp).filter(Boolean);
  if (!stamps.length) {
    for (const a of agents.filter((x) => x.agentId)) {
      const t = stamp(parseJsonl(readText(join(runDir, `agent-${a.agentId}.jsonl`))).find(stamp));
      if (t) stamps.push(t);
    }
  }
  if (stamps.length) return stamps.sort()[0];
  return existsSync(runDir) ? statSync(runDir).mtime.toISOString() : null;
}

/** One row per agent the journal knows about, in start order. */
export function readRun(runDir) {
  const journal = parseJsonl(readText(join(runDir, "journal.jsonl")));
  const byKey = new Map();
  for (const line of journal) applyJournalLine(byKey, line);
  const agents = [...byKey.values()];
  for (const a of agents.filter((x) => x.agentId)) {
    const meta = readJson(join(runDir, `agent-${a.agentId}.meta.json`));
    a.label ??= meta?.description ?? null;
    a.phase ??= meta?.workflowPhase ?? null;
  }
  return { id: basename(runDir), dir: runDir, started: startedAt(runDir, journal, agents), agents };
}

/** Every run under the project (or one session of it), newest first. */
export function listRuns(projectDir, session) {
  const sessions = session ? [session] : dirs(projectDir);
  const runs = [];
  for (const s of sessions) {
    const root = join(projectDir, s, "subagents", "workflows");
    for (const id of dirs(root)) runs.push({ ...readRun(join(root, id)), session: s });
  }
  return runs.sort((a, b) => String(b.started).localeCompare(String(a.started)));
}

/** The largest JSON object or array embedded in a text — the shape a task's .output carries. */
export function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // not bare JSON — look inside
  }
  let best = null;
  let bestLen = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{" && text[i] !== "[") continue;
    const end = matchingClose(text, i);
    if (end < 0) continue;
    try {
      const value = JSON.parse(text.slice(i, end + 1));
      if (end + 1 - i > bestLen) [best, bestLen] = [value, end + 1 - i];
      i = end; // a parsed span's inner brackets are never a bigger answer
    } catch {
      // brackets balanced but not JSON (prose, code) — try the next opener
    }
  }
  return best;
}

function matchingClose(text, start) {
  const stack = [];
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") {
      if (stack.pop() !== c) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

const toolHead = (input = {}) =>
  input.command ??
  input.file_path ??
  input.pattern ??
  input.url ??
  input.query ??
  input.description ??
  input.prompt ??
  JSON.stringify(input);

/** The last `n` tool calls in a transcript: `{ tool, head, status }` with status ok · error · pending. */
export function tailTools(transcriptText, n) {
  const calls = [];
  const byId = new Map();
  for (const line of parseJsonl(transcriptText)) {
    const content = line.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c?.type === "tool_use") {
        const call = {
          tool: c.name,
          head: oneLine(String(toolHead(c.input)).split("\n")[0], 80),
          status: "pending",
        };
        calls.push(call);
        byId.set(c.id, call);
      } else if (c?.type === "tool_result" && byId.has(c.tool_use_id)) {
        byId.get(c.tool_use_id).status = c.is_error ? "error" : "ok";
      }
    }
  }
  return calls.slice(-n);
}

function taskOutputPath(task, slug, session, tmpRoots) {
  if (existsSync(task)) return task;
  for (const root of tmpRoots) {
    const base = join(root, slug);
    for (const s of session ? [session] : dirs(base)) {
      const p = join(base, s, "tasks", `${task}.output`);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

export function defaultTmpRoots(uid = process.getuid?.() ?? "") {
  return [
    ...new Set([
      `/private/tmp/claude-${uid}`,
      `/tmp/claude-${uid}`,
      join(tmpdir(), `claude-${uid}`),
    ]),
  ];
}

// flag → how its value lands on opts; `true` marks a switch that takes no value.
const FLAGS = {
  "--json": ["json", true],
  "--latest": ["latest", true],
  "--task": ["task", String],
  "--agent": ["agent", (v) => v.replace(/^agent-/, "")],
  "--tail": ["tail", Number],
  "--limit": ["limit", Number],
  "--session": ["session", String],
  "--project-dir": ["projectDir", String],
  "--tmp-dir": ["tmpDir", String],
};

function parseArgs(argv) {
  const opts = { json: false, latest: false, limit: 10, tail: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      opts.run = a;
      continue;
    }
    const [key, read] = FLAGS[a] ?? [];
    if (!key) throw new Error(`unknown flag ${a}`);
    if (read === true) opts[key] = true;
    else if (i + 1 < argv.length) opts[key] = read(argv[++i]);
    else throw new Error(`${a} needs a value`);
  }
  for (const k of ["tail", "limit"]) {
    if (!(opts[k] > 0)) throw new Error(`--${k} needs a positive number`);
  }
  return opts;
}

const ok = (out) => ({ code: 0, out });
const fail = (msg) => ({ code: 2, out: `wf-read: ${msg}` });
const resultHead = (r) =>
  r === null ? "—" : oneLine(typeof r === "string" ? r : JSON.stringify(r), 100);

function showTask(opts, projectDir) {
  const roots = opts.tmpDir ? [opts.tmpDir] : defaultTmpRoots();
  const path = taskOutputPath(opts.task, basename(projectDir), opts.session, roots);
  if (!path) return fail(`no ${opts.task}.output under ${roots.join(" or ")}`);
  const value = extractJson(readFileSync(path, "utf8"));
  if (value === null) return fail(`no JSON found in ${path}`);
  return ok(JSON.stringify(value, null, opts.json ? undefined : 2));
}

function showAgent(opts, pool) {
  const path = pool.map((r) => join(r.dir, `agent-${opts.agent}.jsonl`)).find(existsSync);
  if (!path) return fail(`no agent-${opts.agent}.jsonl in ${pool.length} run(s)`);
  const calls = tailTools(readFileSync(path, "utf8"), opts.tail);
  if (opts.json) return ok(JSON.stringify(calls));
  return ok(calls.map((c) => `${c.tool} · ${c.head} · ${c.status}`).join("\n"));
}

function showRun(opts, run) {
  if (opts.json)
    return ok(JSON.stringify({ id: run.id, started: run.started, agents: run.agents }));
  const rows = run.agents.map(
    (a) => `${a.label ?? a.key} · ${a.phase ?? "—"} · ${a.status} · ${resultHead(a.result)}`,
  );
  return ok([`${run.id} · ${run.started} · ${countDone(run)}`, ...rows].join("\n"));
}

function showRuns(opts, runs) {
  const shown = runs.slice(0, opts.limit);
  if (!opts.json)
    return ok(shown.map((r) => `${r.id} · ${r.started} · ${countDone(r)}`).join("\n"));
  const rows = shown.map((r) => ({
    id: r.id,
    session: r.session,
    started: r.started,
    agents: r.agents.length,
    done: r.agents.filter((a) => a.status !== "running").length,
    failed: r.agents.filter((a) => a.status === "failed").length,
  }));
  return ok(JSON.stringify(rows));
}

/** Run the CLI; returns `{ code, out }` so the spec drives it without a subprocess. */
export function main(argv, { cwd = process.cwd(), env = process.env } = {}) {
  const opts = parseArgs(argv);
  const projectDir = opts.projectDir ?? defaultProjectDir(cwd, env);
  if (opts.task) return showTask(opts, projectDir);

  const runs = listRuns(projectDir, opts.session);
  if (!runs.length) return fail(`no workflow runs under ${projectDir}`);
  const named = opts.run ? runs.filter((r) => r.id === opts.run) : null;
  if (named?.length === 0) return fail(`no run ${opts.run} under ${projectDir}`);
  // Without a run id, --latest and an agent lookup read the newest session that has runs.
  const newest = runs.filter((r) => r.session === runs[0].session);

  if (opts.agent) return showAgent(opts, named ?? (opts.latest ? newest.slice(0, 1) : newest));
  if (named || opts.latest) return showRun(opts, (named ?? newest)[0]);
  return showRuns(opts, runs);
}

/** "done/started", plus the failures among the done — a failed agent has finished, but say so. */
function countDone(run) {
  const finished = run.agents.filter((a) => a.status !== "running").length;
  const failed = run.agents.filter((a) => a.status === "failed").length;
  return `${finished}/${run.agents.length} done${failed ? ` (${failed} failed)` : ""}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Same exit contract as the error paths inside main: a bad flag could not do its job either.
  try {
    const { code, out } = main(process.argv.slice(2));
    (code === 0 ? console.log : console.error)(out);
    process.exit(code);
  } catch (err) {
    console.error(`wf-read: ${err.message}`);
    process.exit(2);
  }
}
