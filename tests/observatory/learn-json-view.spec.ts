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

  it("counts celebrations and pending checks without consuming them", () => {
    const view = learnJsonView({
      earned: [],
      points: 0,
      rank: { title: "Observer" } as never,
      unlockedLevels: new Set([100]),
      celebrating: [{ milestoneId: "x" } as never],
      pendingChecks: [{ milestoneId: "y" } as never, { milestoneId: "z" } as never],
    });
    expect(view.celebrating).toBe(1);
    expect(view.pendingChecks).toBe(2);
  });
});
