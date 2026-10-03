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
// gathered data. Reading the state block itself is one file over — `state-block.mjs`, the single
// parser for the format `docs/ISSUES.md` defines, so a later reader of that block imports it rather
// than re-deriving the regexes. Every branch is specced from data in
// tests/scripts/moneypenny/continuation.spec.ts.
import { admitBuild, readInFlight } from "./admission.mjs";
import { ASSIGN_MARKER, executeAssignments } from "./assignments.mjs";
import { ERIC, NEEDS_ERIC } from "./decision-callout.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS, labelNames, notPullableReason } from "./labels.mjs";
import { derivePrIssues } from "./pr-issues.mjs";
import {
  allReceiptsOf,
  blockFingerprint,
  nextPickupOf,
  receiptBody,
  receiptsOf,
  STOP_MARKER,
  stateBlockOf,
} from "./state-block.mjs";
import { readWorkMode } from "./work-mode.mjs";

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

/** Plans one tick looks at in full, newest merge first. The screen below can name more than one
 *  plan on a busy day; each costs several REST calls, and the decision is level-based, so an
 *  overflowed candidate is simply looked at on the next push (still inside the window above). */
export const MAX_CANDIDATES = 5;

/** Stops one tick may make (criterion 10). The same blast-radius bound as `ASSIGN_CAP`, set lower
 *  because each stop both PARKS a plan and spends one of Eric's interrupts: a wrong gather costs
 *  one park and one assignment, not every candidate plan at once. A second wedged plan waits for
 *  the next push, which is minutes away. */
export const STOP_CAP = 1;

/** How many open sub-issues one candidate reads blockers for. Past this the answer is UNKNOWN, and
 *  `nextSubIssue` refuses an unknown rather than guessing it unblocked (see its header). */
const BLOCKER_READS = 10;

const DAY_MS = 864e5;

/**
 * The next slice to take: the first open sub-issue whose every blocker is closed (#4056's
 * correction). Order is the sub-issue list's own, which GitHub returns in the order they were
 * attached — the plan's slicing order.
 *
 * AN UNREAD BLOCKER LIST IS UNKNOWN, NEVER "UNBLOCKED". The gather reads blockers for the first
 * `BLOCKER_READS` open slices only, so a sub-issue with no entry in `blockedBy` has not been asked
 * about — and treating that as "no blockers" would dispatch a slice whose dependency is still open,
 * which is precisely the check #4056 asked for. A plan deep enough to run past that bound falls
 * back to the block's next-pickup line instead, which a human wrote.
 *
 * @param blockedBy map of sub-issue number → its blocker issues (`[{ state }]`)
 */
export function nextSubIssue(subIssues = [], blockedBy = {}) {
  const known = (s) => Object.hasOwn(blockedBy ?? {}, s.number);
  return (
    (subIssues ?? [])
      .filter((s) => s && (s.state ?? "open") === "open")
      .find((s) => known(s) && blockedBy[s.number].every((b) => (b?.state ?? "open") !== "open")) ??
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
  // A READ THAT FAILED IS NOT A RUN THAT FAILED. The gather marks the difference (`unreadable` for
  // a 5xx or a network blip, `missing` for GitHub answering 404), because the two deserve opposite
  // answers: parking a plan and spending one of Eric's interrupts over a transient API error is the
  // worst outcome available here, so an unreadable run always waits for a later tick. A plan left
  // waiting on a permanently unreadable run is visible to the stall audit; a plan parked wrongly is
  // not visible to anything.
  if (run?.status === "unreadable") {
    return { action: "skip", reason: `the continued run ${receipt.runId} could not be read` };
  }
  if (run?.status !== "completed") {
    if (hours >= STALL_HOURS) {
      return stop(
        `the continued slice's run has not reported in ${Math.floor(hours)}h (${run?.status ?? "no run found"})`,
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
  // THE LANE CHECK COMES FIRST, and it is not redundant with `claimPlan`'s own. The screen below
  // finds candidates from merged PRs, which name feedback issues and loose references too; without
  // this, such an issue could sit permanently in `continue`, making `has_next` true on every push
  // and burning a dispatch run that `claimPlan` then always refuses (it requires the `plan` label).
  if (!labelNames(plan.labels).includes(LABELS.plan.name)) {
    return skip(`#${plan.number} does not carry the \`plan\` label — not this lane's`);
  }
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
    // The merge that made this plan continuable — `continueNext`'s lease check compares against it
    // (a lease stamped AFTER the merge belongs to a claim that is still alive).
    mergedMs: candidate.mergedMs,
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
  const stops = decideContinuations(deps).filter((d) => d.action === "stop");
  if (stops.length > STOP_CAP) {
    // stderr only — stdout carries machine-read output on some of this router's call paths.
    console.error(
      `::notice::continuation — stopping ${STOP_CAP} of ${stops.length} wedged plan(s) this tick ` +
        `(cap ${STOP_CAP}); the rest follow on later pushes.`,
    );
  }
  return stops.slice(0, STOP_CAP).map((d) => ({
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
  // The lane's own policy (which model, which footer, where the run lives) stays here; the receipt's
  // FORMAT lives with the parser that reads it back, in state-block.mjs.
  const body = receiptBody({
    ...pick,
    runId,
    runUrl: runUrlFor(runId),
    model: CONTINUED_MODEL,
    footer: FOOTER,
  });
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
 * flight" oracle above — and the most recently updated closed PRs, which is where a slice that
 * merged in the window shows up. Only the plans those two name get the per-plan reads (comments,
 * sub-issues, blockers, the last run's outcome), so a quiet tick costs two calls.
 *
 * THE SAME ORACLE ON BOTH SIDES: a merged PR's plan is whatever it NAMES, not what its branch is
 * called, for the reason `openPrsByIssue` records — slices ship on `feat/*` as readily as on
 * `plan/<n>`, and a branch-only screen would mean criterion 9 silently never fired for them.
 *
 * The looser oracle names more than plans (a merged PR citing three issues names three), and on a
 * 57-merge day the newest few are mostly feedback issues — which would crowd a cap-bounded
 * candidate list and starve the lane it exists for. So the open `plan` issues are read ONCE (paged,
 * because 95 of them exist today and a single page would silently drop the rest) and the screen is
 * the intersection: every candidate is already a plan, and its labels and body come from that same
 * read rather than a call each.
 */
export function gatherContinuationDeps({ now = Date.now(), mode = readWorkMode() } = {}) {
  const plans = new Map(
    ghRestAll(`issues?state=open&labels=${LABELS.plan.name}`)
      .filter((i) => !i.pull_request)
      .map((i) => [i.number, i]),
  );
  const open = ghRest("pulls?state=open&per_page=100") ?? [];
  const closed = ghRest("pulls?state=closed&sort=updated&direction=desc&per_page=100") ?? [];
  const inFlightPr = openPrsByIssue(open);
  const merged = new Map();
  for (const pr of closed) {
    const mergedMs = Date.parse(pr?.merged_at ?? "");
    if (Number.isNaN(mergedMs) || now - mergedMs > MERGE_WINDOW_HOURS * 36e5) continue;
    const named = derivePrIssues({ title: pr?.title, body: pr?.body, headRef: pr?.head?.ref });
    // Newest merge wins the timestamp: it is what the lease check compares against, and a lease
    // taken after the LAST merge is a live claim, whichever earlier slice also named this plan.
    for (const n of named) if (plans.has(n) && !merged.has(n)) merged.set(n, mergedMs);
  }
  const candidates = [...merged.entries()]
    .slice(0, MAX_CANDIDATES)
    .map(([n, mergedMs]) =>
      readCandidate(plans.get(n), { openPlanPr: inFlightPr.get(n), mergedMs }),
    );
  return { candidates, caps: mode.caps ?? {} };
}

/**
 * The last dispatched run's outcome, with a READ FAILURE told apart from a missing run.
 * `judgePriorRun`'s header says why the difference matters; `withRetry` is what makes `unreadable`
 * mean "GitHub is still refusing after three tries", not "one packet dropped".
 */
function readRunOutcome(runId) {
  try {
    const r = withRetry(() => ghRest(`actions/runs/${runId}`));
    return r ? { status: r.status, conclusion: r.conclusion, url: r.html_url } : { status: "none" };
  } catch (err) {
    const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
    return /\b404\b/.test(text) ? { status: "none" } : { status: "unreadable" };
  }
}

/** Everything one candidate plan's verdict reads, as plain data. The plan issue itself came from
 *  the screen's own paged read, so this adds the per-plan calls and nothing else. */
function readCandidate(plan, { openPlanPr, mergedMs }) {
  const n = plan.number;
  const comments = ghRestAll(`issues/${n}/comments`);
  const subIssues = restOr(`issues/${n}/sub_issues?per_page=100`, []) ?? [];
  const blockedBy = {};
  for (const s of subIssues
    .filter((x) => (x?.state ?? "open") === "open")
    .slice(0, BLOCKER_READS)) {
    blockedBy[s.number] = restOr(`issues/${s.number}/dependencies/blocked_by`, []) ?? [];
  }
  const last = receiptsOf(comments).slice(-1)[0];
  const runs = {};
  if (last?.runId) runs[last.runId] = readRunOutcome(last.runId);
  return { plan, comments, subIssues, blockedBy, openPlanPr, mergedMs, runs };
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
