import { COURSES, totalPoints } from "../../src/domain/curriculum.js";
import { learnJsonView } from "../../src/observatory/learn-json-view.js";

/** The journey's JSON twin: proof rides every earn, locks derive bottom-up, and an unlinked
 *  session gets the browsable journey from zero — never a wall. */

describe("learnJsonView", () => {
  it("renders the unlinked journey from zero with only the first level open", () => {
    const view = learnJsonView(undefined);
    expect(view.linked).toBe(false);
    expect(view.points).toBe(0);
    expect(view.rank).toBe("Observer");
    expect(view.totalPoints).toBe(totalPoints());
    expect(view.courses[0]?.locked).toBe(false);
    expect(view.courses.slice(1).every((c) => c.locked)).toBe(true);
  });

  it("carries the fill proof on every earned milestone — nothing self-marked", () => {
    const first = COURSES[0]?.milestones[0];
    if (!first) throw new Error("curriculum has no milestones");
    const view = learnJsonView({
      earned: [
        {
          milestoneId: first.id,
          code: first.tradeType ?? ("S1" as never),
          orderId: "ord-77",
          at: "2026-08-20T14:00:00Z",
        },
      ],
      points: first.points,
      rank: { title: "Apprentice" } as never,
      unlockedLevels: new Set([100, 200]),
    });
    const milestone = view.courses[0]?.milestones[0];
    expect(milestone?.earned).toEqual({ on: "2026-08-20", orderId: "ord-77" });
    expect(view.courses[0]?.done).toBe(1);
    expect(view.courses.find((c) => c.level === 200)?.locked).toBe(false);
  });

  it("carries the celebration whole — name, code, and the rung it opened", () => {
    const view = learnJsonView({
      earned: [],
      points: 0,
      rank: { title: "Observer" } as never,
      unlockedLevels: new Set([100]),
      celebrating: [{ milestoneId: "first-buy", code: "101", orderId: "o1", at: "2026-08-20" }],
      pendingChecks: [],
    });
    const fanfare = view.celebrating[0];
    expect(fanfare?.milestoneId).toBe("first-buy");
    expect(fanfare?.code).toBe("101");
    expect(fanfare?.name.length).toBeGreaterThan(0); // the curriculum title, never a bare code
    expect(fanfare?.opened?.code).toBe("102"); // the next rung on the ladder
    expect(view.check).toBeUndefined();
  });

  it("ships the gate's questions WITHOUT the answer key or the reasons", () => {
    const view = learnJsonView({
      earned: [],
      points: 0,
      rank: { title: "Observer" } as never,
      unlockedLevels: new Set([100]),
      celebrating: [],
      // first-buy is a real gated milestone in the comprehension bank.
      pendingChecks: [{ milestoneId: "first-buy", code: "101", orderId: "o1", at: "2026-08-20" }],
    });
    expect(view.pendingChecks).toBe(1);
    const gate = view.check;
    expect(gate?.milestoneId).toBe("first-buy");
    expect(gate?.questions.length).toBeGreaterThan(0);
    expect(gate?.needed).toBe((gate?.total ?? 0) - 1); // one miss still passes
    for (const q of gate?.questions ?? []) {
      expect(q.options.length).toBeGreaterThan(1);
    }
    // The browser is asked, never trusted: grading fields must not serialize.
    const wire = JSON.stringify(view);
    expect(wire.includes("answerIndex")).toBe(false);
    expect(wire.includes('"why"')).toBe(false);
  });

  it("carries the engagement celebration — title and points, no ladder code", () => {
    const view = learnJsonView({
      earned: [],
      points: 0,
      rank: { title: "Observer" } as never,
      unlockedLevels: new Set([100]),
      celebrating: [],
      pendingChecks: [],
      engagementCelebrating: [{ milestoneId: "first-feedback", at: "2026-08-26" }],
    });
    expect(view.engagementCelebrating).toEqual([
      {
        milestoneId: "first-feedback",
        title: "Meet Moneypenny — file your first feedback",
        points: 10,
      },
    ]);
  });

  it("has nothing to celebrate on the engagement track by default", () => {
    const view = learnJsonView(undefined);
    expect(view.engagementCelebrating).toEqual([]);
  });
});
