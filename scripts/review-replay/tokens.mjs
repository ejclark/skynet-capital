// What a review really cost per PR, by tier, read back from the run's own transcripts.
//
// The plan for the pre-merge reviewer (#6870) priced each tier by guess: light ~50k, standard ~125k,
// deep ~260k per round. Its first slice replaces the guesses with what the replay spent. Each
// workflow agent writes its usage beside its transcript; scripts/agent-meter/agents.mjs dedupes it by
// message, and the agent's label (`review #6039 (deep)`, `refute #6039 (deep)`) names its PR.
//
// Total = input + cache writes + cache reads + output, every call of the agent: what a round of review
// puts through a model. Cache reads are most of it and are billed at a tenth, so output is kept
// beside it.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { agentUsage } from "../agent-meter/agents.mjs";
import { readRun } from "../wf-read.mjs";

const PR_IN_LABEL = /#(\d+)/;

/** Every agent of one workflow run: its label and what it spent. */
export function readRunAgents(runDir) {
  return readRun(runDir)
    .agents.filter((agent) => agent.agentId)
    .map((agent) => {
      const path = join(runDir, `agent-${agent.agentId}.jsonl`);
      const usage = existsSync(path) ? agentUsage(readFileSync(path, "utf8").split("\n")) : null;
      const t = usage?.totals ?? { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
      return {
        label: agent.label ?? "",
        total: t.input + t.cacheWrite + t.cacheRead + t.output,
        output: t.output,
        calls: usage?.calls ?? 0,
      };
    });
}

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/** One row per PR (its reviewer and refuter summed) and one summary per tier. Lookups stay apart. */
export function tokensPerTier(agents, results) {
  const tierOfPr = new Map(results.map((row) => [row.pr, row.tier ?? "unknown"]));
  const perPr = new Map(
    results.map((row) => [
      row.pr,
      { pr: row.pr, tier: tierOfPr.get(row.pr), review: 0, refute: 0, output: 0, total: 0 },
    ]),
  );
  let lookups = 0;
  for (const agent of agents) {
    const row = perPr.get(Number(PR_IN_LABEL.exec(agent.label)?.[1]));
    if (!row) {
      lookups += agent.total;
      continue;
    }
    if (agent.label.startsWith("refute")) row.refute += agent.total;
    else row.review += agent.total;
    row.output += agent.output;
    row.total += agent.total;
  }
  const rows = [...perPr.values()];
  const tiers = {};
  for (const tier of [...new Set(rows.map((row) => row.tier))].sort()) {
    const inTier = rows.filter((row) => row.tier === tier);
    const totals = inTier.map((row) => row.total);
    tiers[tier] = {
      prs: inTier.length,
      median: median(totals),
      mean: Math.round(totals.reduce((a, b) => a + b, 0) / inTier.length),
      max: Math.max(...totals),
      medianReview: median(inTier.map((row) => row.review)),
      medianRefute: median(inTier.map((row) => row.refute)),
      medianOutput: median(inTier.map((row) => row.output)),
    };
  }
  const all = rows.reduce((sum, row) => sum + row.total, 0);
  return { perPr: rows, tiers, lookups, total: all + lookups };
}

const k = (n) => (n == null ? "—" : `${Math.round(n / 1000)}k`);

export function renderTokens({ tiers, lookups, total }) {
  const lines = Object.entries(tiers).map(
    ([tier, t]) =>
      `  ${tier}: ${t.prs} PRs · median ${k(t.median)} (review ${k(t.medianReview)}, refute ${k(t.medianRefute)}, output ${k(t.medianOutput)}) · mean ${k(t.mean)} · max ${k(t.max)}`,
  );
  return [
    `tokens per PR, by tier:`,
    ...lines,
    `  lookups ${k(lookups)} · run total ${k(total)}`,
  ].join("\n");
}
