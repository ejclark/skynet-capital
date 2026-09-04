import {
  COURSES,
  courseComplete,
  graduatingLevel,
  MILESTONE_COURSE_LEVEL,
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

  it("names the course a milestone belongs to only once that WHOLE course is complete", () => {
    const course100 = new Set(["first-buy", "first-sell"]);
    // Either id, once the course they share is complete, names that course — membership, not
    // canonical ladder position, is the test (see the "any order" spec below for why).
    expect(graduatingLevel("first-buy", course100)).toBe(100);
    expect(graduatingLevel("first-sell", course100)).toBe(100);
    expect(graduatingLevel("first-buy", new Set(["first-buy"]))).toBeUndefined(); // 100 incomplete

    const course200 = new Set([...course100, "first-cash-secured-put", "first-covered-call"]);
    expect(graduatingLevel("first-cash-secured-put", course200)).toBe(200);
    expect(graduatingLevel("first-covered-call", course200)).toBe(200);

    const course300 = new Set([...course200, "first-long-put", "first-long-call"]);
    expect(graduatingLevel("first-long-put", course300)).toBe(300);
    expect(graduatingLevel("first-long-call", course300)).toBe(300); // the top rung, complete

    expect(graduatingLevel("not-a-real-milestone", course300)).toBeUndefined();
  });

  it("refuses to call it a graduation when the course's last milestone is earned alone — a real gap, not a false celebration", () => {
    // Seeded/imported history can hold a course's LAST milestone without an earlier one
    // (`unlockedCodes`'s own doc: fills don't have to arrive in ladder order).
    expect(graduatingLevel("first-covered-call", new Set(["first-covered-call"]))).toBeUndefined();
    expect(graduatingLevel("first-sell", new Set(["first-sell"]))).toBeUndefined();
  });

  it("maps every milestone id to its course's level — the cheap pre-check acknowledge() uses", () => {
    expect(MILESTONE_COURSE_LEVEL.get("first-buy")).toBe(100);
    expect(MILESTONE_COURSE_LEVEL.get("first-sell")).toBe(100);
    expect(MILESTONE_COURSE_LEVEL.get("first-cash-secured-put")).toBe(200);
    expect(MILESTONE_COURSE_LEVEL.get("first-covered-call")).toBe(200);
    expect(MILESTONE_COURSE_LEVEL.get("first-long-call")).toBe(300);
    expect(MILESTONE_COURSE_LEVEL.get("not-a-real-milestone")).toBeUndefined();
    expect(MILESTONE_COURSE_LEVEL.size).toBe(COURSES.reduce((n, c) => n + c.milestones.length, 0));
  });

  it("graduates whichever milestone the participant's OWN history happens to complete the course with, in ANY order", () => {
    // The covered call (course 200's canonical LAST milestone) lands FIRST for this member —
    // that alone must not graduate anything (courseComplete is false: no CSP yet).
    expect(graduatingLevel("first-covered-call", new Set(["first-covered-call"]))).toBeUndefined();
    // The CSP (canonical FIRST) lands second and completes it — THIS is the real graduation
    // moment, even though it isn't the course's canonical-order last id.
    expect(
      graduatingLevel(
        "first-cash-secured-put",
        new Set(["first-covered-call", "first-cash-secured-put"]),
      ),
    ).toBe(200);
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
