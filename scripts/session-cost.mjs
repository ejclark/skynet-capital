#!/usr/bin/env node
// The one place that reads claude-code-action's execution-output file — the cost meter (#2979) and
// the failure dump both go through here, so the file's SHAPE is known in exactly one module.
//
// Provenance (run 35212702833, issue #3215): the meter lived as inline jq in
// moneypenny-events.yml and read the file as an OBJECT:
//
//     COST=$(jq -r '.total_cost_usd // "?"' "$F")
//     jq: error (at claude-execution-output.json:9017): Cannot index array with string "total_cost_usd"
//     ##[error]Process completed with exit code 5.
//
// It is an ARRAY. The action writes `JSON.stringify(messages)` — every stream-json message of the
// session, in order (base-action/src/execution-file.ts at the pinned sha) — and the cost fields
// live on the single message with `type: "result"`, the last one. So `.total_cost_usd` indexed an
// array with a string, jq exited 5, and `bash -e` turned a diagnostic read into a RED JOB on all
// six matrix legs of a run whose research sessions had every one of them SUCCEEDED.
//
// The second-order failure is the one that actually mattered. The spend circuit breaker
// (scripts/moneypenny/circuit-breaker.mjs, #2946) totals research spend by grepping run logs for
// this meter's `::notice::cost — event=<id> usd=<n>` line. jq died BEFORE that line was ever
// echoed, so every completed session contributed $0, the trailing-window total was always $0.00,
// and the dollar ceiling that exists to stop a runaway lane could not trip. A red X was the loud
// half; a silently disarmed breaker was the expensive half.
//
// Two rules this module holds:
//
//  1. NEVER non-zero. This is a meter, not a gate — `if: always()` plus `bash -e` means any exit
//     code here marks the job failed and files a repair issue for a session that did its work.
//     A missing file, malformed JSON, or an array with no result message are all reported in the
//     line itself ("?" / a stated reason), never by exit status.
//  2. The notice format is a CONTRACT, not cosmetics — circuit-breaker.mjs parses it. Changing the
//     wording silently zeroes the spend total, which reads as "nothing was spent", which is the
//     fail-open direction. tests/scripts/session-cost.spec.ts pins the emitted line against the
//     breaker's own parser so a reformat fails the build instead of the safety valve.
//
// CLI contract (a meter — ALWAYS exit 0):
//   EVENT_ID=<id> [RESULT_FILE=<path>] node scripts/session-cost.mjs [--dump]
// prints the `::notice::` cost line on stdout and appends one markdown row to $GITHUB_STEP_SUMMARY
// when that env var names a file. With --dump it prints the result envelope as JSON instead — the
// terminal envelope ONLY (is_error, duration_ms, num_turns, total_cost_usd, modelUsage and any
// error text), never the conversation transcript the action's security note is about.
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The greppable line's shape. circuit-breaker.mjs's recentResearchSpend greps run logs for this
 *  exact prefix to total a window's spend — a coupling pinned by spec (this meter's real output is
 *  fed to the breaker's real parser), not by one module importing the other. */
export const COST_NOTICE_PREFIX = "::notice::cost — event=";

/** Pure. The terminal result envelope inside an execution-output payload, or a stated reason it
 *  has none. Accepts BOTH shapes on purpose: the array of stream-json messages the action writes
 *  today, and a bare result object — the `--output-format json` shape — so a future action change
 *  in either direction degrades to a correct reading rather than to exit 5 again. */
export function resultEnvelope(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { envelope: null, reason: "unreadable result envelope (malformed JSON)" };
  }
  if (Array.isArray(parsed)) {
    const results = parsed.filter((m) => m && typeof m === "object" && m.type === "result");
    const last = results.at(-1);
    return last
      ? { envelope: last, reason: "" }
      : {
          envelope: null,
          // A transcript with no result message means the CLI was killed mid-session (a timeout,
          // a cancelled job) — real, and worth saying out loud rather than printing "?" fields.
          reason: `no result message in ${parsed.length} stream messages (session ended without one)`,
        };
  }
  // Already the envelope — the `--output-format json` shape.
  if (parsed && typeof parsed === "object") return { envelope: parsed, reason: "" };
  return { envelope: null, reason: "unreadable result envelope (not an object or array)" };
}

/** Pure. A field of the envelope rendered for the line, or "?" — the same answer the old jq
 *  `// "?"` gave, and the shape circuit-breaker.mjs's `[\d.]+` deliberately does not match, so an
 *  unknown cost contributes nothing to the total instead of contributing a bogus zero. */
function field(envelope, key) {
  const value = envelope?.[key];
  return value === undefined || value === null ? "?" : String(value);
}

/** Pure. The greppable one-liner — the circuit breaker's input. */
export function costNotice(id, { envelope, reason }) {
  if (!envelope) return `${COST_NOTICE_PREFIX}${id} ${reason}`;
  return (
    `${COST_NOTICE_PREFIX}${id} usd=${field(envelope, "total_cost_usd")} ` +
    `turns=${field(envelope, "num_turns")} duration_ms=${field(envelope, "duration_ms")} ` +
    `is_error=${field(envelope, "is_error")}`
  );
}

/** Pure. The step-summary row — the per-tick table that answers "what did this push cost" without
 *  opening a job. */
export function summaryRow(id, { envelope, reason }) {
  if (!envelope) return `- \`${id}\` — ${reason}`;
  return (
    `- \`${id}\` — **$${field(envelope, "total_cost_usd")}** · ${field(envelope, "num_turns")} turns · ` +
    `${field(envelope, "duration_ms")}ms · is_error=${field(envelope, "is_error")}`
  );
}

/** The envelope as JSON for the on-failure dump, or a one-line explanation. Diagnostic, not
 *  transcript: the step this feeds used to `cat` the whole file, which — now that the shape is
 *  known — was the entire conversation, i.e. exactly what its own comment promised it was not. */
export function envelopeDump({ envelope, reason }) {
  return envelope ? JSON.stringify(envelope, null, 2) : `(${reason})`;
}

function readPayload(file) {
  try {
    return { text: readFileSync(file, "utf8"), missing: false };
  } catch {
    return { text: "", missing: true };
  }
}

if (process.argv[1]?.endsWith("session-cost.mjs")) {
  const id = process.env.EVENT_ID || "unknown";
  const file =
    process.env.RESULT_FILE ||
    join(process.env.RUNNER_TEMP || "/home/runner/work/_temp", "claude-execution-output.json");
  const { text, missing } = readPayload(file);
  const read = missing
    ? { envelope: null, reason: "no execution-output.json (died before Claude Code ran)" }
    : resultEnvelope(text);

  if (process.argv.includes("--dump")) {
    console.log(envelopeDump(read));
  } else {
    console.log(costNotice(id, read));
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) {
      try {
        appendFileSync(summary, `${summaryRow(id, read)}\n`);
      } catch {
        // The summary row is the nice-to-have half; losing it must never cost the notice line the
        // circuit breaker actually reads, and must never fail the step.
      }
    }
  }
}
