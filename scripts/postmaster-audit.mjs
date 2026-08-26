// THE LOOP'S EYES — the stall/silent-feedback audit lane. Split out of postmaster.mjs (2026-08-26,
// the noExcessiveLinesPerFile split).
import { existsSync } from "node:fs";
import { sh } from "./postmaster-gh.mjs";
import { FOOTER, LABELS } from "./postmaster-labels.mjs";

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
    staleAfterDays = 2,
    silentAfterHours = 6,
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
  return intents;
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

  return { unclaimedIssues, silentFeedback, alreadyFlagged };
}
