import { MODEL } from "../../src/server/feedback-coach-model.js";

// The coach's model dial, asserted as a RULE rather than as a snapshot of today's numbers. This is
// the metered lane — ANTHROPIC_API_KEY against api.anthropic.com, billed per token — and Eric's
// standing rule (2026-08-22) is that metered work takes the cheapest model that clears the bar,
// while the flat-rate subscription lanes take the strongest. A future edit that quietly promotes
// this lane to a premium model would otherwise be invisible: it changes no behavior a test would
// notice, only the bill.
//
// This constant is also in envelope.json (#928), so an autonomous lane cannot raise it at all —
// tests/arch/envelope.spec.ts holds that half. This file holds the half a HUMAN could get wrong.
describe("feedback coach model", () => {
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
});
