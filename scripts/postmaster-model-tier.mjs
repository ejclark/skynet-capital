// THE FEEDBACK LANE'S MODEL-TIER DECISION — split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the
// noExcessiveLinesPerFile split). Standalone on purpose: `claimFeedback` and the `--model-tier` CLI
// flag both call this, and neither needs anything else in this file.

// The build lane runs on the Claude Code SUBSCRIPTION (CLAUDE_CODE_OAUTH_TOKEN), not the metered
// API — so the strongest model available is the right default. Route by who pays, not by taste.
const BUILD_MODEL = "claude-opus-5";

/**
 * Which model tier builds a feedback issue (Eric, 2026-08-20: "adjust the model between haiku 4.5
 * and sonnet 5 based on the user's prompt/articulated needs… rewarding their engagement is worth
 * the token burn"). A member who writes real detail is describing something worth Sonnet's
 * judgment; a one-liner gets Haiku's cheaper, faster pass.
 *
 * THIS LIVED IN THE WORKFLOW AS BASH UNTIL 2026-08-22, AND IT BROKE THE LANE. Under
 * `set -euo pipefail`, a `$(… && echo …)` inside the reason string exits 1 whenever the `&&` short-
 * circuits — so every feedback issue over 600 chars WITHOUT a code fence killed its own build step
 * before Claude was ever invoked (run 32545818804, issue #475, 1,410 chars). Silent: the job failed
 * after the claim lease was taken, so the issue looked claimed and nothing built it. The fix is not
 * a better `&&`; it is this function, which is pure, specced, and cannot short-circuit.
 *
 * THE TIER IS GONE, AND THAT IS THE POINT (2026-08-22, Eric: "the plan gets handed off to a gha job
 * connected to my personal account which has headroom to leverage me powerful llms to research and
 * build out solutions"). It used to send short asks to Haiku and long ones to Sonnet — economizing
 * on a lane billed to a FLAT-RATE subscription, where economizing saves nothing and costs build
 * quality on exactly the detailed asks that deserve the most. The metered side (the /feedback
 * coach, ANTHROPIC_API_KEY) is where cheap belongs; see src/server/feedback-coach-limits.ts.
 *
 * The function survives the heuristic deliberately: it is the specced seam that replaced the bash,
 * and the "never throws" guarantee below is the regression test for the incident above.
 *
 * @returns {{ model: string, reason: string }}
 */
export function modelTier(body = "") {
  const text = String(body ?? "");
  const fenced = text.includes("```");
  const detail = fenced ? ", includes a code block" : "";
  return { model: BUILD_MODEL, reason: `member ask (${text.length} chars${detail})` };
}
