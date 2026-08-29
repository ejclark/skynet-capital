// #852's BROAD slice (Eric, 2026-08-29 — "the intent is behavioral tests and CI quality gates are
// to prevent the need for human review/intervention", not just speed it up) — split out of
// envelope-scan.mjs to stay under noExcessiveLinesPerFile, the same way envelope-widening.mjs was.
//
// A diffAware rule may name `invariantSuite`, a spec file; a passing run of that suite is trusted as
// proof THIS diff preserved the behavior it covers — PROVIDED the diff didn't also touch the suite
// itself (see $behaviorEvidenceNote in envelope.json). "Untouched" is checked the same way every
// other fact this gate reports is — a real `git diff` against base, never a claim taken on faith —
// and, like envelope-scan.mjs's own diffFor, a git failure reads as "unknown", never as "no change":
// only a genuinely empty diff counts as unchanged, so an unresolvable base fails CLOSED (not proven
// unchanged) rather than defaulting open.
import { execFileSync } from "node:child_process";
import { structurallySafe } from "./envelope-widening.mjs";

const ROOT = process.cwd();

/** The command that runs one spec file, as [cmd, args] — overridable via ENVELOPE_SUITE_RUNNER
 *  (space-separated) so a hermetic fixture can substitute a trivial always-pass/always-fail command
 *  instead of a real test run. Exported for the specs to assert the default directly. */
export function suiteRunnerArgv(specPath) {
  const override = process.env.ENVELOPE_SUITE_RUNNER;
  const [cmd, ...args] = override ? override.split(" ") : ["npx", "rstest", "run"];
  return [cmd, [...args, specPath]];
}

/** Runs `specPath` for real, right now. True only on a clean exit — a failing case, a crash, or a
 *  missing file all read as "not proven", never as "proof unavailable, assume fine". */
function suitePasses(specPath) {
  const [cmd, args] = suiteRunnerArgv(specPath);
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** `git diff <base>..HEAD -- <path>`, or null on any git failure. Independently implemented rather
 *  than sharing envelope-scan.mjs's private diffFor (same choice envelope-widening.mjs's contentAt
 *  already made) — sibling modules stay self-contained. */
function diffFor(path, base) {
  try {
    return execFileSync("git", ["diff", `${base}..HEAD`, "--", path], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch {
    return null;
  }
}

/** Pure — the specs drive this directly. All three or nothing: a registered suite, one this diff
 *  didn't touch, actually passing right now. */
export function behaviorVerifiedFacts({ hasSuite, suiteUnchanged, suitePassed }) {
  return Boolean(hasSuite && suiteUnchanged && suitePassed);
}

/**
 * Is `rule`'s diff behavior-verified against `base`? A diff that edits its own proof gets no credit
 * from it (a diff cannot both loosen what it's judged by and be trusted by it). `main`'s own
 * `verify` gate already guarantees an unchanged suite was passing AT base; there is nothing to
 * re-check there, only that it still passes at HEAD.
 */
export function behaviorVerified(rule, base) {
  if (!rule.invariantSuite) return false;
  const diff = diffFor(rule.invariantSuite, base);
  const suiteUnchanged = diff === ""; // null (git failure) or a real change both fail closed
  return behaviorVerifiedFacts({
    hasSuite: true,
    suiteUnchanged,
    suitePassed: suiteUnchanged && suitePasses(rule.invariantSuite),
  });
}

/** Which of the three diffAware paths (if any) clears `path`'s diff, cheapest first — so a caller
 *  can name WHICH proof justified skipping the hold (#852's honesty rule: say so explicitly), not
 *  just that one did. `behaviorVerified` is checked last since it's the only one that spawns a
 *  process. `diff` is envelope-scan.mjs's classifyDiff result for `path`, computed by the caller. */
export function exemptionReason(path, base, rule, diff) {
  if (diff?.additiveSafe) return "pure-insertion";
  if (structurallySafe(path, base)) return "structural-widening";
  if (behaviorVerified(rule, base)) return "behavior-verified";
  return undefined;
}
