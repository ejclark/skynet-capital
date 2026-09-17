// THE COST METER'S READER (#2979, repaired 2026-09-17 — issue #3229).
//
// WHAT BROKE. The meter shipped 2026-09-15 as four `jq -r '.total_cost_usd'` reads inside a
// `run:` block, written against the shape docs/LESSONS.md quotes for the CLI's result envelope:
// a single `{"type":"result","is_error":…,"total_cost_usd":…}` object. That is not what
// claude-code-action leaves at `/home/runner/work/_temp/claude-execution-output.json`. It leaves
// the whole stream-json conversation, collected into a JSON ARRAY whose LAST element is that
// result message. So every read failed with
//
//     jq: error (…): Cannot index array with string "total_cost_usd"     → exit 5
//
// and, because the step is `if: always()`, a metering read turned six finished research sessions
// into six failed jobs. 12 of 12 matrix legs, both runs where `build-events` actually ran after
// the meter landed (35212702833, 35214579484) — a 100% failure rate, not a flake.
//
// TWO CONSEQUENCES, ONE OF THEM QUIET. The loud one is red `main`. The quiet one is that the
// spend circuit breaker (#2946) reads spend by grepping this very `::notice::cost` line out of run
// logs — with the meter dead, no line was ever written, every window summed to $0.00, and the
// dollar cap that exists to stop a runaway lane could not have tripped. A broken meter does not
// just fail to report; it silently disarms the thing downstream of it.
//
// WHY IT IS A SCRIPT NOW. `scripts/workflow-lint.mjs` "skips block scalars (`run: |`) wholesale,
// which is where arbitrary shell text lives" — the standing house rule is that a decision inside a
// workflow `run:` block is unspecced by construction, so it moves here and the workflow keeps a
// shim. Same move, same reason, as model-tier.mjs after the 2026-08-22 outage.
//
// TOTAL BY CONSTRUCTION. Every export below returns a value for every input and throws for none,
// and the CLI exits 0 on every path. That is the actual lesson of #3229, above and beyond the
// wrong jq path: a metering read is an OBSERVER of a job, never a gate on it. If this file cannot
// work out what a session cost, the correct outcome is a line that says so — never a red job on
// top of work that already succeeded.
import { appendFileSync, readFileSync } from "node:fs";

/** Where claude-code-action always writes the CLI's structured output, whatever the outcome. */
export const EXECUTION_OUTPUT = "/home/runner/work/_temp/claude-execution-output.json";

/** What every field reads as when the file cannot answer for it. Deliberately NOT `0`: the spend
 *  breaker's `usd=([\d.]+)` regex skips this, so an unreadable session is counted as unknown
 *  rather than as free. */
const UNKNOWN = "?";

/** A decimal that the breaker's `[\d.]+` regex can actually match — `String(1e-7)` is `"1e-7"`,
 *  which it cannot. Normal costs stringify unchanged, so the line is byte-identical to the jq
 *  version's for every value the lane has ever produced. */
function decimal(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return UNKNOWN;
  const plain = String(n);
  return plain.includes("e") ? n.toFixed(6) : plain;
}

function scalar(v) {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return String(v);
  return UNKNOWN;
}

/**
 * The CLI's terminal `{"type":"result",…}` message, dug out of whatever the action left behind —
 * the stream-json array (the real shape), a bare result object (the shape the meter was written
 * against), or neither.
 *
 * @param {string | null | undefined} raw file text, or null when there is no file
 * @returns {{ message: Record<string, unknown> | null, note: string }}
 */
export function resultMessage(raw) {
  if (raw === null || raw === undefined) return { message: null, note: "no-file" };
  if (String(raw).trim() === "") return { message: null, note: "empty-file" };

  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return { message: null, note: "unparseable-json" };
  }

  if (Array.isArray(parsed)) {
    // Last, not first: a resumed or retried session can emit more than one result message, and the
    // terminal one is the session's actual outcome.
    for (let i = parsed.length - 1; i >= 0; i--) {
      const msg = parsed[i];
      if (msg && typeof msg === "object" && msg.type === "result")
        return { message: msg, note: "" };
    }
    // A result message with no `type` has never been observed, but a cost field is unambiguous
    // enough to trust over reporting nothing.
    for (let i = parsed.length - 1; i >= 0; i--) {
      const msg = parsed[i];
      if (msg && typeof msg === "object" && "total_cost_usd" in msg)
        return { message: msg, note: "" };
    }
    return { message: null, note: `no-result-message-in-${parsed.length}-stream-events` };
  }

  if (parsed && typeof parsed === "object") return { message: parsed, note: "" };
  return { message: null, note: "not-an-object" };
}

/**
 * What one session cost, as strings ready for the log line. Never throws; unknowns read `"?"`.
 *
 * @param {string | null | undefined} raw
 * @returns {{ usd: string, turns: string, durationMs: string, isError: string, note: string }}
 */
export function sessionCost(raw) {
  const { message, note } = resultMessage(raw);
  if (!message)
    return { usd: UNKNOWN, turns: UNKNOWN, durationMs: UNKNOWN, isError: UNKNOWN, note };
  return {
    usd: decimal(message.total_cost_usd),
    turns: scalar(message.num_turns),
    durationMs: scalar(message.duration_ms),
    isError: scalar(message.is_error),
    note,
  };
}

/** The greppable run-log line. FORMAT IS A CONTRACT: circuit-breaker.mjs's `recentResearchSpend`
 *  parses `::notice::cost — event=<id> usd=<n>` out of run logs to total the rolling window, and
 *  tests/scripts/moneypenny/session-cost.spec.ts pins the two ends against each other. */
export function costNotice(eventId, cost) {
  if (cost.note === "no-file") {
    return `::notice::cost — event=${eventId} no execution-output.json (died before Claude Code ran)`;
  }
  const suffix = cost.note ? ` note=${cost.note}` : "";
  return (
    `::notice::cost — event=${eventId} usd=${cost.usd} turns=${cost.turns} ` +
    `duration_ms=${cost.durationMs} is_error=${cost.isError}${suffix}`
  );
}

/** One row of the per-tick step-summary table that aggregates every matrix leg. */
export function costSummaryRow(eventId, cost) {
  if (cost.note === "no-file") {
    return `- \`${eventId}\` — no result envelope (died before Claude Code ran)`;
  }
  const suffix = cost.note ? ` · ${cost.note}` : "";
  return (
    `- \`${eventId}\` — **$${cost.usd}** · ${cost.turns} turns · ${cost.durationMs}ms · ` +
    `is_error=${cost.isError}${suffix}`
  );
}

/**
 * The failure-path diagnostic: the terminal result envelope ONLY.
 *
 * The step that prints this predates the discovery above and `cat`s the whole file — which, now
 * that the shape is known to be the full stream-json conversation, means it has been dumping
 * entire session transcripts into the logs of a PUBLIC repo since 2026-09-09. That is the exact
 * thing claude-code-action's "full output hidden for security" note exists to prevent, and the
 * step's own comment claims it is not doing it. This returns what that comment promises: is_error,
 * duration_ms, num_turns, total_cost_usd, modelUsage and whatever error text the result carries.
 *
 * @returns {string} text to print — never the transcript, on any input
 */
export function resultEnvelopeText(raw) {
  const { message, note } = resultMessage(raw);
  if (!message) {
    return (
      `(no result envelope — ${note}. The CLI produced no terminal result message, so the failure ` +
      "happened before it could report one, e.g. an install or spawn crash.)"
    );
  }
  return JSON.stringify(message, null, 2);
}

/** stdout + the job summary, both optional sinks. Split out so the CLI below stays a router. */
function emit(line, summaryRow) {
  process.stdout.write(`${line}\n`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!(summary && summaryRow)) return;
  try {
    appendFileSync(summary, `${summaryRow}\n`);
  } catch (err) {
    // A summary that will not append is worth one line of noise and nothing more — the notice
    // above it already carries the number.
    process.stdout.write(`::warning::cost — could not append the step summary (${err.message})\n`);
  }
}

function readOutput(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** The CLI. `--envelope` is the failure diagnostic; anything else meters. Exits 0 on every path,
 *  including its own internal failure — see the file header. */
export function main(argv = [], env = process.env) {
  const file = env.CLAUDE_EXECUTION_OUTPUT || EXECUTION_OUTPUT;
  const eventId = env.EVENT_ID || "unknown";
  try {
    const raw = readOutput(file);
    if (argv.includes("--envelope")) {
      emit("::group::Claude execution result (the action hides this by default)");
      emit(resultEnvelopeText(raw));
      emit("::endgroup::");
      return 0;
    }
    const cost = sessionCost(raw);
    emit(costNotice(eventId, cost), costSummaryRow(eventId, cost));
  } catch (err) {
    // Unreachable by design — every function above is total. If it is ever reached, the meter
    // still must not redden a job that already did its work.
    emit(`::warning::cost — meter failed for event=${eventId} (${err.message}); job unaffected.`);
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
