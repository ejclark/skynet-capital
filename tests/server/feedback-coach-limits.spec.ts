import {
  MAX_MESSAGES,
  MAX_TOKENS,
  MAX_USER_ROUNDS,
  MODEL,
  THROTTLE_MAX,
} from "../../src/server/feedback-coach-limits.js";

// The coach's cost dials, asserted as a RULE rather than as a snapshot of today's numbers. This is
// the metered lane — ANTHROPIC_API_KEY against api.anthropic.com, billed per token — and Eric's
// standing rule (2026-08-22) is that metered work takes the cheapest model that clears the bar,
// while the flat-rate subscription lanes take the strongest. A future edit that quietly promotes
// this lane to a premium model would otherwise be invisible: it changes no behavior a test would
// notice, only the bill.
//
// These constants are also in envelope.json, so an autonomous lane cannot raise them at all —
// tests/arch/envelope.spec.ts holds that half. This file holds the half a HUMAN could get wrong.
describe("feedback coach limits", () => {
  it("keeps the metered lane on a cheap model — never a premium one", () => {
    expect(MODEL).toContain("haiku");
    expect(MODEL).not.toContain("opus");
    expect(MODEL).not.toContain("sonnet");
    expect(MODEL).not.toContain("fable");
  });

  it("uses a current, undated model id", () => {
    expect(MODEL).toMatch(/^claude-[a-z]+-[0-9-]+$/);
    expect(MODEL).not.toMatch(/-\d{8}$/);
  });

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
