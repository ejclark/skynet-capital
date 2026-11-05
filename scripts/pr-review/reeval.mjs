#!/usr/bin/env node
// RE-EVALUATE — is every Important thread answered, so the merge may go ahead? (#6870 S2)
//
// Plain code, no model: the author's answer is either checkable or it is not an answer.
//   fixed     a trusted reply names a commit that is on this PR, comes after the head the finding
//             was raised on, and touches the finding's file
//   declined  a trusted reply declines with a reason of at least MIN_REASON_CHARS characters. A bare
//             "no" is not a reason; agreeing to disagree in a sentence is.
//   open      anything else, including a reply the checks refuse, with the reason it was refused
// An author's newest reply on a finding wins, so a decline can become a fix.
//
// THE VERDICT IS THE STATUS. Every Important finding answered → `success`, and the arm job may merge.
// Some still open → `failure`, while rounds remain. Once round MAX_ROUNDS has had its answer, the
// hold lifts anyway with the open count in the description: at most 2 rounds, then the merge goes
// ahead, and the ledger records each still-open finding as `open` so the weekly review sees it.
//
//   node scripts/pr-review/reeval.mjs --pr N [--apply]   # --apply sets the status and writes rows
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ghRestAll } from "../moneypenny/gh.mjs";
import { appendLedgerRows, ledgerPath, ledgerRow } from "./ledger.mjs";
import { readPrMarkers, roundOf } from "./markers.mjs";
import { STATUS_CONTEXT } from "./post.mjs";
import { MAX_ROUNDS } from "./respond-route.mjs";
import { defaultApi } from "./rest.mjs";

export const MIN_REASON_CHARS = 20;

const roundOfId = (id) => Number(/^r(\d+)f/.exec(id)?.[1]) || null;
const startsWithSha = (full, short) =>
  Boolean(short) && short.length >= 7 && full.startsWith(short);

/** Why a `fixed` reply does not count, or null when it does. */
function fixRefusal(finding, reply, { commits, commitFiles, raisedOn }) {
  const at = commits.findIndex((c) => startsWithSha(c, reply.sha));
  if (at < 0) return `fixed names ${reply.sha ?? "no commit"}, which is not a commit on this PR`;
  const raised = commits.findIndex((c) => startsWithSha(c, raisedOn));
  if (raised >= 0 && at <= raised) return `fixed names ${reply.sha}, which the review already read`;
  const touched = commitFiles[commits[at]];
  if (Array.isArray(touched) && finding.file && !touched.includes(finding.file))
    return `fixed names ${reply.sha}, which does not touch \`${finding.file}\``;
  return null;
}

/**
 * Pure. Each Important thread's state, and the status that follows.
 *
 * @param input.markers readMarkers()'s result for the PR
 * @param input.commits the PR's commit shas, oldest first
 * @param input.commitFiles files each commit touched, by full sha; a missing entry is not checked
 */
export function reevaluate({
  markers,
  commits = [],
  commitFiles = {},
  maxRounds = MAX_ROUNDS,
} = {}) {
  const round = roundOf(markers);
  const shaOfRound = new Map((markers?.receipts ?? []).map((r) => [r.round, r.sha]));
  const latest = new Map();
  for (const r of markers?.replies ?? []) latest.set(r.id, r); // oldest first, so the newest wins
  const threads = (markers?.findings ?? [])
    .filter((f) => f.severity === "important")
    .map((f) => {
      const reply = latest.get(f.id);
      const base = { id: f.id, file: f.file, line: f.line };
      if (!reply) return { ...base, outcome: "open", why: "no answer yet" };
      if (reply.outcome === "declined") {
        const reason = String(reply.reason ?? "")
          .replace(/\s+/g, " ")
          .trim();
        return reason.length >= MIN_REASON_CHARS
          ? { ...base, outcome: "declined", why: "declined with a reason", reason }
          : { ...base, outcome: "open", why: "declined without a reason" };
      }
      const raisedOn = shaOfRound.get(roundOfId(f.id));
      const refused = fixRefusal(f, reply, { commits, commitFiles, raisedOn });
      return refused
        ? { ...base, outcome: "open", why: refused }
        : { ...base, outcome: "fixed", why: "fixed by a commit", sha: reply.sha };
    });
  const open = threads.filter((t) => t.outcome === "open");
  const answered = threads.length - open.length;
  // Lift only after the last round's response session was sent: a reply that arrives before it
  // would otherwise release a hold nobody has answered yet.
  const lastAnswered = (markers?.responds ?? []).some((r) => r.round === round);
  const released = open.length > 0 && round >= maxRounds && lastAnswered;
  const description = !threads.length
    ? "no Important finding to answer"
    : !open.length
      ? `every Important thread answered (${answered})`
      : released
        ? `released after ${round} rounds: ${open.length} Important still open`
        : `${open.length} of ${threads.length} Important thread(s) still open`;
  const outcomes = threads
    .filter((t) => t.outcome !== "open" || released)
    .map((t) => ({
      id: t.id,
      outcome: t.outcome,
      sha: t.sha,
      reason: t.reason ?? (t.outcome === "open" ? t.why : undefined),
    }));
  return {
    state: open.length && !released ? "failure" : "success",
    description,
    released,
    round,
    threads,
    outcomes,
  };
}

/** Read what `reevaluate` needs for PR #number: markers, commits, and the files of each claimed fix. */
export function gatherReeval(number, { api = defaultApi() } = {}) {
  const markers = readPrMarkers(number, api);
  const commits = ghRestAll(`pulls/${number}/commits`, { read: api.get }).map((c) => c.sha);
  const claimed = new Set(
    markers.replies
      .filter((r) => r.outcome === "fixed")
      .map((r) => commits.find((c) => startsWithSha(c, r.sha)))
      .filter(Boolean),
  );
  const commitFiles = Object.fromEntries(
    [...claimed].map((sha) => [
      sha,
      (api.get(`commits/${sha}`)?.files ?? []).map((f) => f.filename),
    ]),
  );
  return { markers, commits, commitFiles, head: api.get(`pulls/${number}`)?.head?.sha };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const number = Number(args[args.indexOf("--pr") + 1]);
  if (!(args.includes("--pr") && Number.isInteger(number)) || number <= 0) {
    console.error("usage: node scripts/pr-review/reeval.mjs --pr N [--apply]");
    process.exit(1);
  }
  const api = defaultApi();
  const { head, ...deps } = gatherReeval(number, { api });
  const verdict = reevaluate(deps);
  if (args.includes("--apply")) {
    api.send("POST", `statuses/${head}`, {
      state: verdict.state,
      context: STATUS_CONTEXT,
      description: verdict.description,
    });
    const rows = verdict.outcomes.map((o) => ledgerRow("outcome", { pr: number, ...o }));
    if (rows.length) appendLedgerRows(ledgerPath(rows[0].at.slice(0, 10)), rows, { api });
  }
  console.log(JSON.stringify(verdict, null, 2));
}
