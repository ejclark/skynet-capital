import {
  COURSES,
  courseComplete,
  pointsFor,
  rankFor,
  totalPoints,
  unlockedLevels,
} from "../../src/domain/curriculum.js";

describe("curriculum", () => {
  it("starts the journey with the Wheel (level 100), buying stock first", () => {
    const first = COURSES[0];
    expect(first?.level).toBe(100);
    expect(first?.milestones[0]?.id).toBe("buy-first-stock");
  });

  it("keeps level 100 open and level 200 locked until 100 is complete", () => {
    const empty = new Set<string>();
    expect(unlockedLevels(empty).has(100)).toBe(true);
    expect(unlockedLevels(empty).has(200)).toBe(false);

    const done = new Set((COURSES[0]?.milestones ?? []).map((m) => m.id));
    expect(unlockedLevels(done).has(200)).toBe(true);
  });

  it("only marks a course complete when every milestone is done", () => {
    const wheel = COURSES[0];
    if (!wheel) throw new Error("no wheel course");
    const partial = new Set([wheel.milestones[0]?.id ?? ""]);
    expect(courseComplete(wheel, partial)).toBe(false);
    const all = new Set(wheel.milestones.map((m) => m.id));
    expect(courseComplete(wheel, all)).toBe(true);
  });

  it("sums points and climbs ranks as milestones complete", () => {
    expect(pointsFor(new Set())).toBe(0);
    expect(rankFor(0).title).toBe("Observer");
    const all = new Set(COURSES.flatMap((c) => c.milestones.map((m) => m.id)));
    expect(pointsFor(all)).toBe(totalPoints());
    expect(rankFor(totalPoints()).title).toBe("Strategist");
  });
});
