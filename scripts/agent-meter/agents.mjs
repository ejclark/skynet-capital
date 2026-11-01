// Workflow agents from local transcripts (#6470). A session's workflow agents are written under
// <projects>/<project folder>/<session>/subagents/workflows/<run>/agent-*.jsonl, with the agent
// type in the sibling .meta.json and the workflow's name in <session>/workflows/<run>.json. The
// project has one folder per checkout (the main one and each worktree), and all of them launch
// agents, so every folder that starts with the project's name is scanned.
//
// Usage is deduped by message id: a streamed reply writes one row per content block, all with the
// same id and the same usage, and counting rows overstated an Opus agent's calls by 60%.
//
// The worker's oracle reads here too (docs/process/LEARNING-LOOP.md, Worker stage agent): it stays
// grind's default stage agent only while its median first call is under 40k and at most 1 stage in
// 20 stops for a tool it does not have.
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

/** Calls deduped by message id; the first call is the first message's input plus both cache sides. */
export function agentUsage(lines) {
  const byId = new Map();
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.type !== "assistant" || !row.message?.usage) continue;
    const u = row.message.usage;
    const id = row.message.id ?? row.uuid;
    const entry = byId.get(id) ?? {
      at: row.timestamp,
      input: 0,
      cacheWrite: 0,
      cacheRead: 0,
      output: 0,
    };
    byId.set(id, entry);
    // Rows of one message repeat the same usage; max keeps the fullest row if a later one grew.
    entry.input = Math.max(entry.input, u.input_tokens ?? 0);
    entry.cacheWrite = Math.max(entry.cacheWrite, u.cache_creation_input_tokens ?? 0);
    entry.cacheRead = Math.max(entry.cacheRead, u.cache_read_input_tokens ?? 0);
    entry.output = Math.max(entry.output, u.output_tokens ?? 0);
  }
  if (!byId.size) return null;
  const calls = [...byId.values()];
  const totals = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const c of calls) {
    totals.input += c.input;
    totals.cacheWrite += c.cacheWrite;
    totals.cacheRead += c.cacheRead;
    totals.output += c.output;
  }
  const first = calls[0];
  return {
    calls: calls.length,
    firstCall: first.input + first.cacheWrite + first.cacheRead,
    firstAt: first.at ?? null,
    totals,
  };
}

const NO_SUCH_TOOL = /No such tool available/i;
/** How a stage says it lacks a tool. worker.md tells it to: "report the missing tool". */
const REPORTS_MISSING_TOOL =
  /\b(?:no|missing|lacks?|lacking|without|do(?:es)? not have|don't have)\s+(?:access to\s+)?(?:the\s+|a\s+|an\s+)?[`\w:-]*\s*tool\b|\btool\b[^.]{0,30}\b(?:not available|unavailable)\b|No such tool available/i;
const FINISHED = new Set(["done", "pass", "passed", "ok", "success", "green"]);
/**
 * Over this, a return with no status is a stage that did its work. All 8 stages today whose returns
 * matched the words ran 6,540 to 91,205 characters: reports that quoted this falsifier, or finished
 * and noted a tool in passing. A stage that stopped has little to say.
 */
const STOP_REPORT_MAX_CHARS = 600;

/**
 * Whether a stage stopped for a tool it lacks. Two signals, because a tool outside the stage's list
 * is usually never called: its return value says so, or its last tool call was the missing one. A
 * stage that hit the error and carried on through Bash did not stop, and is counted apart. A
 * finished status outranks both, and a long return with no status is not read for the words, since
 * a report may mention a tool for any reason. It is still a match on prose, so the printed row names
 * each stopped stage for a reader to check.
 */
export function missingToolStop(lines) {
  let triedMissing = false;
  let carriedOn = false;
  let returned;
  let lastText = "";
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const content = Array.isArray(row.message?.content) ? row.message.content : [];
    for (const block of content) {
      if (block.type === "text") lastText = block.text ?? "";
      if (block.type === "tool_use" && block.name === "StructuredOutput") returned = block.input;
      else if (block.type === "tool_use" && triedMissing) carriedOn = true;
      if (block.type === "tool_result" && block.is_error) {
        const text =
          typeof block.content === "string" ? block.content : JSON.stringify(block.content);
        if (NO_SUCH_TOOL.test(text ?? "")) {
          triedMissing = true;
          carriedOn = false;
        }
      }
    }
  }
  const status = String(returned?.status ?? "").toLowerCase();
  const finished = FINISHED.has(status);
  const value = returned ? JSON.stringify(returned) : lastText;
  const said =
    (status || value.length <= STOP_REPORT_MAX_CHARS) && REPORTS_MISSING_TOOL.test(value);
  return { stopped: !finished && (said || (triedMissing && !carriedOn)), triedMissing };
}

function p50(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Each agent type's stages: first-call median and range, and stops, the largest type first. */
export function stagesByType(agents) {
  const byType = new Map();
  for (const a of agents) byType.set(a.agentType, [...(byType.get(a.agentType) ?? []), a]);
  return [...byType]
    .map(([type, stages]) => {
      const firsts = stages.map((s) => s.firstCall);
      const stopped = stages.filter((s) => s.stopped);
      return {
        type,
        n: stages.length,
        median: p50(firsts),
        min: Math.min(...firsts),
        max: Math.max(...firsts),
        stopped: stopped.length,
        triedMissing: stages.filter((s) => s.triedMissing).length,
        stoppedStages: stopped.map((s) => s.description ?? "unnamed stage"),
      };
    })
    .sort((a, b) => b.n - a.n);
}

const WORKER_MEDIAN_CEILING = 40000;
const WORKER_MIN_STAGES = 20;
const WORKER_STOPS_ONE_IN = 20;

/** The registry's falsifier as a verdict: pass, fail, or not yet below its first 20 stages. */
export function workerOracle(row) {
  const kilo = (n) => `${(n / 1000).toFixed(1)}k`;
  const n = row?.n ?? 0;
  if (n < WORKER_MIN_STAGES)
    return {
      verdict: "not yet",
      line: `worker oracle: not yet: ${n} of the first ${WORKER_MIN_STAGES} stages have run`,
    };
  const underCeiling = row.median < WORKER_MEDIAN_CEILING;
  const fewStops = row.stopped * WORKER_STOPS_ONE_IN <= n;
  const verdict = underCeiling && fewStops ? "pass" : "fail";
  return {
    verdict,
    line: `worker oracle: ${verdict}: median first call ${kilo(row.median)} (must be under ${kilo(WORKER_MEDIAN_CEILING)}), ${row.stopped} of ${n} stopped for a missing tool (at most 1 in ${WORKER_STOPS_ONE_IN})`,
  };
}

/** First-call p50 by agent type and token totals by workflow name. */
export function agentSummary(agents) {
  const byType = {};
  const byWorkflow = {};
  for (const a of agents) {
    byType[a.agentType] ??= [];
    byType[a.agentType].push(a.firstCall);
    const w = byWorkflow[a.workflow] ?? {
      agents: 0,
      input: 0,
      cacheWrite: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
    };
    byWorkflow[a.workflow] = w;
    w.agents += 1;
    w.input += a.totals.input;
    w.cacheWrite += a.totals.cacheWrite;
    w.cacheRead += a.totals.cacheRead;
    w.output += a.totals.output;
    w.total = w.input + w.cacheWrite + w.cacheRead + w.output;
  }
  const firstCallP50ByType = {};
  for (const [type, firsts] of Object.entries(byType))
    firstCallP50ByType[type] = { n: firsts.length, p50: p50(firsts) };
  const stages = stagesByType(agents);
  return {
    agents: agents.length,
    firstCallP50ByType,
    tokensByWorkflow: byWorkflow,
    stages,
    workerOracle: workerOracle(stages.find((row) => row.type === "worker")),
  };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

async function readLines(path) {
  const lines = [];
  for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity }))
    lines.push(line);
  return lines;
}

function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/**
 * Every workflow agent of this project whose first call falls in the window. A file not written
 * since the window opened cannot hold a call inside it, so mtime prunes before any parse.
 */
export async function scanWorkflowAgents(projectsDir, project, sinceMs, untilMs) {
  const agents = [];
  for (const folder of listDirs(projectsDir).filter((name) => name.startsWith(project))) {
    for (const session of listDirs(join(projectsDir, folder))) {
      const sessionDir = join(projectsDir, folder, session);
      for (const run of listDirs(join(sessionDir, "subagents", "workflows")))
        agents.push(...(await agentsOfRun(sessionDir, run, sinceMs, untilMs)));
    }
  }
  return agents;
}

/** One workflow run's agents under a session, named by the run record's workflow name. */
async function agentsOfRun(sessionDir, run, sinceMs, untilMs) {
  const runDir = join(sessionDir, "subagents", "workflows", run);
  const record = readJson(join(sessionDir, "workflows", `${run}.json`));
  const workflow = record?.workflowName ?? run;
  const agents = [];
  for (const name of readdirSync(runDir).filter((n) => /^agent-.*\.jsonl$/.test(n))) {
    const path = join(runDir, name);
    if (statSync(path).mtimeMs < sinceMs) continue;
    const lines = await readLines(path);
    const usage = agentUsage(lines);
    const at = Date.parse(usage?.firstAt ?? "");
    if (!(at >= sinceMs && at <= untilMs)) continue;
    const meta = readJson(`${path.slice(0, -6)}.meta.json`);
    agents.push({
      session: sessionDir.split("/").at(-1),
      run,
      workflow,
      agentType: meta?.agentType ?? "unknown",
      phase: meta?.workflowPhase ?? null,
      description: meta?.description ?? null,
      ...missingToolStop(lines),
      ...usage,
    });
  }
  return agents;
}
