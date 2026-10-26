#!/usr/bin/env node
// THE ARM STEP — pipeline.yml's `arm auto-merge` job calls this instead of carrying its retry logic
// as inline bash, so the classifier is specced (tests/scripts/arm-merge.spec.ts) and a change to it
// is an ordinary PR, not a protected workflow edit.
//
//   node scripts/arm-merge.mjs retry -- <cmd> [args…]   run a gh call with the retries below; print its stdout
//   node scripts/arm-merge.mjs arm <pr>                  arm squash auto-merge, or merge directly if already green
//
// Why it moved (#6093, 2026-10-26): the inline helper retried only `rate limit|HTTP 429`, so GitHub's
// own `GraphQL: Something went wrong while executing your query` failed the job on the first try and
// left a green PR unarmed, with nothing to re-arm it. gh.mjs has classified that wording as transient
// since #4675; this reuses its classifier rather than keeping a second phrase list in step.
import { isTransientGhError, sh, sleepSync } from "./moneypenny/gh.mjs";

/**
 * What a failed gh call means for the arm step. Order matters: a rate-limit and a moved base are
 * matched before the generic 5xx test, and `done` before everything (a retried mutation that had
 * in fact landed answers "already merged" — success, not a red job).
 *  - done          the PR is already merged or already armed
 *  - rate-limit    wait for the bucket's reset (#4351)
 *  - base-moved    main moved under the merge (#4939, #5932) — retry the direct merge
 *  - already-green GitHub refuses --auto on a mergeable PR: "clean status", or "unstable status"
 *                  (every required check passed, a non-required suite still queued; #4750 —
 *                  matching "clean" alone stranded 8 of 10 stuck research PRs on 2026-10-18)
 *  - transient     GitHub's 5xx / GraphQL internal error / network reset (gh.mjs, #4675)
 *  - fatal         anything else — fail at once, a retry only repeats it
 */
export function classifyArmFailure(text) {
  const t = String(text ?? "");
  if (/already merged|auto.?merge (?:is )?already enabled/i.test(t)) return "done";
  if (/rate limit|HTTP 429/i.test(t)) return "rate-limit";
  if (/base branch was modified/i.test(t)) return "base-moved";
  if (/(?:clean|unstable) status/i.test(t)) return "already-green";
  if (isTransientGhError(t)) return "transient";
  return "fatal";
}

export const ATTEMPTS = 3;
const BACKOFF_MS = 5000; // 5s, then 10s — a GraphQL hiccup clears in seconds
const RATE_WAIT_MIN_S = 30;
const RATE_WAIT_MAX_S = 900; // two capped waits fit the job's 50-minute timeout

const errText = (err) => `${err?.stderr ?? ""} ${err?.stdout ?? ""} ${err?.message ?? ""}`;

/** Seconds until the later of the core/graphql resets, clamped to [30, 900]. Never throws. */
export function rateLimitWaitSeconds({ run = sh, now = () => Date.now() } = {}) {
  let reset = 0;
  try {
    reset = Number(
      run("gh", [
        "api",
        "rate_limit",
        "--jq",
        "[.resources.core.reset, .resources.graphql.reset] | max",
      ]),
    );
  } catch {
    // an unreadable rate_limit still waits the floor rather than failing the step
  }
  const wait = (Number.isFinite(reset) ? reset : 0) - Math.floor(now() / 1000) + 5;
  return Math.min(RATE_WAIT_MAX_S, Math.max(RATE_WAIT_MIN_S, wait));
}

/**
 * Run `cmd args` up to ATTEMPTS times, retrying only the kinds in `retryOn`; a `done` answer
 * returns `{ kind: "done" }` instead of throwing. Bounded: the last try's failure always throws.
 */
export function runWithRetry(
  cmd,
  args,
  {
    retryOn = ["rate-limit", "transient"],
    run = sh,
    sleep = sleepSync,
    log = console.error,
    waitFor = rateLimitWaitSeconds,
  } = {},
) {
  for (let n = 1; ; n++) {
    try {
      return { kind: "ok", out: run(cmd, args) };
    } catch (err) {
      const text = errText(err);
      const kind = classifyArmFailure(text);
      if (kind === "done") return { kind: "done", out: text.trim() };
      if (n >= ATTEMPTS || !retryOn.includes(kind)) {
        err.armKind = kind;
        throw err;
      }
      const ms = kind === "rate-limit" ? waitFor({ run }) * 1000 : BACKOFF_MS * 2 ** (n - 1);
      log(`${text.trim()}\n${kind} (try ${n}/${ATTEMPTS}) — retrying in ${Math.round(ms / 1000)}s`);
      sleep(ms);
    }
  }
}

/**
 * Arm squash auto-merge on `pr`. GitHub refuses --auto on an already-mergeable PR, and gh can take
 * the direct-merge path itself (so a moved base surfaces on the arm call, #5932); both fall through
 * to a direct squash, which this job may do because it only runs after verify + integration tests
 * passed. Returns "armed" | "merged" | "done"; throws on anything else.
 */
export function armPr(pr, opts = {}) {
  const log = opts.log ?? console.error;
  try {
    const r = runWithRetry("gh", ["pr", "merge", "--auto", "--squash", String(pr)], opts);
    return r.kind === "done" ? "done" : "armed";
  } catch (err) {
    if (err.armKind !== "already-green" && err.armKind !== "base-moved") throw err;
    log(`${errText(err).trim()}\nalready green — merging directly instead of arming`);
  }
  const r = runWithRetry("gh", ["pr", "merge", "--squash", String(pr)], {
    ...opts,
    retryOn: ["rate-limit", "transient", "base-moved"],
  });
  return r.kind === "done" ? "done" : "merged";
}

function main(argv) {
  const [sub, ...rest] = argv;
  if (sub === "retry" && rest[0] === "--" && rest.length > 1) {
    const r = runWithRetry(rest[1], rest.slice(2));
    if (r.out) console.log(r.out);
    return;
  }
  if (sub === "arm" && /^\d+$/.test(rest[0] ?? "")) {
    console.log(`arm-merge: #${rest[0]} ${armPr(rest[0])}`);
    return;
  }
  console.error("usage: node scripts/arm-merge.mjs retry -- <cmd> [args…] | arm <pr>");
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(errText(err).trim());
    process.exit(1);
  }
}
