// THE FEEDBACK LANE'S MODEL-TIER DECISION — split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the
// noExcessiveLinesPerFile split). Standalone on purpose: `claimFeedback` and the `--model-tier` CLI
// flag both call this, and neither needs anything else in this file.
//
// THIS LIVED IN THE WORKFLOW AS BASH UNTIL 2026-08-22, AND IT BROKE THE LANE. Under
// `set -euo pipefail`, a `$(… && echo …)` inside the reason string exits 1 whenever the `&&` short-
// circuits — so every feedback issue over 600 chars WITHOUT a code fence killed its own build step
// before Claude was ever invoked (run 32545818804, issue #475, 1,410 chars). Silent: the job failed
// after the claim lease was taken, so the issue looked claimed and nothing built it. The fix is not
// a better `&&`; it is a pure, specced function that cannot short-circuit — this file, ever since.
//
// 2026-08-22 (Eric): removed a length-based Haiku/Sonnet split — "the plan gets handed off to a gha
// job connected to my personal account which has headroom to leverage me powerful llms." Every ask
// got the strong model, because the lane bills to the flat-rate Claude Code subscription
// (CLAUDE_CODE_OAUTH_TOKEN), where a cheaper model saves no money — only build quality, on exactly
// the detailed asks that deserve the most.
//
// 2026-08-31 (Eric): that decision settled COST ("thrift buys nothing here") and never examined
// TIME. Measured cost of always-Opus: issue #981, a well-scoped 3-criterion UI fix, took 18.5
// minutes end to end (confirmed from the run's own logs — ~2% setup, ~98% genuine agent turns).
// Sonnet is the new default; Opus is the escalation, not the floor. The escalation signal is
// STRUCTURAL — the issue's own `skynet-spec` block (readiness, criteria count) — never a text-length
// guess, which is exactly what broke the pre-2026-08-22 heuristic on detailed-but-simple asks.
// Conservative by construction: anything ambiguous (no spec block, incomplete readiness, no
// criteria) escalates to Opus rather than guessing down — under-resourcing a genuinely complex ask
// is the costly failure mode; over-resourcing a simple one only costs a few extra minutes. A `plan`
// issue (no `skynet-spec` shape at all — see docs/plans/) always falls through to "no spec block"
// and stays on Opus, unchanged from before.
//
// 2026-08-31 (Eric, same day — completing the tiering he'd just described): Sonnet is a default, not
// a floor either — a request can be simple enough for Haiku. Issue #981 (3 criteria, spec-complete)
// was Eric's own "very simple, Sonnet is enough" case, so the Haiku band sits strictly BELOW it, not
// at it: exactly 1 criterion and zero open assumptions — the single-fact, zero-ambiguity ask (a typo,
// one label rename, one color swap). 2 or 3 criteria, or any open assumption, stays on Sonnet.

const DEFAULT_MODEL = "claude-sonnet-5";
const STRONG_MODEL = "claude-opus-5";
const LIGHT_MODEL = "claude-haiku-4-5-20251001";

// Matches issue #981 exactly (3 criteria, spec-complete) — the case Eric named as "very simple/easy,
// Sonnet 5 is more than capable." The floor is deliberately at, not above, that observed case.
const MAX_SIMPLE_CRITERIA = 3;

// The Haiku band sits strictly below the Sonnet floor above: a single criterion with no open
// assumptions is the only case simple enough to hand to the lightest model.
const MAX_TRIVIAL_CRITERIA = 1;

/** The issue's `skynet-spec` fenced block, parsed — same shape/regex as feedback-scan.mjs's roundsOf.
 *  Null on anything missing or malformed; this function must never throw. */
function specOf(body) {
  const block = /```skynet-spec\s*\n([\s\S]*?)\n```/.exec(String(body ?? ""));
  if (!block) return null;
  try {
    const spec = JSON.parse(block[1]);
    return spec && typeof spec === "object" ? spec : null;
  } catch {
    return null;
  }
}

/**
 * Which model tier builds a feedback (or plan) issue. Structural signal only — the spec block's
 * `readiness` and `criteria` count — never the raw body text or its length.
 *
 * @returns {{ model: string, reason: string }}
 */
export function modelTier(body = "") {
  const spec = specOf(body);

  if (!spec) {
    return { model: STRONG_MODEL, reason: "no skynet-spec block — unscoped ask, escalate" };
  }
  if (spec.readiness !== "spec-complete") {
    const readiness = typeof spec.readiness === "string" ? spec.readiness : "missing";
    return { model: STRONG_MODEL, reason: `readiness "${readiness}" — not fully scoped, escalate` };
  }
  const criteria = Array.isArray(spec.criteria) ? spec.criteria : [];
  if (criteria.length === 0) {
    return { model: STRONG_MODEL, reason: "spec-complete but no criteria listed — escalate" };
  }
  if (criteria.length > MAX_SIMPLE_CRITERIA) {
    return {
      model: STRONG_MODEL,
      reason: `${criteria.length} acceptance criteria (over the ${MAX_SIMPLE_CRITERIA}-criterion simple-ask floor) — escalate`,
    };
  }
  const assumptions = Array.isArray(spec.assumptions) ? spec.assumptions : [];
  if (criteria.length <= MAX_TRIVIAL_CRITERIA && assumptions.length === 0) {
    return {
      model: LIGHT_MODEL,
      reason: `spec-complete, ${criteria.length} criterion, no open assumptions — trivial, downgrade`,
    };
  }
  return {
    model: DEFAULT_MODEL,
    reason: `spec-complete, ${criteria.length} criteria — well-scoped, default tier`,
  };
}
