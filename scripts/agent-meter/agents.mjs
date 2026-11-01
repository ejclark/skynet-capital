// Workflow agents from local transcripts (#6470). A session's workflow agents are written under
// <projects>/<project folder>/<session>/subagents/workflows/<run>/agent-*.jsonl, with the agent
// type in the sibling .meta.json and the workflow's name in <session>/workflows/<run>.json. The
// project has one folder per checkout (the main one and each worktree), and all of them launch
// agents, so every folder that starts with the project's name is scanned.
//
// Usage is deduped by message id: a streamed reply writes one row per content block, all with the
// same id and the same usage, and counting rows overstated an Opus agent's calls by 60%.
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

function p50(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
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
  return { agents: agents.length, firstCallP50ByType, tokensByWorkflow: byWorkflow };
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
    const usage = agentUsage(await readLines(path));
    const at = Date.parse(usage?.firstAt ?? "");
    if (!(at >= sinceMs && at <= untilMs)) continue;
    const meta = readJson(`${path.slice(0, -6)}.meta.json`);
    agents.push({
      session: sessionDir.split("/").at(-1),
      run,
      workflow,
      agentType: meta?.agentType ?? "unknown",
      phase: meta?.workflowPhase ?? null,
      ...usage,
    });
  }
  return agents;
}
