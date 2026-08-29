// THE LOOP'S EYES — the stall/silent-feedback audit lane. Split out of postmaster.mjs (2026-08-26,
// the noExcessiveLinesPerFile split). The plan-ready stall check (#897, closing #877's deferred
// slice 3) joined 2026-08-29: a plan issue whose ready-flip comment never got claimed or built is
// the same "silence looks like nothing happened" failure mode as the other two lanes here.
import { existsSync } from "node:fs";
import { sh } from "./postmaster-gh.mjs";
import { FOOTER, LABELS } from "./postmaster-labels.mjs";
import { hasPlanLabel, isReadySignal } from "./postmaster-plan-claim.mjs";

/**
 * Did this issue get an ANSWER? A linked PR (open or merged) is an answer; a closed issue is an
 * answer; a terminal label is an answer. Comments are not — the lane comments before it works.
 * Pure so the fixtures can drive every branch.
 */
export function answered(issue = {}) {
  if (issue.state && String(issue.state).toUpperCase() === "CLOSED") return true;
  const linked = issue.closedByPullRequests ?? issue.linkedPullRequests ?? [];
  return Array.isArray(linked) && linked.length > 0;
}

/**
 * THE LOOP'S EYES (harness-research gap #3: "the loop has a mouth but no eyes"). The router
 * dispatches work; nothing watched whether dispatched work ever moved. `audit()` is the pure half
 * of a stall supervisor: given every open dispatch issue that nothing has claimed, emit flag-stall
 * intents past a threshold.
 *
 * Deliberately DETERMINISTIC and ceiling-capped: it comments and warns — it never reclaims a lock,
 * reassigns work, or flips a status. Deciding whether a stalled build is dead or just slow is
 * judgment, and judgment belongs to the humans and agents the comment summons.
 */
export function audit(deps = {}) {
  const {
    unclaimedIssues = [],
    silentFeedback = [],
    readyPlans = [],
    staleAfterDays = 2,
    silentAfterHours = 6,
    planStallAfterHours = 48,
  } = deps;
  // FLAG ONCE, NOT PER RUN. The audit rides every push (2026-08-19), so without memory a stall
  // would draw a fresh comment on every merge to main — comment spam, not eyes. The memory is the
  // `stall-flagged` label: executeOne applies it with the comment, and a labelled issue is never
  // re-flagged. One ping per stall, however many pushes go by.
  const flagged = new Set(deps.alreadyFlagged ?? []);
  const intents = [];
  for (const i of unclaimedIssues) {
    if (i.quietDays < staleAfterDays) continue;
    if (flagged.has(i.number)) continue;
    intents.push({
      kind: "flag-stall",
      issueNumber: i.number,
      title: i.title,
      quietDays: i.quietDays,
      body: `⏱ **Stall check** — this was dispatched **${i.quietDays} day(s)** ago and no pickup layer has claimed it (no ledger, no claimed build). The push-driven sweep may be failing, or every layer saw a non-ready state.\n\n${FOOTER}`,
    });
  }
  // SILENCE IS THE WORSE FAILURE. The feedback lane's prompt has always demanded a visible terminal
  // state, and #455 still sat 41 hours with no receipt, no triage, and no label — the member saw
  // nothing at all. An over-escalation at least tells someone something; a dropped issue teaches a
  // member that filing feedback does nothing, which costs more than any false positive. Same
  // one-ping-per-stall memory as the check above.
  for (const f of silentFeedback) {
    if (f.hoursSinceFiled < silentAfterHours) continue;
    if (flagged.has(f.number)) continue;
    intents.push({
      kind: "flag-silent-feedback",
      issueNumber: f.number,
      title: f.title,
      hoursSinceFiled: f.hoursSinceFiled,
      body: `🔇 **No answer yet** — this was filed **${f.hoursSinceFiled}h** ago and has not reached a PR or a verdict. Every session must end somewhere a member can see: a PR, \`next-slice\`, \`needs-info\`, or \`needs-eric\`.\n\nRe-apply the \`feedback\` label to retry the build — the claim lease makes a re-label a safe retry, not a second build. If it is waiting on something, say so here so it stops looking dropped.\n\n${FOOTER}`,
    });
  }
  // #897 (closing #877's deferred slice 3): a `ready` comment on a plan issue that never got
  // claimed or built looks IDENTICAL to "nothing needed" from Eric's side — the trigger may have
  // missed, hit a label mismatch, or lost a claim race, and none of those leave a trace anywhere he
  // looks. `readyPlans` arrives pre-filtered by `gatherAuditDeps` (via the pure `readyPlanCandidate`
  // below) to issues that are plan-labeled, carry a ready-signal comment, have no live claim lease,
  // and have no linked PR — this loop only applies the time threshold and the one-ping memory.
  for (const p of readyPlans) {
    if (p.hoursSinceReady < planStallAfterHours) continue;
    if (flagged.has(p.number)) continue;
    intents.push({
      kind: "flag-plan-stall",
      issueNumber: p.number,
      title: p.title,
      hoursSinceReady: p.hoursSinceReady,
      body: `⏳ **Plan never claimed** — a ready-flip comment landed **${p.hoursSinceReady}h** ago but nothing has claimed or built this plan issue since (no \`claim/plan-${p.number}\` lease, no linked PR). The trigger may have missed, hit a label mismatch, or lost a claim race.\n\nRe-post a ready comment (e.g. \`ready\`) to retry — the claim lease makes a re-trigger a safe retry, not a second build. If it is intentionally on hold, say so here so it stops looking dropped.\n\n${FOOTER}`,
    });
  }
  return intents;
}

/**
 * THE PLAN-STALL DECISION — pure, mirroring `isReadySignal`'s own fixture-drivable shape: given
 * one issue, its comments, and whether a claim lease is currently held, decide whether it belongs
 * in the stalled-plan candidate list, and if so how old its ready-flip is. No network, no clock
 * beyond the injected `nowMs` — the actual `gh` calls (comments, claim-ref lookup) stay in
 * `gatherAuditDeps`, same division of labor as `planReadyIntent` vs. `claimPlan`.
 *
 * Returns `null` for anything that is not a live candidate: not plan-labeled, already answered
 * (closed or has a linked PR), currently claimed, or carrying no ready-signal comment at all. The
 * TIME threshold is NOT applied here — that is `audit()`'s job, same split as `unclaimedIssues`
 * (quietDays) and `silentFeedback` (hoursSinceFiled).
 *
 * @returns {{ title: string, number: number, hoursSinceReady: number } | null}
 */
export function readyPlanCandidate(issue, comments = [], hasClaim = false, nowMs = Date.now()) {
  if (!hasPlanLabel(issue)) return null;
  if (answered(issue)) return null;
  if (hasClaim) return null;
  // `gh issue view --json comments` lists comments oldest-first, so the first match here is the
  // EARLIEST ready-flip — the age that matters, since that is how long the trigger has had to fire.
  const readyComment = (comments ?? []).find((c) => isReadySignal(c?.body));
  if (!readyComment) return null;
  const hoursSinceReady = Math.floor((nowMs - Date.parse(readyComment.createdAt)) / 3_600_000);
  return { title: issue.title, number: issue.number, hoursSinceReady };
}

/** Audit-mode dependencies: unclaimed dispatch issues. Loud on failure, same doctrine as
 *  gatherDeps. `now` injected for the day math (never Date.now() in a testable path — the caller
 *  passes it). */
export function gatherAuditDeps(nowMs) {
  const json = (label, args) => {
    let out;
    try {
      out = sh("gh", args);
    } catch (err) {
      throw new Error(`${label} failed: ${String(err.stderr || err.message).trim()}`);
    }
    try {
      return JSON.parse(out || "[]");
    } catch {
      throw new Error(`${label} returned unparseable JSON:\n${out.slice(0, 400)}`);
    }
  };
  const daysSince = (iso) => Math.floor((nowMs - Date.parse(iso)) / 86_400_000);
  const hoursSince = (iso) => Math.floor((nowMs - Date.parse(iso)) / 3_600_000);
  const issues = json("gh issue list", [
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "title,number,state,updatedAt,createdAt,labels,closedByPullRequestsReferences",
  ]).map((i) => ({ ...i, closedByPullRequests: i.closedByPullRequestsReferences ?? [] }));
  const alreadyFlagged = issues
    .filter((i) => (i.labels ?? []).some((l) => l.name === LABELS.stall.name))
    .map((i) => i.number);

  const unclaimedIssues = [];
  for (const i of issues) {
    const id = i.title.match(/^\[event-research\] (.+)$/)?.[1];
    if (id && !existsSync(`docs/research/events/${id}.md`)) {
      unclaimedIssues.push({ title: i.title, number: i.number, quietDays: daysSince(i.updatedAt) });
    }
  }
  // A feedback issue that reached no OUTCOME. The signal was "zero comments" until 2026-08-22, and
  // that was blind to the likeliest failure there is: the build prompt's step 0 posts a receipt
  // BEFORE the branch and the build, so a session that dies at typecheck or PR-open leaves exactly
  // one comment and was invisible to this audit forever. Comments measure chatter; what a member
  // actually needs is an answer. So the signal is now the absence of one — no PR linked, and none
  // of the terminal labels — however much the lane said along the way.
  const spoke = new Set([LABELS.needsEric.name, LABELS.needsInfo.name, LABELS.nextSlice.name]);
  const silentFeedback = issues
    .filter(
      (i) =>
        (i.labels ?? []).some((l) => l.name === "feedback") &&
        !answered(i) &&
        !(i.labels ?? []).some((l) => spoke.has(l.name)),
    )
    .map((i) => ({
      title: i.title,
      number: i.number,
      hoursSinceFiled: hoursSince(i.createdAt ?? i.updatedAt),
    }));

  // #897: plan issues whose ready-flip may never have been claimed. Skip the (expensive-ish,
  // per-issue) comment fetch entirely for anything the cheap in-memory checks already rule out —
  // answered or already flagged — same "don't pay for what you don't need" discipline as the
  // shipped sweep's REST-before-GraphQL check above.
  const readyPlans = [];
  for (const i of issues) {
    if (!hasPlanLabel(i)) continue;
    if (answered(i)) continue;
    if (alreadyFlagged.includes(i.number)) continue;
    if (hasPlanClaim(i.number)) continue;
    const view = json(`gh issue view (comments, #${i.number})`, [
      "issue",
      "view",
      String(i.number),
      "--json",
      "comments",
    ]);
    const candidate = readyPlanCandidate(i, view.comments, false, nowMs);
    if (candidate) readyPlans.push(candidate);
  }

  return { unclaimedIssues, silentFeedback, readyPlans, alreadyFlagged };
}

/**
 * Is `claim/plan-<n>` currently held, in either namespace the lease has ever lived in? Read-only
 * mirror of `claimHandoff`'s own `readRef`/namespace-fallback shape (scripts/postmaster.mjs) — a
 * 404 in both namespaces means unclaimed, which is the common and expected case.
 */
function hasPlanClaim(number) {
  for (const ns of ["tags", "heads"]) {
    try {
      sh("gh", ["api", `repos/{owner}/{repo}/git/ref/${ns}/claim/plan-${number}`]);
      return true;
    } catch {
      /* not held in this namespace */
    }
  }
  return false;
}
