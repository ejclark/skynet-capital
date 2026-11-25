// STEER READS — the two GitHub reads `gather.mjs` makes per issue, each made only where it can
// change the page (#8289 slice 2).
//
// WHY. Every session draws on one 5,000/hr REST allowance (#8289). `npm run rest:meter` on one
// gather (2026-11-25) counted 98 REST calls, and two habits were most of the cuttable share:
//   - a blocking list read for every Needs-you issue: 11 reads, and 1 of those 11 issues blocked
//     anything. The open-issue list row already says so (`issue_dependencies_summary.blocking`),
//     the rule `rank`'s REST path uses since #8489 (`needOf` in queue-facts.mjs, reused here).
//   - `admission.mjs` run twice as child processes, `--queue` then `--next` (45 calls). Each read
//     the `ready` list and the same plans' state blocks, because two processes share nothing.
//     Both now run in this process through the same `runCli`, with those two reads shared.
//
// NOTHING ELSE CHANGES: the same admission CLI decides both answers (no second copy of the pull
// rule, gather.mjs's header), its stderr notices are dropped as the child's piped stderr was, and
// exit 3 with an answer is still an answer.

import { readOpenIssues, runCli } from "../moneypenny/admission.mjs";
import { ghRest } from "../moneypenny/gh.mjs";
import { LABELS } from "../moneypenny/labels.mjs";
import { readPickupHold } from "../moneypenny/pickup-hold.mjs";
import { needOf } from "../queue-facts.mjs";

/**
 * Each Needs-you issue's open blocked issues, by number. A PR is skipped (it blocks nothing here);
 * an issue whose list row counts no blocker gets `[]` without a read. A row with no summary, or no
 * row at all, is read, so a missing field never hides a blocker.
 */
export function blockingLists(needsYou = [], { issues = [], prs = [] } = {}, read = ghRest) {
  const rows = new Map(issues.map((i) => [i.number, i]));
  const blocks = {};
  for (const { number: n } of needsYou) {
    if (prs.some((p) => p.number === n)) continue;
    const row = rows.get(n);
    blocks[n] = (
      row && !needOf(row).blocks ? [] : (read(`issues/${n}/dependencies/blocking`) ?? [])
    )
      .filter((b) => b.state === "open")
      .map((b) => b.number);
  }
  return blocks;
}

/** Remember a function's answer per key, a thrown read included, so a retry costs no second call. */
function once(fn, key = () => "") {
  const seen = new Map();
  return (...args) => {
    const k = key(...args);
    if (!seen.has(k)) {
      try {
        seen.set(k, { value: fn(...args) });
      } catch (error) {
        seen.set(k, { error });
      }
    }
    const hit = seen.get(k);
    if (hit.error) throw hit.error;
    return hit.value;
  };
}

/** Drop a notice line: the child process's stderr was piped and never shown, so the page's run
 *  log stays as it was. */
const quiet = () => undefined;

/**
 * `admission.mjs --queue` and `--next`, one process, the `ready` list and each plan's hold read
 * once between them. Returns `ask(flag)` → the CLI's parsed JSON. Exit 0, or 3 with an answer, is an
 * answer; anything else throws, as the child process's exit did.
 */
export function admissionReads({
  run = runCli,
  readReady = () => readOpenIssues(LABELS.ready.name),
  readHold = (issue) => readPickupHold(issue, { log: quiet }),
} = {}) {
  const shared = {
    readReady: once(readReady),
    readHold: once(readHold, (issue) => issue.number),
    printErr: quiet,
  };
  return (flag) => {
    let out = "";
    const code = run([flag], {
      ...shared,
      print: (line) => {
        out += line;
      },
    });
    if (!(code === 0 || (code === 3 && out))) {
      throw new Error(`steer/gather: admission.mjs ${flag} exited ${code} with no answer`);
    }
    return JSON.parse(out);
  };
}
