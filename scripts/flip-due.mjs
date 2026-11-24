#!/usr/bin/env node
import { FLIP_REFUSALS_PATH, recentlyRefused } from "./flip-refusals.mjs";
// IS A CLEAR-PATH FLIP DUE? (#7311 slice 3, #8037 slice 2) — the cheap check that lets the flip
// start on its own.
//
// The lanes pull only `ready` work (docs/ISSUES.md → Ready), and readying an issue is the flip
// (.claude/workflows/clear-path-flip.js). On 2026-11-10 at 04:14Z the lanes had 0 buildable Ready
// items against a cap of 6, and a session flipped 26 of 62 issues by hand to refill them. Flipping
// ahead of need is not the goal ("what it never becomes is a way to keep a loop fed", ISSUES.md), so
// the first trigger is starvation: fewer pullable issues than the work dial's `inFlightCap`.
// docs/ROUTINES.md puts events before clocks; this is the event, read once.
//
// THE SECOND TRIGGER IS THE PILE (#8037 slice 2). Eric, 2026-11-23: "If backlog piles up, it's
// indication of problems that ... directly impedes development". Starvation alone left 92 of 99 open
// plans and 56 `feedback` issues unjudged while the lanes were never quite empty, because a fed loop
// never asks. So a flip is also due when more than FEEDBACK_PILE_MAX `feedback` issues wait for
// `ready`, or the oldest has waited more than FEEDBACK_OLDEST_DAYS (scripts/newsletter/backlog.mjs
// reads the same pile for the weekly page), even though the lanes are fed. This is not "keeping a
// loop fed": the batch is whatever the judge and two refuters clear, and the pile is the reason.
//
//   node scripts/flip-due.mjs [--json] [--max 6]
//
// THE READS, cheapest first. (1) The work dial (scripts/moneypenny/work-gate.mjs): `halt` or a
// tripped spend breaker says no and nothing else is read. (2) The open `ready` issues, ONE paginated
// REST read. (3) The open `feedback` issues, one more, which is how the pile is measured. (4) Only
// when a flip is due (starved or piled): the open `plan` issues and the refusals file on the
// `data/pr-review` ledger branch (scripts/flip-refusals.mjs).
//
// WHAT IS PULLABLE is `pullable()` (scripts/moneypenny/labels.mjs), the rule both lanes and
// /work-issues ask. It is called without the held-platter map, so an issue boarded on a platter
// counts as pullable here: that over-counts, which errs toward "fed" and a missed flip, never toward
// a flip nobody needed.
//
// WHAT IS LISTED. Open, not `ready`, not parked, not `in-progress`, not a parent whose work lives in
// sub-issues, not blocked by an open issue, not a filing matched to a known IA problem (`ia-<row>`:
// evidence on that row, which is fixed as a whole, #8005), and not refused by a flip in the last 7
// days; either a `feedback` issue, or (#8037 slice 2) a `plan` that nobody has touched for
// PLAN_UNTOUCHED_DAYS (a plan someone is still shaping is not yet a flip's to judge; the
// clear-path-flip workflow reads a plan's state block for its next slice). Ordered as `npm run rank`
// orders (class, kind, oldest); at most `--max` (6, the workflow's own cap, #6711), halved under
// `conserve`.
//
// A FAILED READ IS NEVER `due: false`. The dial, the issue list or the refusals file failing to read
// exits 1 with the reason, the way scripts/audit-due.mjs does: an unread queue must not pass for a
// fed one. A dial that answers "no" (halt, breaker) IS an answer and prints `due: false` with why.
import { isMain } from "./is-main.mjs";
import { ensureGhToken, ghRestAll } from "./moneypenny/gh.mjs";
import { notPullable, parkedBy } from "./moneypenny/labels.mjs";
import { workGate } from "./moneypenny/work-gate.mjs";
import {
  backlogStock,
  FEEDBACK_OLDEST_DAYS,
  FEEDBACK_PILE_MAX,
  PLAN_UNTOUCHED_DAYS,
} from "./newsletter/backlog.mjs";
import { readLedgerFile } from "./pr-review/ledger.mjs";
import { blocksOf, rankOrder, rankRow } from "./rank.mjs";

/** The flip workflow refuses more than this per run (clear-path-flip.js, #6711). */
export const DEFAULT_MAX = 6;

const names = (issue) => (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
const openIssues = (rows) => rows.filter((i) => !i.pull_request && i.state === "open");

/** A filing matched to a known IA problem is fixed with its row, never judged on its own (#8005). */
const isIaMatch = (label) => /^ia-U\d+$/.test(label);

/** Pure. How many of these open issues a lane may pull right now. */
export const pullableCount = (issues) => openIssues(issues).filter((i) => !notPullable(i)).length;

/** Pure. The batch size the dial allows: `--max`, halved (rounding up) under `conserve`. */
export const batchSize = (max, position) =>
  position === "conserve" ? Math.max(1, Math.ceil(max / 2)) : max;

/**
 * Pure. The pile of un-readied `feedback` issues, read by the same rule the weekly page uses
 * (`backlogStock`), and whether it is big or old enough to make a flip due on its own. An issue the
 * REST row gave no dates for reads as age unknown, never as old.
 */
export function feedbackPile(issues, now = Date.now()) {
  // An IA-matched filing is never listed, so it is not part of a pile the flip could clear either.
  const rows = openIssues(issues)
    .filter((i) => !names(i).some(isIaMatch))
    .map((i) => ({
      number: i.number,
      labels: names(i),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));
  const { unready, oldestDays } = backlogStock(rows, now).feedback;
  const oldest = Number.isFinite(oldestDays) ? oldestDays : null;
  const big = unready > FEEDBACK_PILE_MAX;
  const old = oldest !== null && oldest > FEEDBACK_OLDEST_DAYS;
  return { unready, oldestDays: oldest, piled: big || old };
}

/**
 * Pure. Open `feedback` issues, and `plan` issues untouched for PLAN_UNTOUCHED_DAYS → the ones worth
 * judging, top-ranked first. Returns the ranked list plus how many a recent refusal kept out, so
 * the verdict can say so.
 */
export function pickCandidates(issues, { refused = new Set(), now = Date.now() } = {}) {
  const rows = [];
  let skippedRefused = 0;
  const idle = (issue) => now - Date.parse(issue.updated_at) > PLAN_UNTOUCHED_DAYS * 86400000;
  for (const issue of openIssues(issues)) {
    const labels = names(issue);
    if (labels.includes("ready") || labels.includes("in-progress")) continue;
    const isPlan = labels.includes("plan") && !labels.includes("feedback");
    if (!(labels.includes("feedback") || (isPlan && idle(issue)))) continue;
    if (parkedBy(labels).length) continue;
    if (labels.some(isIaMatch)) continue;
    if (Number(issue.issue_dependencies_summary?.blocked_by) > 0) continue;
    const row = rankRow(issue, { blocks: blocksOf(issue), now });
    if (!row) continue;
    if (refused.has(issue.number)) {
      skippedRefused++;
      continue;
    }
    rows.push(row);
  }
  return { ranked: rankOrder(rows).map((r) => r.number), skippedRefused };
}

/**
 * Pure. The verdict from what was read. `pile` is `feedbackPile`'s reading; `candidates` is null
 * when neither trigger fired, so nothing was ranked.
 */
export function decide({ gate, ready, pile, candidates, max = DEFAULT_MAX }) {
  const cap = gate.caps?.inFlightCap ?? 0;
  const base = { position: gate.position, cap, max };
  if (!gate.dispatch) return { ...base, due: false, why: gate.reason };
  const pullable = pullableCount(ready);
  const starved = pullable < cap;
  const piled = pile?.piled === true;
  if (!(starved || piled)) {
    return {
      ...base,
      due: false,
      pullable,
      why: `the lanes are fed: ${pullable} pullable, cap ${cap}; the pile is ${pileWords(pile)}`,
    };
  }
  const because = [...(starved ? ["starved"] : []), ...(piled ? ["piled"] : [])];
  const batch = batchSize(max, gate.position);
  const issues = (candidates?.ranked ?? []).slice(0, batch);
  return {
    ...base,
    due: issues.length > 0,
    pullable,
    because,
    pile: pile ?? null,
    batch,
    issues,
    waiting: Math.max(0, (candidates?.ranked.length ?? 0) - issues.length),
    refusedRecently: candidates?.skippedRefused ?? 0,
    ...(issues.length
      ? {}
      : { why: `${because.join(" and ")}, but no unready issue is worth judging` }),
  };
}

/** Pure. The pile in words: how many wait and how long the oldest has. */
function pileWords(pile) {
  if (!pile) return "unread";
  const oldest = pile.oldestDays === null ? "age unknown" : `oldest ${pile.oldestDays}d`;
  return `${pile.unready} feedback waiting (${oldest}; flips are due over ${FEEDBACK_PILE_MAX} or ${FEEDBACK_OLDEST_DAYS}d)`;
}

const list = (nums) => nums.map((n) => `#${n}`).join(" ") || "none";

/** Pure. The verdict, for a person or a Routine reading the log. */
export function render(v) {
  if (!v.due) return `due: false · ${v.why}`;
  const lines = [
    `due: true · ${v.because.join(" and ")}: ${v.pullable} pullable against the in-flight cap of ${v.cap}, ${pileWords(v.pile)} (work-mode ${v.position})`,
    `flip: ${list(v.issues)}`,
    `left out: ${v.refusedRecently} refused by a flip in the last 7 days; ${v.waiting} more wait for the next run (batch ${v.batch})`,
    `run: the clear-path-flip workflow with ${JSON.stringify({ issues: v.issues })}, save its result as JSON, then`,
    "  node scripts/clear-path-post.mjs <file>   (it labels the survivors ready and records the refusals,",
    "  so the next check leaves them out for 7 days: scripts/flip-refusals.mjs, #7311)",
  ];
  return lines.join("\n");
}

const flag = (args, name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};

/**
 * The CLI. Seams: `gate`, `readReady`, `readFeedback`, `readPlans`, `readRefusals`, `now` — so a spec drives it
 * offline. Throws (exit 1) on any failed read.
 */
export function main(
  args,
  {
    gate = workGate,
    readReady = () => ghRestAll("issues?state=open&labels=ready"),
    readFeedback = () => ghRestAll("issues?state=open&labels=feedback"),
    readPlans = () => ghRestAll("issues?state=open&labels=plan"),
    readRefusals = () => readLedgerFile(FLIP_REFUSALS_PATH)?.body ?? "",
    token = ensureGhToken,
    now = () => Date.now(),
  } = {},
) {
  const rawMax = flag(args, "--max");
  if (
    rawMax !== undefined &&
    (!/^\d+$/.test(rawMax) || Number(rawMax) < 1 || Number(rawMax) > DEFAULT_MAX)
  )
    throw new Error(`--max needs a whole number from 1 to ${DEFAULT_MAX} (the workflow's cap)`);
  const max = rawMax === undefined ? DEFAULT_MAX : Number(rawMax);
  token();
  const verdictOfGate = gate();
  let ready = [];
  let pile = null;
  let candidates = null;
  if (verdictOfGate.dispatch) {
    ready = readReady();
    const cap = verdictOfGate.caps?.inFlightCap ?? 0;
    const feedback = readFeedback();
    pile = feedbackPile(feedback, now());
    if (pullableCount(ready) < cap || pile.piled) {
      const refused = recentlyRefused(readRefusals(), now());
      const seen = new Set(feedback.map((i) => i.number)); // a plan + feedback issue arrives twice
      const plans = readPlans().filter((i) => !seen.has(i.number));
      candidates = pickCandidates([...feedback, ...plans], { refused, now: now() });
    }
  }
  const verdict = decide({ gate: verdictOfGate, ready, pile, candidates, max });
  return args.includes("--json") ? JSON.stringify(verdict, null, 2) : render(verdict);
}

if (isMain(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`✗ flip-due: ${String(err?.message ?? err).split("\n")[0]} — not a due: false`);
    process.exitCode = 1;
  }
}
