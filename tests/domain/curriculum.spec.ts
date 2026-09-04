import {
  COURSES,
  courseComplete,
  graduatingLevel,
  pointsFor,
  rankFor,
  totalPoints,
  unlockedLevels,
} from "../../src/domain/curriculum.js";
import { TRADE_TYPES, tradeTypeByCode } from "../../src/domain/trade-types.js";

describe("curriculum", () => {
  it("starts the journey with stock basics (level 100), buying stock first", () => {
    const first = COURSES[0];
    expect(first?.level).toBe(100);
    expect(first?.id).toBe("stock-basics");
    expect(first?.milestones[0]?.id).toBe("first-buy");
  });

  it("unlocks each level only when the one below is complete (100 → 200 → 300)", () => {
    const empty = new Set<string>();
    expect(unlockedLevels(empty).has(100)).toBe(true);
    expect(unlockedLevels(empty).has(200)).toBe(false);

    const stocks = new Set((COURSES[0]?.milestones ?? []).map((m) => m.id));
    expect(unlockedLevels(stocks).has(200)).toBe(true);
    expect(unlockedLevels(stocks).has(300)).toBe(false);

    const throughWheel = new Set(COURSES.slice(0, 2).flatMap((c) => c.milestones.map((m) => m.id)));
    expect(unlockedLevels(throughWheel).has(300)).toBe(true);
  });

  it("only marks a course complete when every milestone is done", () => {
    const stocks = COURSES[0];
    if (!stocks) throw new Error("no stock-basics course");
    const partial = new Set([stocks.milestones[0]?.id ?? ""]);
    expect(courseComplete(stocks, partial)).toBe(false);
    const all = new Set(stocks.milestones.map((m) => m.id));
    expect(courseComplete(stocks, all)).toBe(true);
  });

  it("names the course a milestone graduates only when it is that course's LAST milestone", () => {
    expect(graduatingLevel("first-buy")).toBeUndefined(); // course 100's first milestone
    expect(graduatingLevel("first-sell")).toBe(100); // course 100's last
    expect(graduatingLevel("first-cash-secured-put")).toBeUndefined(); // course 200's first
    expect(graduatingLevel("first-covered-call")).toBe(200); // course 200's last
    expect(graduatingLevel("first-long-put")).toBeUndefined(); // course 300's first
    expect(graduatingLevel("first-long-call")).toBe(300); // course 300's last, the top rung
    expect(graduatingLevel("not-a-real-milestone")).toBeUndefined();
  });

  it("sums points and climbs ranks as milestones complete", () => {
    expect(pointsFor(new Set())).toBe(0);
    expect(rankFor(0).title).toBe("Observer");
    const all = new Set(COURSES.flatMap((c) => c.milestones.map((m) => m.id)));
    expect(pointsFor(all)).toBe(totalPoints());
    expect(rankFor(totalPoints()).title).toBe("Strategist");
  });

  it("aligns 1:1 with the desk's trade-type ladder — every milestone is a real trade", () => {
    const milestones = COURSES.flatMap((c) => c.milestones);
    // Every milestone names a real desk trade type…
    for (const m of milestones) {
      expect(m.tradeType).toBeDefined();
      expect(tradeTypeByCode(m.tradeType)).toBeDefined();
    }
    // …every desk trade type has exactly one milestone…
    for (const t of TRADE_TYPES) {
      expect(milestones.filter((m) => m.tradeType === t.code)).toHaveLength(1);
    }
    // …and each course teaches its own hundreds — the numbering can never drift apart.
    for (const c of COURSES) {
      for (const m of c.milestones) {
        expect(Math.floor(Number(m.tradeType) / 100) * 100).toBe(c.level);
      }
    }
  });
});
