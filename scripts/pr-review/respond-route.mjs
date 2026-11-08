#!/usr/bin/env node
// RESPOND ROUTE — does an open Important finding get a response session this round? (#6870 S2)
//
// The routing is red-session-pr.mjs's (moneypenny, #6605), the one that already decides which red PR
// earns a repair session: cheap reads first, one line of why for every no, and the work dial last.
// What gets NO response session, and so never holds the merge (post.mjs fails the status only when
// one is sent):
//   - nothing Important is open
//   - a PR that is closed, a draft, carries `hold-merge`, or aims anywhere but `main`
//   - a fork (a session sent there could not push), or dependabot's (it has its own path)
//   - a PR a person wrote: no session's footer, or an author outside this repo's people and bots.
//     The person answers the review themselves.
//   - a PR that changes a protected path: a response session may not touch one
//   - round 3 or later: at most 2 rounds get an answer, then the merge goes ahead
//   - this round already sent one (its respond marker is on the PR)
//   - the work gate refuses, or could not be read
//
// Unlike red-session-pr, a lane's own PR (opened by the App, user type Bot) is in: the reviewer's
// thread is the lane's to answer, and no other lane owns that answer.
//
//   node scripts/pr-review/respond-route.mjs --pr N --round R --important K   # prints the verdict
import { breachOf } from "../envelope-scan.mjs";
import { isMain } from "../is-main.mjs";
import { ghRestAll, trustedComment } from "../moneypenny/gh.mjs";
import { LABELS } from "../moneypenny/labels.mjs";
import { workGate } from "../moneypenny/work-gate.mjs";
import { envelopeRules, flag, readGate } from "./cli.mjs";
import { readPrMarkers, respondMarker } from "./markers.mjs";
import { defaultApi } from "./rest.mjs";

/** Rounds that may send a response session. Round 3 and later still get reviewed, never held. */
export const MAX_ROUNDS = 2;
/** The last line of every session's PR body (`ship.sh checkbody`, .github/pull_request_template.md). */
const SESSION_FOOTER = /Generated (?:with|by) \[Claude Code\]/;
const isDependabot = (pr) =>
  /^dependabot(?:\[bot\])?$/.test(pr.user?.login ?? "") || /^dependabot\//.test(pr.head?.ref ?? "");

/** Pure: why this PR is not one a session should answer for, or null. */
function notOursReason(pr, defaultBranch) {
  if (pr.state !== "open") return `#${pr.number} is no longer open`;
  if (pr.draft) return `#${pr.number} is a draft`;
  if ((pr.labels ?? []).some((l) => l?.name === LABELS.holdMerge.name))
    return `#${pr.number} carries \`${LABELS.holdMerge.name}\``;
  if (pr.base?.ref !== defaultBranch) return `#${pr.number} is aimed at \`${pr.base?.ref}\``;
  if (pr.head?.repo?.full_name !== pr.base?.repo?.full_name) return `#${pr.number} is a fork`;
  if (isDependabot(pr)) return `#${pr.number} is dependabot's`;
  if (!trustedComment(pr))
    return `#${pr.number} was opened by ${pr.user?.login}, outside this repo`;
  if (!SESSION_FOOTER.test(pr.body ?? ""))
    return `a person wrote #${pr.number}, so they answer the review themselves`;
  return null;
}

/**
 * Pure. Send a response session for this round, or say why not.
 *
 * @param input.round this review's round (1 for the first)
 * @param input.importantOpen Important findings open after this round's checks
 * @param input.markers readMarkers()'s result, for this round's respond marker
 * @returns {{dispatch: boolean, reason: string, marker?: string}}
 */
export function routeRespond({
  pr,
  files = [],
  round,
  importantOpen = 0,
  gate,
  rules = [],
  markers,
  defaultBranch = "main",
} = {}) {
  const no = (reason) => ({ dispatch: false, reason });
  if (!importantOpen) return no("nothing Important is open");
  if (!pr) return no("the PR could not be read");
  const notOurs = notOursReason(pr, defaultBranch);
  if (notOurs) return no(notOurs);
  const guarded = files.filter((f) => breachOf(f, rules));
  if (guarded.length)
    return no(`it changes \`${guarded[0]}\`, a protected path a response session may not touch`);
  if (!Number.isInteger(round) || round < 1) return no("the round could not be read");
  if (round > MAX_ROUNDS) return no(`round ${round}: only ${MAX_ROUNDS} rounds get an answer`);
  if ((markers?.responds ?? []).some((r) => r.round === round))
    return no(`round ${round} already sent its response session`);
  if (!gate) return no("the work dial could not be read");
  if (!gate.dispatch) return no(gate.reason || `the work dial is at ${gate.position}`);
  return {
    dispatch: true,
    reason: `${importantOpen} Important finding(s) open in round ${round}`,
    marker: respondMarker({ sha: pr.head.sha, round }),
  };
}

/** Read what `routeRespond` needs for PR #number, bar the round and count the review step knows. */
export function gatherRespond(
  number,
  { api = defaultApi(), gate = workGate, rules = envelopeRules } = {},
) {
  const verdict = readGate(gate);
  return {
    pr: api.get(`pulls/${number}`),
    files: ghRestAll(`pulls/${number}/files`, { read: api.get }).flatMap((f) =>
      [f.filename, f.previous_filename].filter(Boolean),
    ),
    markers: readPrMarkers(number, api),
    gate: verdict,
    rules: typeof rules === "function" ? rules() : rules,
  };
}

/** The one line a dispatched round leaves on the PR, carrying its respond marker. */
export const respondLine = (verdict, footer) =>
  `**A response session answers each Important thread:** ${verdict.reason}.\n\n${verdict.marker}\n\n${footer}`;

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const number = Number(flag(args, "--pr"));
  if (!Number.isInteger(number) || number <= 0) {
    console.error("usage: node scripts/pr-review/respond-route.mjs --pr N --round R --important K");
    process.exit(1);
  }
  const deps = gatherRespond(number);
  const verdict = routeRespond({
    ...deps,
    round: Number(flag(args, "--round")),
    importantOpen: Number(flag(args, "--important")),
  });
  console.log(JSON.stringify(verdict, null, 2));
}
