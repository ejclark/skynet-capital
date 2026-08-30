import {
  MAX_MESSAGES,
  MAX_TOKENS,
  MAX_USER_ROUNDS,
  THROTTLE_MAX,
} from "../../src/server/feedback-coach-limits.js";

// The coach's round/message/token/throttle caps — open feature work since #928 (2026-08-30), not a
// spend dial. Asserted as a RULE rather than as a snapshot of today's numbers so a future edit
// stays inside sane bounds even though it no longer needs Eric's manual click.
//
// The model dial (the one constant that actually changes the metered bill) moved to
// feedback-coach-model.ts, still in envelope.json — see feedback-coach-model.spec.ts.
describe("feedback coach limits", () => {
  // The ceiling is derived from the completeness bar — a bug's four items plus one spare for a
  // vague answer — not picked. It is a ceiling, not a target: the coach drafts as soon as the bar
  // is met, so this only binds on a conversation that stays unclear.
  it("allows enough rounds to clear the largest completeness bar, and no more", () => {
    expect(MAX_USER_ROUNDS).toBeGreaterThanOrEqual(5);
    expect(MAX_USER_ROUNDS).toBeLessThanOrEqual(6);
  });

  it("bounds the conversation to the rounds it allows — every knob stays finite", () => {
    // one opening note + a question/answer pair per round, with headroom for the closing draft
    expect(MAX_MESSAGES).toBeGreaterThanOrEqual(MAX_USER_ROUNDS * 2);
    expect(MAX_TOKENS).toBeGreaterThan(0);
    expect(MAX_TOKENS).toBeLessThanOrEqual(2000);
    expect(THROTTLE_MAX).toBeLessThanOrEqual(60);
  });
});
