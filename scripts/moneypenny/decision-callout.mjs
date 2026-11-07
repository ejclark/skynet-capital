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
// THE RULE BINDS EVERY ISSUE WITH THE LABEL, whoever filed it. It used to exempt his own issues, on
// the grounds that he knows his ask. Sessions post under his login, so the author says nothing, and
// #6562's narrower test (no attribution footer) missed #4535, a session's capsule filed without one.
// Of the 20 footer-less issues filed under his login since 2026-10-06, 19 carry the capsule table and
// none reads as his own note, so no test on the body can pick out the case the exemption was for.
// Without it, a label he adds by hand costs him one comment and an ordinary column.
//
// AND THE LANE STATES ITS OWN ASK. The lanes that apply the label used to put the ask in a comment
// only, which left the rule nothing to read: a plan the lane parked fell out of Blocked. So
// `withLaneAsk` writes it above the fold: the stop and the stall guard before they label, and
// `checkCallout` from the comment of a lane whose prompt says to comment and then label.
import { hasDecisionCallout, MAX_BULLET } from "../issue-lint.mjs";
import { sh, withRetry } from "./gh.mjs";
import { FOOTER } from "./labels.mjs";

export const ERIC = "ejclark";
export const NEEDS_ERIC = "needs-eric";

/** One comment per gap, not one per relabel — the marker is how the lane finds its own. */
export const CALLOUT_GAP_MARKER = "<!-- moneypenny:callout-gap -->";

/** Around the callout a lane wrote, so a second stop replaces it and a cleared label removes it. */
const LANE_ASK_OPEN = "<!-- moneypenny:lane-ask -->";
const LANE_ASK_CLOSE = "<!-- /moneypenny:lane-ask -->";
const LANE_ASK = new RegExp(`${LANE_ASK_OPEN}[\\s\\S]*?${LANE_ASK_CLOSE}`);
/** Where a body with no fold takes the ask: above the attribution footer it ends with. */
const FOOTER_LINE = /(?:---\n)?[^\n]*Generated (?:by|with) \[Claude Code\]/;
const BLOCK_GAP = "\n\n";

/** True when the issue promises Eric a decision it never states. Pure. */
export function missingDecisionCallout({ labels = [], body = "" } = {}) {
  if (!labels.includes(NEEDS_ERIC)) return false;
  return !hasDecisionCallout(body ?? "");
}

/**
 * Whether the lane should comment now: the gap exists and no earlier callout-gap comment is on
 * the issue. `comments` is the issue's comment bodies (strings). Pure.
 */
export function shouldPostCalloutGap({ labels, body, comments = [] } = {}) {
  if (!missingDecisionCallout({ labels, body })) return false;
  return !comments.some((c) => (c ?? "").includes(CALLOUT_GAP_MARKER));
}

/** The ask as one line, inside the length rule 8 holds an item to. Pure. */
const askItem = (ask) => {
  const line = String(ask ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return line.length > MAX_BULLET ? `${line.slice(0, MAX_BULLET - 1)}…` : line;
};

/**
 * The sub-lines a callout speaks so the assignment card can carry the whole ask (ask-card.mjs):
 * `options` ([{key, text, predicted?}]), `predicted` ("A (medium)" when no option is flagged),
 * `onSilence` and `unblocks`. Each is one short line under item 1; a field left out is left out,
 * and the card names the gap in the digest instead of refusing the ask.
 */
function askDetail({ options = [], predicted, onSilence, unblocks } = {}) {
  const one = (t) => askItem(t);
  return [
    ...options.map(
      (o) =>
        `>    - ${o.key}${o.predicted ? " (predicted" + (o.confidence ? `, ${o.confidence}` : "") + ")" : ""}: ${one(o.text)}`,
    ),
    ...(predicted ? [`>    - Predicted: ${one(predicted)}`] : []),
    ...(onSilence ? [`>    - On silence: ${one(onSilence)}`] : []),
    ...(unblocks ? [`>    - Unblocks: ${one(unblocks)}`] : []),
  ];
}

/**
 * `body` with this ask as its callout, above the fold. A callout this lane wrote is replaced, so a
 * plan stopped twice asks only the newest question. A callout anyone else wrote is left alone: the
 * rule is already met, and a second one would split the decision across two places. `url` points
 * at the comment the ask came from, on its own line because rule 8 limits the item's length. Pure.
 */
export function withLaneAsk(body, ask, url, extra = {}) {
  const text = body ?? "";
  const block = [
    LANE_ASK_OPEN,
    "> [!IMPORTANT]",
    "> **Needs from you**",
    `> 1. ${askItem(ask)}`,
    ...askDetail(extra),
    ...(url ? [">", `> The lane's comment: ${url}`] : []),
    LANE_ASK_CLOSE,
  ].join("\n");
  if (LANE_ASK.test(text)) return text.replace(LANE_ASK, () => block);
  if (hasDecisionCallout(text)) return text;
  const fold = text.indexOf("<details");
  const footer = text.search(FOOTER_LINE);
  const at = fold !== -1 ? fold : footer !== -1 ? footer : text.length;
  return `${text.slice(0, at)}${at > 0 && at === text.length ? BLOCK_GAP : ""}${block}${BLOCK_GAP}${text.slice(at)}`;
}

/** `body` with the lane's ask taken back out, for when the label clears. Pure. */
export function withoutLaneAsk(body) {
  const text = body ?? "";
  const m = LANE_ASK.exec(text);
  if (!m) return text;
  const head = text.slice(0, m.index);
  const tail = text.slice(m.index + m[0].length).replace(/^\n\n/, "");
  return tail ? head + tail : head.replace(/\n\n$/, "");
}

/** A comment that reports work and asks nothing. Lifting one would put a non-question in his queue. */
const NOT_AN_ASK = /build session has started|^\**(?:Continuing this plan|Sliced|Shipped)\b/i;
/** Lines that cannot carry the ask: a marker, a code fence, a table row, a rule. */
const NOT_A_SENTENCE = /^(?:<!--|```|\||---)/;
/** How recently a lane must have said it for the comment to belong to this label. */
const ASK_WINDOW_MS = 15 * 60 * 1000;

/**
 * What a lane just asked, when its prompt said to comment and then label: the newest comment by the
 * bot that applied the label, as `{ line, url }`, else `null`. A person who labels can write the
 * callout, so they get the gap comment instead. Only that bot's own words count, because this repo is
 * public and the result goes in his queue. The window and the `NOT_AN_ASK` screen stop a lane that
 * labelled without commenting from promoting something older. Pure.
 */
export function askFromComments(comments = [], { actor, now = Date.now() } = {}) {
  if (!/\[bot\]$/.test(actor ?? "")) return null;
  const said = comments.filter((c) => c?.user?.login === actor);
  const last = said[said.length - 1];
  // Written so an unreadable date fails the window instead of passing it.
  if (!(last && now - Date.parse(last.created_at ?? "") <= ASK_WINDOW_MS)) return null;
  const text = last.body ?? "";
  if (text.includes(CALLOUT_GAP_MARKER) || NOT_AN_ASK.test(text)) return null;
  const line = text
    .split("\n")
    .map((l) => l.trim().replace(/^#+\s*/, ""))
    .find((l) => l && !NOT_A_SENTENCE.test(l));
  return line ? { line, url: last.html_url } : null;
}

/** Replace an issue's body. `gh api`, like every write in this lane, and retried for GitHub's 5xx. */
export function writeIssueBody(number, body, { run = sh, retry = withRetry } = {}) {
  retry(() =>
    run("gh", [
      "api",
      "--method",
      "PATCH",
      `repos/{owner}/{repo}/issues/${number}`,
      "-f",
      `body=${body}`,
    ]),
  );
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
