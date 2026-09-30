// DECISION-CALLOUT CHECK — #3913 slice 2. `needs-eric` promises Eric a decision, and docs/ISSUES.md
// rule 7 says where that decision lives: a `Needs from you` callout above the fold. issue-lint
// enforces it only when an issue is FILED, but the label usually lands later, from another lane —
// the 2026-09-28 audit found 7 of 8 open needs-eric issues with no callout, and #4056's capture
// study found 6 of those 7 gained the label after filing. This module is the after-filing check.
//
// Two consumers, one rule:
//   - projects-sync.mjs keeps such an issue OFF the board's Blocked column (the "waiting on Eric"
//     view) until the callout exists — an ask he can't see is not yet an ask.
//   - the events lane posts `calloutGapComment()` once, naming the missing callout and whoever
//     applied the label. The wiring lives in scripts/moneypenny/index.mjs (written on #3913; it
//     lands after the held PR #4165, which owns that file).
//
// Eric's own issues are never bound (docs/ISSUES.md → "who it never binds") — he knows his ask.
import { hasDecisionCallout } from "../issue-lint.mjs";
import { FOOTER } from "./labels.mjs";

export const ERIC = "ejclark";
export const NEEDS_ERIC = "needs-eric";

/** One comment per gap, not one per relabel — the marker is how the lane finds its own. */
export const CALLOUT_GAP_MARKER = "<!-- moneypenny:callout-gap -->";

/** True when the issue promises Eric a decision it never states. Pure. */
export function missingDecisionCallout({ labels = [], body = "", author = "" } = {}) {
  if (!labels.includes(NEEDS_ERIC)) return false;
  if (author === ERIC) return false;
  return !hasDecisionCallout(body ?? "");
}

/**
 * Whether the lane should comment now: the gap exists and no earlier callout-gap comment is on
 * the issue. `comments` is the issue's comment bodies (strings). Pure.
 */
export function shouldPostCalloutGap({ labels, body, author, comments = [] } = {}) {
  if (!missingDecisionCallout({ labels, body, author })) return false;
  return !comments.some((c) => (c ?? "").includes(CALLOUT_GAP_MARKER));
}

/** The comment: the missing callout, who applied the label, and the exact shape that fixes it. */
export function calloutGapComment({ actor } = {}) {
  const who = actor ? `@${actor}` : "an unknown actor";
  return [
    `**This issue is labelled \`${NEEDS_ERIC}\` but never says what Eric has to decide.**`,
    "",
    `- The label was applied by ${who}; the body has no \`Needs from you\` callout above the fold (docs/ISSUES.md rule 7).`,
    "- Until one exists, the board keeps this out of the Blocked column — an ask he can't see isn't in his queue yet.",
    "- Fix: add the callout to the top of the body, or remove the label if no decision is needed.",
    "",
    "```markdown",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    "> 1. <the one decision, phrased as a question> — <why, trailing>",
    "```",
    "",
    CALLOUT_GAP_MARKER,
    "",
    FOOTER,
  ].join("\n");
}
