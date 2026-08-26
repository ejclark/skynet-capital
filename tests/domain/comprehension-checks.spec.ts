import { COMPREHENSION_CHECKS, checkFor } from "../../src/domain/comprehension-checks.js";
import { OPTION_CHECKS } from "../../src/domain/comprehension-checks-options.js";
import { STOCK_CHECKS } from "../../src/domain/comprehension-checks-stock.js";
import { COURSES } from "../../src/domain/curriculum.js";

const milestoneIds = new Set(COURSES.flatMap((c) => c.milestones.map((m) => m.id)));

describe("the question bank — content as data, scoped to the curriculum we already have", () => {
  it("composes the bank from the per-course files, in curriculum order", () => {
    expect(COMPREHENSION_CHECKS).toEqual([...STOCK_CHECKS, ...OPTION_CHECKS]);
    expect(COMPREHENSION_CHECKS.map((c) => c.milestoneId)).toEqual([
      "first-buy",
      "first-sell",
      "first-cash-secured-put",
      "first-covered-call",
      "first-long-put",
      "first-long-call",
    ]);
  });

  it("gates only milestones that actually exist — no invented curriculum", () => {
    for (const check of COMPREHENSION_CHECKS) {
      expect(milestoneIds.has(check.milestoneId)).toBe(true);
    }
  });

  it("asks three to five questions per check, each with a real answer and a reason", () => {
    for (const check of COMPREHENSION_CHECKS) {
      expect(check.questions.length).toBeGreaterThanOrEqual(3);
      expect(check.questions.length).toBeLessThanOrEqual(5);
      expect(check.concept.length).toBeGreaterThan(0);
      for (const q of check.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.options.length);
        // Every answer carries its plain-language reason — a result is never a bare score.
        expect(q.why.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps question ids unique inside a check, so answers can't collide on the form", () => {
    for (const check of COMPREHENSION_CHECKS) {
      const ids = check.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("resolves a check by milestone id, and leaves anything else ungated", () => {
    expect(checkFor("first-buy")?.title).toBe("Owning shares");
    expect(checkFor("first-long-call")?.concept).toContain("leverage");
    expect(checkFor("not-a-milestone")).toBeUndefined();
  });
});
