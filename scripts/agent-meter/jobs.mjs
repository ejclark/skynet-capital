// Tokens per verified result, per kind of job (#6609). Eric, 2026-11-01: "Gamifying requires
// measurements to evaluate". A score an agent can see is a score it can game, so a result counts only
// when something the agent cannot edit verified it, and the rows are information: this names no target.
//
// EVERY ROW HOLDS null FOR WHAT IT COULD NOT READ, never 0, because a 0 in the verified column or the
// tokens column would be the best number on the page. A row whose count is only part of the truth
// (a run with no receipt, a line nothing could parse) keeps the count and sets `floor`.
//
// Tokens here are input + cache write + output. Cache reads are reported apart: an agent rereads its
// own context on every call, so they grow with how long it ran and swamp what the job produced (the
// week's audit: 13.7M spent, 109M cache reads). The audit's row reproduces the plan's hand reading,
// 412k per confirmed defect, on this basis. The meter's workflow section totals them in.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listDirs, scanWorkflowAgents, stagesByType } from "./agents.mjs";
import { readFlow } from "./flow.mjs";
import { k } from "./render.mjs";

const AUDIT_WORKFLOW = "post-merge-audit";
/** Longer than any audit has run, so a run that began before the window is seen to have. */
const RUN_LOOKAROUND_MS = 24 * 3600000;

const spent = (totals) => totals.input + totals.cacheWrite + totals.output;
const within = (ms, w) => ms >= w.sinceMs && ms <= w.untilMs;
const plural = (n, one, many) => (n === 1 ? one : many);
const sumOf = (list, read) => list.reduce((sum, item) => sum + read(item), 0);

const job = (name, verifiedBy, fields = {}) => ({
  job: name,
  runs: null,
  tokens: null,
  verified: null,
  perVerified: null,
  verifiedBy,
  floor: false,
  spendsTokens: true,
  notes: [],
  ...fields,
});

/** A jsonl log's rows and how many lines were not one. A dropped line is a count someone can see. */
export function parseRows(text) {
  const rows = [];
  let unreadable = 0;
  for (const line of String(text).split("\n").filter(Boolean)) {
    try {
      const row = JSON.parse(line);
      if (row && typeof row === "object" && !Array.isArray(row)) rows.push(row);
      else unreadable += 1;
    } catch {
      unreadable += 1;
    }
  }
  return { present: true, rows, unreadable };
}

/** Absent and unreadable are one answer: this machine cannot say. */
function readLog(path) {
  try {
    return parseRows(readFileSync(path, "utf8"));
  } catch {
    return { present: false, rows: [], unreadable: 0 };
  }
}

/** A log's rows inside the window, and how many more could not be placed in any window. */
function placed(log, w) {
  const dated = log.rows.filter((row) => Number.isFinite(Date.parse(row.at)));
  return {
    rows: dated
      .filter((row) => within(Date.parse(row.at), w))
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    unplaced: log.unreadable + log.rows.length - dated.length,
  };
}

/** This workflow's runs, each with all its agents, oldest first: a run belongs to when it began. */
function auditRuns(agents, w) {
  const runs = new Map();
  for (const agent of agents.filter((a) => a.workflow === AUDIT_WORKFLOW)) {
    const run = runs.get(agent.run) ?? { began: Infinity, tokens: 0, cacheRead: 0, found: null };
    runs.set(agent.run, run);
    run.began = Math.min(run.began, Date.parse(agent.firstAt));
    run.tokens += spent(agent.totals);
    run.cacheRead += agent.totals.cacheRead;
  }
  return [...runs.values()].filter((r) => within(r.began, w)).sort((a, b) => a.began - b.began);
}

const isCount = (n) => Number.isInteger(n) && n >= 0;

/** One audit recorded twice: same PRs, same count. Left in, it would claim an older run's tokens. */
function distinctReceipts(receipts) {
  const seen = new Set();
  return receipts.filter((receipt) => {
    if (!Array.isArray(receipt.prs)) return true;
    const key = JSON.stringify([receipt.prs, receipt.confirmed]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Tokens per confirmed defect: two refuters stand behind each one, and the receipt carries the count.
 * Only a run with a readable receipt enters the ratio. Each receipt goes to the newest run that began
 * before it, so a run that died unreceipted cannot take a later run's defects, or add its tokens to
 * them. A run that began before the window is out too: its early agents are out of this reading.
 */
export function auditJob(agents, log, w, hasTranscripts) {
  const row = job("post-merge audit", "two refuters");
  const runs = auditRuns(agents, w);
  const { rows, unplaced } = placed(log, w);
  const receipts = distinctReceipts(rows);
  let orphans = 0;
  for (const receipt of receipts) {
    const run = runs.findLast((r) => r.found === null && r.began <= Date.parse(receipt.at));
    if (run) run.found = { confirmed: receipt.confirmed };
    else orphans += 1;
  }
  const readable = receipts.filter((r) => isCount(r.confirmed));
  const counted = runs.filter((r) => isCount(r.found?.confirmed));
  const noReceipt = runs.filter((r) => r.found === null);
  const badCounts = receipts.length - readable.length;
  const countedTokens = sumOf(counted, (r) => r.tokens);
  const countedConfirmed = sumOf(counted, (r) => r.found.confirmed);

  if (readable.length) row.verified = sumOf(readable, (r) => r.confirmed);
  if (countedConfirmed > 0) row.perVerified = Math.round(countedTokens / countedConfirmed);
  row.floor = row.verified !== null && noReceipt.length + badCounts + unplaced > 0;
  if (hasTranscripts) {
    row.runs = runs.length;
    // Receipts with no run in sight: their tokens exist, and this reading did not see them.
    row.tokens = runs.length || !receipts.length ? sumOf(runs, (r) => r.tokens) : null;
    row.cacheRead = sumOf(runs, (r) => r.cacheRead);
  } else
    row.notes.push("no transcripts could be read on this machine, so runs and tokens read unknown");

  if (rows.length > receipts.length) {
    const n = rows.length - receipts.length;
    row.notes.push(
      `${n} ${plural(n, "receipt repeats", "receipts repeat")} another and counted once`,
    );
  }
  if (noReceipt.length) {
    const n = noReceipt.length;
    row.notes.push(
      `${n} audit ${plural(n, "run has", "runs have")} no receipt, so ${plural(n, "its", "their")} ${k(sumOf(noReceipt, (r) => r.tokens))} tokens are not in the per-result figure`,
    );
  }
  if (hasTranscripts && orphans)
    row.notes.push(
      `${orphans} ${plural(orphans, "receipt has", "receipts have")} no run that began in this window, so ${plural(orphans, "it is", "they are")} not in the per-result figure`,
    );
  if (badCounts)
    row.notes.push(`${badCounts} ${plural(badCounts, "receipt holds", "receipts hold")} no count`);
  if (unplaced)
    row.notes.push(`${unplaced} receipt ${plural(unplaced, "line", "lines")} could not be read`);
  return row;
}

/** Green exits from ship.sh's log. A run with no outcome is neither a pass nor a failure. */
export function verifyJob(log, w) {
  const row = job("full verify", "its exit status", { spendsTokens: false });
  if (!log.present) {
    row.notes.push("no verify log could be read on this machine");
    return row;
  }
  const { rows, unplaced } = placed(log, w);
  if (!rows.length && unplaced) {
    row.notes.push(`${unplaced} verify ${plural(unplaced, "row", "rows")} could not be read`);
    return row;
  }
  const unread = unplaced + rows.filter((r) => typeof r.ok !== "boolean").length;
  row.runs = rows.length;
  row.verified = rows.filter((r) => r.ok === true).length;
  row.floor = unread > 0;
  if (unread) row.notes.push(`${unread} ${plural(unread, "row", "rows")} could not be read`);
  return row;
}

/**
 * Workflow stages by agent type, without the audit's: its tokens are on its own row and none count
 * twice. Nothing an agent cannot edit reads a stage's result yet, so verified stays unknown; a stage's
 * own report that it finished is the thing the plan will not count.
 */
export function stageJobs(agents, w, hasTranscripts) {
  const stages = agents.filter(
    (a) => a.workflow !== AUDIT_WORKFLOW && within(Date.parse(a.firstAt), w),
  );
  if (!hasTranscripts)
    return [
      job("workflow stages", "nothing yet", {
        notes: ["no transcripts could be read on this machine"],
      }),
    ];
  if (!stages.length) return [job("workflow stages", "nothing yet", { runs: 0, tokens: 0 })];
  return stagesByType(stages).map((type) => {
    const ofType = stages.filter((a) => a.agentType === type.type);
    return job(`stages: ${type.type}`, "nothing yet", {
      runs: type.n,
      tokens: sumOf(ofType, (a) => spent(a.totals)),
      cacheRead: sumOf(ofType, (a) => a.totals.cacheRead),
      medianFirstCall: type.median,
      notes: [`median first call ${k(type.median)}`],
    });
  });
}

/**
 * Failures on main and in contracts, and how many a later green run or passing contract verified. The
 * audit's episodes stay out: their clock stops at the fix merging, and no check stands behind that.
 * A fix's session is not linked to its failure, so tokens read unknown.
 */
export function fixJob(reading) {
  const row = job("fix a failure", "next green main run, or the contract passing");
  if (typeof reading === "string") {
    row.notes.push(reading);
    return row;
  }
  const episodes = [...reading.sources.mainCi.episodes, ...reading.sources.contracts.episodes];
  row.runs = episodes.length;
  row.verified = episodes.filter((e) => e.verifiedAt).length;
  row.notes.push("no fix is linked to the session that made it, so tokens read unknown");
  return row;
}

/**
 * The communication row: the flow meter's share. His next message accepting a result is the verifier
 * the plan names, and nothing reads that yet, so this carries the share and claims no result.
 */
export function flowJob(flow) {
  const row = job("communication", "nothing yet", { share: flow.share ?? null });
  if (flow.verdict !== "read") {
    row.notes.push(flow.line);
    return row;
  }
  row.runs = flow.typed;
  row.notes.push(
    `${flow.managing} of ${flow.typed} typed messages (${flow.share}%) manage a session, by rules that undercount, so compare this with earlier readings only`,
  );
  return row;
}

/** Every row. Local files, except `readFixes`, which the caller prices and wraps. */
export async function readJobs({ w, projectsDir, project, runsDir, readFixes }) {
  let hasTranscripts = listDirs(projectsDir).some((name) => name.startsWith(project));
  let agents = [];
  try {
    agents = await scanWorkflowAgents(
      projectsDir,
      project,
      w.sinceMs - RUN_LOOKAROUND_MS,
      w.untilMs + RUN_LOOKAROUND_MS,
    );
  } catch {
    // Worktree folders are swept while this runs: a part of the set is no reading of the whole.
    hasTranscripts = false;
  }
  const fixes = readFixes();
  return {
    window: w,
    rows: [
      auditJob(agents, readLog(join(runsDir, "post-merge-audit.jsonl")), w, hasTranscripts),
      verifyJob(readLog(join(runsDir, "ship-verify.jsonl")), w),
      ...stageJobs(agents, w, hasTranscripts),
      fixJob(fixes),
      flowJob(await readFlow(w)),
    ],
    rest: typeof fixes === "string" ? null : fixes.rest,
  };
}
