// THE FEEDBACK LANE'S MECHANICAL STALL GUARD (#1028). `feedback-build.md` promises "exactly one of
// four visible endings, always" — but that promise lives entirely in a prompt, and a prompt is
// something an LLM can simply fail to follow. Run 172 (#1020) did exactly that: 9 turns, $0.37,
// `is_error: false`, and nothing posted beyond the initial receipt. Nothing caught it — the lease
// self-healed on a later retry before anyone noticed. This module is the mechanical check that
// used to only be a prompt's word: given the issue a `build-feedback` session was just handed, did
// the run leave a trace a member could actually see?
//
// SPLIT OUT ON PURPOSE, same doctrine as plan-claim.mjs/audit.mjs: `visibleOutcome` is the PURE
// decision (fixture-drivable, no network); `guardFeedbackOutcome` is the impure half the workflow
// step calls once the build step has already run (or been skipped by the oauth gate).
import { sh } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS } from "./labels.mjs";

/**
 * Did this build leave something a member (or Eric) could actually see?
 *
 * Three signals, matching the ones named in #1028's proposed fix exactly:
 *   1. a PR referencing the issue (any state — open, merged, or closed; the branch name
 *      `feedback/<n>` is load-bearing per `feedback-build.md`, so a matching head is proof enough)
 *   2. a label change — one of the lane's own terminal labels (`needs-info`, `next-slice`,
 *      `needs-eric`) landed on the issue
 *   3. a comment beyond the receipt — the session's step 0 always posts exactly one comment
 *      ("a build session has started…") BEFORE it does anything else, so more than one comment on
 *      the issue means the session said something further, even if it then died before reaching a
 *      PR
 *
 * Closed is folded into (2)'s intent — a closed issue is trivially answered — but is checked
 * directly rather than inferred from labels, since a human can close an issue without any label
 * ever landing.
 *
 * Pure: no network, no clock. `hasMatchingPR` and `commentCount` are gathered by the impure half
 * below so every branch here is fixture-drivable.
 */
export function visibleOutcome(issue = {}, hasMatchingPR = false) {
  if (String(issue.state ?? "").toUpperCase() === "CLOSED") return true;
  if (hasMatchingPR) return true;
  const terminal = new Set([LABELS.needsInfo.name, LABELS.nextSlice.name, LABELS.needsEric.name]);
  if ((issue.labels ?? []).some((l) => terminal.has(l?.name))) return true;
  return (issue.commentCount ?? 0) > 1;
}

/**
 * The comment this guard posts when it catches a silent stall — visible, dated, and pointing at
 * the run so the cause is diagnosable rather than just flagged.
 */
export function stallGuardComment(issueNumber, runUrl) {
  const runLine = runUrl ? `Run: ${runUrl}` : "No run URL was available to this guard step.";
  return `🔇 **Silent stall caught** — the \`build-feedback\` session for this issue finished without opening a PR, changing a label, or posting a comment beyond the receipt above. That breaks this lane's own contract (\`.github/prompts/feedback-build.md\`: "exactly one [of four visible endings], always, never silence") — and this run reached none of them.

This is a mechanical guard (#1028), not a verdict on the ask itself — the session may have found nothing to build, hit an error it never surfaced, or simply stopped early. \`claude-code-action\` hides the session's own reasoning, so there is no way to tell which from here.

${runLine}

Re-applying the \`feedback\` label will not retry the build while the lease is still held (\`claim/feedback-${issueNumber}\`, up to a 2h TTL) — someone with lease-release access can run \`node scripts/moneypenny/index.mjs --release feedback-${issueNumber}\` and re-apply the label once the cause is understood.

${FOOTER}`;
}

/**
 * The impure half: read what actually happened to this issue after a `build-feedback` attempt, and
 * — if nothing visible did — post the guard comment and apply `needs-eric` exactly as if the
 * session itself had reached that terminal state. Never called by the session; only by the
 * workflow step right after it, which is the one vantage point that can tell "the session said
 * nothing" apart from "the session said something and I haven't looked yet".
 */
export function guardFeedbackOutcome(issueNumber, runUrl) {
  const n = Number(issueNumber);
  const view = JSON.parse(
    sh("gh", ["issue", "view", String(n), "--json", "state,labels,comments"]),
  );
  const prs = JSON.parse(
    sh("gh", [
      "pr",
      "list",
      "--state",
      "all",
      "--head",
      `feedback/${n}`,
      "--json",
      "number",
      "--limit",
      "5",
    ]),
  );
  const issue = {
    state: view.state,
    labels: view.labels,
    commentCount: Array.isArray(view.comments) ? view.comments.length : 0,
  };
  const visible = visibleOutcome(issue, prs.length > 0);
  if (visible) {
    console.log(`::notice::feedback #${n} — visible outcome confirmed, nothing to guard`);
    return { visible: true };
  }
  console.log(`::warning::feedback #${n} — silent stall caught, no visible outcome from the build`);
  ensureLabel(LABELS.needsEric);
  sh("gh", ["issue", "comment", String(n), "--body", stallGuardComment(n, runUrl)]);
  sh("gh", ["issue", "edit", String(n), "--add-label", LABELS.needsEric.name]);
  return { visible: false };
}
