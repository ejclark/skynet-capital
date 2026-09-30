// THE PLAN LANE'S READY-COMMENT DECISION — mirrors `claimFeedback`'s shape (#823, Eric: "There's a
// lot of issues that seem to arbitrarily wait on my guidance... move forward"). A `feedback`-labeled
// issue gets built the instant the label lands; a `plan`-labeled issue had NO equivalent — "say
// ready and the lane picks it up" was written into dozens of plan issues, but nothing ever read a
// ready comment and acted on it. Measured on #823 itself: #467/#468/#469 sat 7.3 days fully scoped,
// with every open question already given a recommended default, waiting only on the one-word flip.
//
// SPLIT OUT ON PURPOSE, not inlined into `moneypenny.mjs`. `claimPlan` (moneypenny.mjs) is the
// impure half — it claims the lease and touches `$GITHUB_OUTPUT`. This file is the PURE half: given
// an `issue_comment` payload, decide whether it is a ready-flip on a plan issue, with no network and
// no clock. That split is what makes the decision fixture-drivable (tests/fixtures/events/plan-*),
// same doctrine as the router's own `route()`.
//
// WHO MAY SAY READY is enforced by the WORKFLOW, not here (`moneypenny-events.yml`'s `if:`, mirroring
// `claude.yml`'s own `author_association` gate) — same reason `claimFeedback` never re-checks who
// applied the label: GitHub's own permission model (only a member with triage/write can label an
// issue or comment as OWNER/MEMBER/COLLABORATOR) IS the authorization, and re-deciding it in script
// would just be a second, weaker copy of a check the platform already makes correctly. This module
// only ever sees comments the workflow already let through.
//
// TWO GUARDS SIT ON TOP (#3818 slice 2). A plan carrying a parking label is never claimed, whatever
// the comment says (criterion 5 — the same `isBuildable` test `claimFeedback` and `/work-issues`
// use). And a comment Claude posted (it carries the lane FOOTER) counts as ready only when its first
// line is the one exact hand-off line below (criterion 6) — Claude comments are written by an
// OWNER-associated token, so the workflow's `if:` lets them through, and a status comment that
// happens to open "ready — …" must not fire a build.
//
// THE LABEL-EVENT PATHS (#3960 criteria 1–2, #3818 slice 3). A comment was the plan lane's only
// wake-up; now an `issues` event can be one too, for both lanes, via `labelEventReady` below:
//   - `labeled` with `ready` on an open, buildable plan → ready (the feedback lane already woke on
//     this; the plan lane now does too, so the board's `ready` label means the same on both);
//   - `unlabeled` removing a parking label from an open plan/feedback issue that still carries
//     `ready` and is now buildable → ready. Without it, clearing `needs-eric` from a ready issue
//     left it idle until someone thought to say "ready" again — the flip was already on record.
// The comment path is unchanged.
import { isBuildable, LABELS, labelNames, PARKING_LABELS, parkedReason } from "./labels.mjs";

// Short, direct go-ahead phrases matched against the WHOLE (trimmed, trailing-punctuation-
// tolerant) comment — never a mere prefix. A prefix match (`/^go\b/`) would fire on "go over this
// again please", which says the opposite of ready; requiring the whole comment to BE the phrase is
// what keeps this narrow.
const WHOLE_COMMENT_PATTERNS = [
  /^ready[!.]*$/,
  /^ready,?\s*(go ahead|go)[!.]*$/,
  /^go[!.]*$/,
  /^go ahead[!.]*$/,
  /^go for it[!.]*$/,
  /^lgtm[!.]*$/,
  /^lgtm,?\s*ship it[!.]*$/,
  /^approved?[!.]*$/,
];

// Longer phrasing this repo's own plan issues actually use (#429, #466, #823: "Say 'ready' (or
// similar) here"; #429/#466's "we are aligned... execute"). Matched anywhere in the comment, since
// a real sign-off is often a full sentence around the phrase — but see the negation guard below,
// which still catches "aligned, DON'T execute" et al before either list runs.
const CONTAINS_PATTERNS = [/\bship it\b/, /\baligned\b.*\b(execute|build it|ship it)\b/];

// A ready-flip with a trailing qualifier ("ready — use the proposed defaults", "ready, go with
// option A") — Eric's own real phrasing on #724, verified live: the 0-for-8 production run of
// this trigger's first day showed the whole-comment-only patterns above have a 0% real-world hit
// rate, because a genuine sign-off almost always names a direction alongside the word "ready".
// Matched as a LEADING word only ("ready" immediately followed by a separator), never a bare
// substring — "already ready to go" or "I'm not ready — need more time" must not match this, and
// don't: `^` anchors it to the start, and the negation guard above still runs first.
const LEADING_QUALIFIER_PATTERN = /^ready\s*[-–—:,]\s*\S/;

/**
 * Does this comment read as a ready-flip ("ready", "go", "aligned, execute", or similar)?
 *
 * A plan issue's own body routinely uses the word "ready" in prose ("waiting on Eric's
 * ready-flip"), so this matches the SIGNAL SHAPE — a short, direct go-ahead, or "ready" leading a
 * qualifier ("ready — use the proposed defaults") — not any appearance of the word anywhere in a
 * longer comment. Deliberately does NOT match: "not ready yet", "already scoped this", "go over
 * this again please", "let's not ship it yet", "ready to discuss more", or an ordinary question or
 * compliment that happens to share a word. A negation anywhere in the comment
 * (`not`/`no`/`don't`/`never`) disqualifies it outright, checked before either pattern list runs.
 */
export function isReadySignal(text) {
  const trimmed = String(text ?? "")
    .trim()
    .toLowerCase();
  if (!trimmed) return false;
  if (/\b(not|no|don'?t|never)\b/.test(trimmed)) return false;

  return (
    WHOLE_COMMENT_PATTERNS.some((p) => p.test(trimmed)) ||
    CONTAINS_PATTERNS.some((p) => p.test(trimmed)) ||
    LEADING_QUALIFIER_PATTERN.test(trimmed)
  );
}

// The lane FOOTER (labels.mjs), matched loosely: a Claude session may drop the rule or the link.
const CLAUDE_FOOTER = /generated by \[claude code\]/i;

/** The one first line a Claude-authored comment may use to flip a plan ready (criterion 6). */
export const CLAUDE_READY_LINE = "ready — take slice 1 per the state block";

/** Does this comment carry the Claude Code footer — i.e. did a session, not a human, post it? */
export function isClaudeComment(text) {
  return CLAUDE_FOOTER.test(String(text ?? ""));
}

/**
 * The narrow ready test for a Claude-authored comment: its first line, trimmed, must BE
 * `CLAUDE_READY_LINE` — em dash, or the ASCII-hyphen variant a keyboard produces. Nothing looser:
 * every other phrasing `isReadySignal` accepts is a human's, and a session's prose may use them.
 */
export function isClaudeReadyLine(text) {
  const first = String(text ?? "")
    .trim()
    .split("\n")[0]
    .trim();
  return first === CLAUDE_READY_LINE || first === CLAUDE_READY_LINE.replace("—", "-");
}

/** Does this issue carry the `plan` label? Payload labels arrive as `[{ name: "..." }]`. */
export function hasPlanLabel(issue) {
  return Array.isArray(issue?.labels) && issue.labels.some((l) => l?.name === "plan");
}

/**
 * The pure decision: given an `issue_comment` event payload — or an `issues` labeled/unlabeled
 * one (`labelEventReady`) — is this a ready-flip that should dispatch a build? Fixture-driven
 * (tests/fixtures/events/plan-*.json) — no network, no clock.
 *
 * Authorization (who may say ready) is NOT re-checked here — see the header. This function only
 * ever runs on comments the workflow's own `if:` already let through, same division of labor as
 * `claimFeedback` and GitHub's own label-write permission.
 *
 * @returns {{ ready: boolean, reason: string, issue?: object }}
 */
export function planReadyIntent(ctx) {
  const issue = ctx.payload?.issue;
  const comment = ctx.payload?.comment;
  if (!issue) return { ready: false, reason: "no issue in the payload" };
  if (issue.state && issue.state !== "open") {
    return { ready: false, reason: `issue #${issue.number} is not open` };
  }
  if (!hasPlanLabel(issue)) {
    return { ready: false, reason: `issue #${issue.number} does not carry the plan label` };
  }
  if (!comment && isLabelEvent(ctx.payload)) return labelEventReady(ctx.payload, "plan");
  if (!comment) return { ready: false, reason: "no comment in the payload" };
  if (isClaudeComment(comment.body)) {
    if (!isClaudeReadyLine(comment.body)) {
      return {
        ready: false,
        reason: `a Claude-authored comment flips a plan only with the first line "${CLAUDE_READY_LINE}"`,
      };
    }
  } else if (!isReadySignal(comment.body)) {
    return { ready: false, reason: "comment does not read as a ready-flip" };
  }
  if (!isBuildable(issue.labels)) {
    return { ready: false, reason: parkedReason(issue.number, issue.labels) };
  }
  return { ready: true, reason: "ready-flip on a plan issue", issue };
}

/** Is this an `issues` labeled/unlabeled payload (it names the label that moved)? */
const isLabelEvent = (payload) =>
  Boolean(payload?.label) && (payload.action === "labeled" || payload.action === "unlabeled");

/**
 * The label-event ready decision, shared by both lanes (the header's LABEL-EVENT PATHS). The caller
 * has already checked the issue is open and carries its lane label; `issue.labels` in an `issues`
 * payload is the state AFTER the change, so an unpark that leaves a second parking label on is
 * still refused by `isBuildable`.
 *
 * @returns {{ ready: boolean, reason: string, issue?: object }}
 */
export function labelEventReady(payload, lane) {
  const { action, label, issue } = payload;
  const name = label?.name;
  const n = issue?.number;
  if (action === "labeled" && name !== LABELS.ready.name) {
    return { ready: false, reason: `#${n} was labeled \`${name}\`, not \`ready\`` };
  }
  if (action === "unlabeled") {
    if (!PARKING_LABELS.includes(name)) {
      return { ready: false, reason: `#${n} lost \`${name}\`, which is not a parking label` };
    }
    if (!labelNames(issue?.labels).includes(LABELS.ready.name)) {
      return { ready: false, reason: `#${n} was unparked but does not carry \`ready\`` };
    }
  }
  if (!isBuildable(issue?.labels)) return { ready: false, reason: parkedReason(n, issue?.labels) };
  const why =
    action === "labeled"
      ? `\`ready\` label on a ${lane} issue`
      : `${lane} issue unparked (\`${name}\` removed) while still \`ready\``;
  return { ready: true, reason: why, issue };
}

/**
 * The feedback lane's pure decision — what `claimFeedback` asks before admission and the lease.
 * Keeps that lane's existing shape (a payload with no label event, as the specs and the
 * `labeled: ready` step hand it, needs only `feedback` + buildable) and adds the unpark path.
 *
 * @returns {{ ready: boolean, reason: string, issue?: object }}
 */
export function feedbackReadyIntent(ctx) {
  const issue = ctx.payload?.issue;
  if (!issue) return { ready: false, reason: "no issue in the payload" };
  if (!labelNames(issue.labels).includes(LABELS.feedback.name)) {
    return { ready: false, reason: "ready, but not a feedback issue — not this lane's" };
  }
  if (issue.state && issue.state !== "open") {
    return { ready: false, reason: `issue #${issue.number} is not open` };
  }
  if (isLabelEvent(ctx.payload)) return labelEventReady(ctx.payload, "feedback");
  // #3818 slice 2, criterion 5: ready + parked is never built (#3194 sat ready + needs-eric 9 days).
  if (!isBuildable(issue.labels)) {
    return { ready: false, reason: parkedReason(issue.number, issue.labels) };
  }
  return { ready: true, reason: "ready feedback issue", issue };
}
