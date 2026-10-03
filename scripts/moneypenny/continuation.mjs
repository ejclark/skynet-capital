#!/usr/bin/env node
// MONEYPENNY — CONTINUATION (#3818 slice 8, sub-issue #4295; criteria 9–10). The one job: **a ready
// plan keeps going after its slice lands, without Eric re-queuing it.**
//
//   node scripts/moneypenny/continuation.mjs            # what would happen, touching nothing
//   node scripts/moneypenny/continuation.mjs --json     # the same decisions as JSON
//
// WHAT WAS STOPPING. A plan's slice PR merges; the build session removes `in-progress` and ends.
// The plan still carries `ready`, but its lease (`claim/plan-<n>`) outlives a SUCCESSFUL build — only
// a failed one releases it — so the retry sweep steps past it for the lease's full 2h TTL
// (`SWEEP_HELD_SKIPS`, index.mjs) and claims something else in rank order instead. The plan then
// waits for a human to notice. Measured shape of that wait on this plan's own thread: #3665 idle
// since 09-24; slices 1–7 here each needed a session Eric started or a ready-flip he said.
//
// WHY A SEPARATE DECISION AND NOT JUST "RANK IT HIGHER". Continuing is only safe when the PREVIOUS
// slice is provably finished, and "finished" is four facts, not one: the plan is pullable (not
// parked, not `in-progress`), no PR is still open on `plan/<n>`, the run this lane last dispatched
// has concluded, and the state block MOVED (a build that ended without editing its own block did
// not do the work the block describes). Rank order knows none of that. So this file asks those four
// questions, and only then puts the plan at the head of the queue.
//
// CRITERION 10 IS THE OTHER HALF, AND IT IS WHY THIS IS NOT A LOOP. A continued slice that fails, or
// that leaves the state block unchanged, STOPS the plan: `needs-eric` goes on (which parks it for
// every puller, by the one pull rule in labels.mjs), Eric is assigned, and the comment carries the
// run link. One failure ends the chain — never a retry, never a second opinion. The two bounds above
// that are the work spigot's own `continuationsPerDay` (work-mode.json, so `halt` stops continuation
// dead and `conserve` allows one) and `CONTINUED_MODEL`, which is deliberately below the top tier:
// an already-planned next slice off a written state block is not the ask that needs Opus.
//
// WHY THE PUSH SWEEP AND THE CLAIM PATH, NOT A WORKFLOW STEP. Same reasoning slice 5 recorded in
// assignments.mjs: `.github/workflows/**` is Eric's carve-out and never auto-merges, and this plan
// had three of his merges to spend. The sweep already runs `index.mjs` with the App token on every
// push (criterion 9's "with the App token" — a GITHUB_TOKEN dispatch hides the run's own failure,
// LESSONS.md 2026-09-08), and `--claim-next` already runs on the re-dispatched scan. So the stop
// half rides the sweep's intents and the continue half rides `claimNext`'s pick. No workflow edit.
//
// SHAPE — decide/do, like every other lane here: `continuationDecision` is pure (one plan's issue,
// comments, sub-issues and run outcomes in; one verdict out), `gatherContinuationDeps` is the only
// part that reads GitHub, and `routeContinuation`/`pickContinuation` are pure selectors over the
// gathered data. Every branch is specced from data in tests/scripts/moneypenny/continuation.spec.ts.
import { createHash } from "node:crypto";

import { admitBuild, readInFlight } from "./admission.mjs";
import { ASSIGN_MARKER, executeAssignments } from "./assignments.mjs";
import { ERIC, NEEDS_ERIC } from "./decision-callout.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, notPullableReason } from "./labels.mjs";
import { derivePrIssues } from "./pr-issues.mjs";
import { readWorkMode } from "./work-mode.mjs";

/** The receipt this lane leaves when it continues a plan — and its memory of having done so. */
export const CONTINUE_MARKER = "<!-- moneypenny:continued";
/** The marker on a criterion-10 stop, so an unparked plan is never re-stopped for the same run. */
export const STOP_MARKER = "<!-- moneypenny:continue-stopped -->";

/**
 * The model a continued slice builds on (criterion 9: "below the top model tier"). A continuation
 * is the one build in this repo whose scope is already written down — the state block names the
 * slice, its inputs and its done line — so the judgment Opus is for was spent at planning time.
 * `modelTier` would hand every plan Opus, because a plan carries no `skynet-spec` block; this
 * overrides that for continuations only.
 */
export const CONTINUED_MODEL = "claude-sonnet-5";

/** How recently a plan's slice PR must have merged for its plan to be a continuation candidate.
 *  The screen exists for cost: 27 open `ready` plans × (comments + sub-issues + runs) on every push
 *  is ~100 REST calls for an answer that is almost always "nothing merged". A plan whose slice
 *  landed longer ago than this is not abandoned — it is just the ordinary retry sweep's job again. */
export const MERGE_WINDOW_HOURS = 24;

/** How long a dispatched continuation may go unreported before silence counts as failure. Past the
 *  build jobs' own ceilings (the lane's step timeout is 110 min), so a run still "in progress" here
 *  is wedged, not working — and criterion 10's answer to a wedged slice is the same as to a failed
 *  one: stop, and assign. */
export const STALL_HOURS = 3;

const DAY_MS = 864e5;
const PLAN_BRANCH = /^plan\/(\d+)$/;

const firstLine = (body) =>
  String(body ?? "")
    .trim()
    .split("\n")[0]
    .trim();

/**
 * The plan's state block — the newest comment whose first line is its heading (`docs/ISSUES.md` →
 * *The state block*). The block, never the thread, is what names the next slice; a plan with no
 * block is not continuable, because there is nothing to say what "the next slice" means.
 *
 * @returns {{ id?: number, body: string, updatedAt?: string } | null}
 */
export function stateBlockOf(comments = []) {
  const blocks = (comments ?? []).filter((c) => /^##\s+state block/i.test(firstLine(c?.body)));
  const newest = blocks[blocks.length - 1];
  return newest ? { id: newest.id, body: String(newest.body), updatedAt: newest.updated_at } : null;
}

/**
 * The block's next-pickup text, whitespace-collapsed — the fallback target when a plan has no open
 * sub-issues left (#4056's correction to this slice: "target the next open, unblocked sub-issue
 * when one exists; fall back to the state block otherwise").
 *
 * BOTH REAL SHAPES MATCH, and the looser pattern is why. `docs/ISSUES.md` writes the canonical form
 * with the bold spanning the whole line (`**Next pickup: slice 3, …. One PR.**`), while live blocks
 * (#3818's own, #4450's, #4469's) bold only the label (`**Next pickup:** slice 8 …`). A pattern
 * pinned to either one reads the other as "no pickup named", which is a refusal to continue a plan
 * that said exactly where to go — so the label is matched, its punctuation eaten, and the rest of
 * the paragraph taken as the text.
 */
export function nextPickupOf(blockBody) {
  const m = /\*\*next pickup\b[:*\s]*([\s\S]*?)(?:\n\s*\n|$)/i.exec(String(blockBody ?? ""));
  if (!m) return null;
  return m[1].replace(/\*\*/g, "").replace(/\s+/g, " ").trim() || null;
}

/**
 * A short, stable fingerprint of the state block — how criterion 10 answers "did the slice leave the
 * block unchanged?". A hash, not the comment's `updated_at`: the lane edits the block in place with
 * `gh api --method PATCH`, and an edit that rewrites the same text (a retry, a reformat) bumps the
 * timestamp while changing nothing a reader would call progress.
 */
export function blockFingerprint(blockBody) {
  const text = String(blockBody ?? "")
    .replace(/\r/g, "")
    .trim();
  return text ? createHash("sha256").update(text).digest("hex").slice(0, 12) : "";
}

/** The hidden data line on a receipt: this lane's whole memory of a dispatch. */
const receiptData = ({ runId, fingerprint, target }) =>
  `${CONTINUE_MARKER} ${JSON.stringify({ run: String(runId ?? ""), block: fingerprint, target })} -->`;

/** One receipt's data back out of a comment body, or `null` when it carries none. */
export function parseReceipt(body) {
  const m = new RegExp(`${CONTINUE_MARKER}\\s*(\\{.*?\\})\\s*-->`).exec(String(body ?? ""));
  if (!m) return null;
  try {
    const d = JSON.parse(m[1]);
    return { runId: String(d.run ?? ""), fingerprint: String(d.block ?? ""), target: d.target };
  } catch {
    return null;
  }
}

/** Every receipt this lane has left on one plan, oldest first — the daily cap's counter. */
export function allReceiptsOf(comments = []) {
  return (comments ?? [])
    .map((c) => ({
      createdAt: c?.created_at ?? c?.createdAt ?? "",
      body: String(c?.body ?? ""),
      data: parseReceipt(c?.body),
    }))
    .filter((r) => r.data)
    .map((r) => ({ createdAt: r.createdAt, ...r.data }));
}

/**
 * The receipts a criterion-10 judgment may look at: only those NEWER than the last stop. A stop
 * ends that chain — once Eric clears the parking label, the next continuation starts fresh rather
 * than re-judging the run he already saw and deliberately resumed past. (Without this, an unparked
 * plan would be stopped again on the same evidence forever.)
 *
 * The DAILY CAP deliberately reads `allReceiptsOf` instead, so a stop-then-unpark cycle still
 * counts against the dial's `continuationsPerDay` — otherwise clearing the label would also clear
 * the day's budget.
 */
export function receiptsOf(comments = []) {
  const stops = (comments ?? []).filter((c) => String(c?.body ?? "").includes(STOP_MARKER));
  const newestStop = stops[stops.length - 1];
  const since = newestStop
    ? Date.parse(newestStop.created_at ?? newestStop.createdAt ?? "")
    : -Infinity;
  return allReceiptsOf(comments).filter((r) => Date.parse(r.createdAt) > since);
}

/**
 * The next slice to take: the first open sub-issue whose every blocker is closed (#4056's
 * correction). Order is the sub-issue list's own, which GitHub returns in the order they were
 * attached — the plan's slicing order.
 *
 * @param blockedBy map of sub-issue number → its blocker issues (`[{ state }]`)
 */
export function nextSubIssue(subIssues = [], blockedBy = {}) {
  return (
    (subIssues ?? [])
      .filter((s) => (s?.state ?? "open") === "open")
      .find((s) => (blockedBy?.[s.number] ?? []).every((b) => (b?.state ?? "open") !== "open")) ??
    null
  );
}

/**
 * The verdict on the last continuation this lane dispatched, or `null` when the chain may continue.
 * Criterion 10's whole rule: a run that failed, a run that never reported, or a run that left the
 * state block untouched all stop the plan — and nothing retries.
 */
function judgePriorRun(receipt, { runs = {}, fingerprint, now }) {
  const run = runs[receipt.runId] ?? null;
  const hours = (now - Date.parse(receipt.createdAt)) / 36e5;
  const stop = (reason) => ({
    action: "stop",
    reason,
    runId: receipt.runId,
    runUrl: run?.url ?? runUrlFor(receipt.runId),
  });
  if (run?.status !== "completed") {
    if (hours >= STALL_HOURS) {
      return stop(
        `the continued slice's run has not reported in ${Math.floor(hours)}h (${run?.status ?? "unreadable"})`,
      );
    }
    return {
      action: "skip",
      reason: `the continued run is still going (${run?.status ?? "unread"})`,
    };
  }
  if (run.conclusion !== "success") {
    return stop(`the continued slice's run concluded \`${run.conclusion}\``);
  }
  if (receipt.fingerprint && receipt.fingerprint === fingerprint) {
    return stop("the continued slice left the state block unchanged");
  }
  return null;
}

/** The Actions run link, built from the repo env so a receipt is readable without another read. */
function runUrlFor(runId) {
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  return runId ? `${server}/${repo}/actions/runs/${runId}` : "";
}

/**
 * One plan's verdict. Pure — every read is already in `candidate`.
 *
 * @param candidate { plan, comments, subIssues, blockedBy, openPlanPr, runs }
 * @returns {{ number, action: "continue"|"stop"|"skip", reason, ... }}
 */
export function continuationDecision(candidate = {}, { caps = {}, now = Date.now() } = {}) {
  const plan = candidate.plan ?? {};
  const base = { number: plan.number, title: plan.title ?? "" };
  const skip = (reason) => ({ ...base, action: "skip", reason });
  const notPullable = notPullableReason(plan);
  if (notPullable) return skip(notPullable);
  if (candidate.openPlanPr) {
    return skip(
      `#${candidate.openPlanPr} is still open on \`plan/${plan.number}\` — one slice in flight per plan`,
    );
  }
  const block = stateBlockOf(candidate.comments);
  if (!block) return skip(`#${plan.number} carries no state block — nothing names the next slice`);
  const fingerprint = blockFingerprint(block.body);
  const receipts = receiptsOf(candidate.comments);
  const last = receipts[receipts.length - 1];
  if (last) {
    const verdict = judgePriorRun(last, { runs: candidate.runs, fingerprint, now });
    if (verdict) return { ...base, ...verdict };
  }
  const cap = caps.continuationsPerDay ?? 0;
  const today = allReceiptsOf(candidate.comments).filter(
    (r) => now - Date.parse(r.createdAt) < DAY_MS,
  ).length;
  if (today >= cap) {
    return skip(`${today} of ${cap} continuations already dispatched for #${plan.number} today`);
  }
  const sub = nextSubIssue(candidate.subIssues, candidate.blockedBy);
  const pickup = nextPickupOf(block.body);
  if (!(sub || pickup)) {
    return skip(
      `#${plan.number}'s block names no next pickup and no open, unblocked slice remains`,
    );
  }
  return {
    ...base,
    action: "continue",
    issue: plan,
    target: sub?.number ?? plan.number,
    pickup: sub ? `#${sub.number} — ${sub.title ?? ""}`.trim() : pickup,
    fingerprint,
    reason: sub
      ? `the next open, unblocked slice is #${sub.number}`
      : `the state block names: ${pickup}`,
  };
}

/** Every candidate's verdict, in the gather's order. Pure. */
export function decideContinuations(deps = {}) {
  const { continuations, now = Date.now() } = deps;
  if (!continuations) return [];
  const { candidates = [], caps = {} } = continuations;
  return candidates.map((c) => continuationDecision(c, { caps, now }));
}

/** The receipt a continuation leaves on the plan — and the data criterion 10 later reads back. */
export function receiptBody({ pickup, target, runId, fingerprint, model = CONTINUED_MODEL }) {
  return [
    "**Continuing this plan** — a slice landed, so the next one starts without a fresh ready-flip.",
    "",
    `- Taking: ${pickup}`,
    `- Build run: ${runUrlFor(runId) || "this run"}`,
    `- Model: \`${model}\` — below the top tier, per this plan's criterion 9.`,
    "",
    "If that build fails or leaves the state block unchanged, this lane stops continuing this plan " +
      "and assigns Eric with the run link (criterion 10). Nothing needed from anyone here.",
    "",
    receiptData({ runId, fingerprint, target }),
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

/** Criterion 10's comment: what stopped, which run proves it, and what clearing the label does. */
export function stopComment(decision) {
  return [
    `@${ERIC} — **this plan has stopped continuing itself.** One decision: resume it, or say what to fix first.`,
    "",
    `- Why: ${decision.reason}.`,
    `- The run: ${decision.runUrl || "unavailable"}`,
    `- Clearing \`${NEEDS_ERIC}\` from this issue is the resume — the unpark wakes the lane again.`,
    "",
    "Nothing retries on its own: one failed continuation ends the chain by design, so a wedged plan " +
      "cannot spend a session per push.",
    "",
    STOP_MARKER,
    ASSIGN_MARKER,
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

/**
 * The sweep's half: criterion 10's stops as intents `index.mjs` can execute. Pure, and a no-op
 * without `deps.continuations` — every non-push event and every pre-slice-8 fixture routes exactly
 * as it did before.
 *
 * The continue half is NOT here: a claim can only happen in a run `claude-code-action` will accept,
 * which is the re-dispatched scan, so `claimNext` asks `pickContinuation` instead (#4359's wall).
 */
export function routeContinuation(deps = {}) {
  return decideContinuations(deps)
    .filter((d) => d.action === "stop")
    .map((d) => ({
      kind: "stop-continuation",
      issueNumber: d.number,
      title: d.title,
      reason: d.reason,
      runUrl: d.runUrl,
      body: stopComment(d),
    }));
}

/**
 * The claim path's half: the first plan to continue that the admission gate would also admit, or
 * `null`. Asking the gate here keeps the push tick's `has_next` honest — a pick the gate would
 * queue is not worth re-dispatching a run for. `claimPlan` still asks it authoritatively.
 */
export function pickContinuation(deps = {}) {
  const { inFlight = [], mode } = deps;
  return (
    decideContinuations(deps).find(
      (d) => d.action === "continue" && admitBuild({ issue: d.issue, inFlight, mode }).admit,
    ) ?? null
  );
}

/** Carry out one criterion-10 stop: park the plan FIRST, then assign and say why.
 *
 *  Order matters and is not symmetry. `needs-eric` is what makes the plan unpullable (labels.mjs's
 *  one pull rule), so landing it first means a scan racing this write cannot claim a plan this lane
 *  has already judged dead. The assignment and its comment reuse `executeAssignments` outright —
 *  assign-then-comment, each retried for a 5xx, for the reasons that function's own header records. */
export function executeStopContinuation(intent, { run = sh, retry = withRetry, assign } = {}) {
  retry(() => run("gh", ["issue", "edit", String(intent.issueNumber), "--add-label", NEEDS_ERIC]));
  (assign ?? executeAssignments)(
    {
      kind: "assign-eric",
      number: intent.issueNumber,
      title: intent.title,
      criterion: 10,
      why: intent.reason,
      body: intent.body,
    },
    { run, retry },
  );
  return `🛑 stopped continuing #${intent.issueNumber} — ${intent.reason} (assigned @${ERIC})`;
}

/** Post the receipt for a dispatched continuation. Called after the claim wins, never before. */
export function postContinuationReceipt(
  pick,
  { run = sh, retry = withRetry, runId = process.env.GITHUB_RUN_ID } = {},
) {
  const body = receiptBody({ ...pick, runId });
  retry(() => run("gh", ["issue", "comment", String(pick.number), "--body", body]));
  return body;
}

// ── the impure half: the only code here that reads GitHub ─────────────────────

const restOr = (path, fallback) => {
  try {
    return ghRest(path);
  } catch {
    return fallback;
  }
};

/**
 * Which open PR, if any, is still building each issue — `derivePrIssues` (pr-issues.mjs, #4393's
 * "observe, don't remember"), not the branch name.
 *
 * The branch was the obvious oracle and it is the wrong one: a plan's slices are not all built on
 * `plan/<n>`. #4450's slice 1 shipped on `feat/playbook-roll-call` and its slice 2 on `plan/4450`,
 * so a branch-only check would have read "nothing in flight" while an interactive session was
 * mid-slice — two builds on one plan, both editing the same state block. The PR-names-the-issue
 * rules already cover every build path (`Closes #n`, `Part of #n`, a bare `#n` in the title, the
 * branch's own number), which is exactly the gap #4393 closed for the in-flight cap.
 */
function openPrsByIssue(openPrs = []) {
  const byIssue = new Map();
  for (const pr of openPrs) {
    const named = derivePrIssues({
      title: pr?.title,
      body: pr?.body,
      headRef: pr?.head?.ref,
    });
    for (const n of named) if (!byIssue.has(n)) byIssue.set(n, pr.number);
  }
  return byIssue;
}

/**
 * Which plans could be continuing right now, and everything the decision needs about each.
 *
 * TWO CHEAP READS SCREEN FIRST (see `MERGE_WINDOW_HOURS`): the open PRs — the "a slice is still in
 * flight" oracle above — and the most recently updated closed PRs, which is where a slice branch
 * that merged in the window shows up. Only the plans those two name get the per-plan reads
 * (comments, sub-issues, blockers, the last run's outcome), so a quiet tick costs two calls.
 */
export function gatherContinuationDeps({ now = Date.now(), mode = readWorkMode() } = {}) {
  const open = ghRest("pulls?state=open&per_page=100") ?? [];
  const closed = ghRest("pulls?state=closed&sort=updated&direction=desc&per_page=100") ?? [];
  const inFlightPr = openPrsByIssue(open);
  const candidates = [];
  const seen = new Set();
  for (const pr of closed) {
    const n = Number(PLAN_BRANCH.exec(pr?.head?.ref ?? "")?.[1]);
    const mergedMs = Date.parse(pr?.merged_at ?? "");
    if (!n || seen.has(n) || Number.isNaN(mergedMs)) continue;
    if (now - mergedMs > MERGE_WINDOW_HOURS * 36e5) continue;
    seen.add(n);
    candidates.push(readCandidate(n, { openPlanPr: inFlightPr.get(n) }));
  }
  return { candidates, caps: mode.caps ?? {} };
}

/** Everything one candidate plan's verdict reads, as plain data. */
function readCandidate(n, { openPlanPr }) {
  const plan = ghRest(`issues/${n}`);
  const comments = ghRestAll(`issues/${n}/comments`);
  const subIssues = restOr(`issues/${n}/sub_issues?per_page=100`, []) ?? [];
  const blockedBy = {};
  for (const s of subIssues.filter((x) => (x?.state ?? "open") === "open").slice(0, 5)) {
    blockedBy[s.number] = restOr(`issues/${s.number}/dependencies/blocked_by`, []) ?? [];
  }
  const last = receiptsOf(comments).slice(-1)[0];
  const runs = {};
  if (last?.runId) {
    const r = restOr(`actions/runs/${last.runId}`, null);
    if (r) runs[last.runId] = { status: r.status, conclusion: r.conclusion, url: r.html_url };
  }
  return { plan, comments, subIssues, blockedBy, openPlanPr, runs };
}

/** `gatherContinuationDeps` plus the live admission inputs — what both call sites need. */
export function continuationContext({ now = Date.now() } = {}) {
  const mode = readWorkMode();
  return {
    continuations: gatherContinuationDeps({ now, mode }),
    inFlight: readInFlight(),
    mode,
    now,
  };
}

function main(argv) {
  const ctx = continuationContext();
  const decisions = decideContinuations(ctx);
  if (argv.includes("--json")) {
    console.log(JSON.stringify({ caps: ctx.continuations.caps, decisions }, null, 2));
    return;
  }
  if (!decisions.length) {
    console.log("· no plan has a slice PR merged in the last 24h — nothing to continue");
    return;
  }
  for (const d of decisions) {
    const head = d.action === "continue" ? `▶ continue #${d.number}` : `${d.action} #${d.number}`;
    console.log(`${head} — ${d.reason}${d.pickup ? ` → ${d.pickup}` : ""}`);
  }
  const pick = pickContinuation(ctx);
  console.log(
    pick
      ? `\nThe next push would dispatch #${pick.number} (${pick.pickup}) on ${CONTINUED_MODEL}.`
      : "\nNothing would be dispatched this tick.",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
