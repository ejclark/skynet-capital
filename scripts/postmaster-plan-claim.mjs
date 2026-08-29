// THE PLAN LANE'S READY-COMMENT DECISION — mirrors `claimFeedback`'s shape (#823, Eric: "There's a
// lot of issues that seem to arbitrarily wait on my guidance... move forward"). A `feedback`-labeled
// issue gets built the instant the label lands; a `plan`-labeled issue had NO equivalent — "say
// ready and the lane picks it up" was written into dozens of plan issues, but nothing ever read a
// ready comment and acted on it. Measured on #823 itself: #467/#468/#469 sat 7.3 days fully scoped,
// with every open question already given a recommended default, waiting only on the one-word flip.
//
// SPLIT OUT ON PURPOSE, not inlined into `postmaster.mjs`. `claimPlan` (postmaster.mjs) is the
// impure half — it claims the lease and touches `$GITHUB_OUTPUT`. This file is the PURE half: given
// an `issue_comment` payload, decide whether it is a ready-flip on a plan issue, with no network and
// no clock. That split is what makes the decision fixture-drivable (tests/fixtures/events/plan-*),
// same doctrine as the router's own `route()`.
//
// WHO MAY SAY READY is enforced by the WORKFLOW, not here (`postmaster.yml`'s `if:`, mirroring
// `claude.yml`'s own `author_association` gate) — same reason `claimFeedback` never re-checks who
// applied the label: GitHub's own permission model (only a member with triage/write can label an
// issue or comment as OWNER/MEMBER/COLLABORATOR) IS the authorization, and re-deciding it in script
// would just be a second, weaker copy of a check the platform already makes correctly. This module
// only ever sees comments the workflow already let through.

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

/** Does this issue carry the `plan` label? Payload labels arrive as `[{ name: "..." }]`. */
export function hasPlanLabel(issue) {
  return Array.isArray(issue?.labels) && issue.labels.some((l) => l?.name === "plan");
}

/**
 * The pure decision: given an `issue_comment` event payload, is this a ready-flip that should
 * dispatch a build? Fixture-driven (tests/fixtures/events/plan-*.json) — no network, no clock.
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
  if (!comment) return { ready: false, reason: "no comment in the payload" };
  if (!isReadySignal(comment.body)) {
    return { ready: false, reason: "comment does not read as a ready-flip" };
  }
  return { ready: true, reason: "ready-flip on a plan issue", issue };
}
