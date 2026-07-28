import {
  firstPlay,
  isLocked,
  PLAY_LEVELS,
  PLAYS,
  playsAtLevel,
  unlockedPlays,
} from "../../src/domain/plays.js";

describe("plays catalog", () => {
  it("starts the ladder at the cash-covered put (the safest rung)", () => {
    expect(firstPlay().id).toBe("cash-covered-put");
    expect(firstPlay().level).toBe(1);
  });

  it("has four ascending levels, safest first", () => {
    expect(PLAY_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4]);
  });

  it("puts every uncapped-risk play at the top level only", () => {
    for (const p of PLAYS) {
      if (p.risk === "undefined") {
        expect(p.level, `${p.id} is uncapped-risk but not top-level`).toBe(4);
      }
    }
  });

  it("level 1 is all defined-risk (never expose a beginner to uncapped loss)", () => {
    for (const p of playsAtLevel(1)) {
      expect(p.risk).toBe("defined");
    }
  });

  it("withholds higher levels until the learner graduates", () => {
    const forBeginner = unlockedPlays(1);
    expect(forBeginner.every((p) => p.level === 1)).toBe(true);
    // a level-4 short straddle is locked for everyone below level 4
    const straddle = PLAYS.find((p) => p.id === "short-straddle");
    if (!straddle) throw new Error("short-straddle missing");
    expect(isLocked(straddle, 1)).toBe(true);
    expect(isLocked(straddle, 3)).toBe(true);
    expect(isLocked(straddle, 4)).toBe(false);
  });

  it("every play carries the honest teaching fields", () => {
    for (const p of PLAYS) {
      expect(p.maxProfit.length).toBeGreaterThan(0);
      expect(p.maxLoss.length).toBeGreaterThan(0);
      expect(p.whenToUse.length).toBeGreaterThan(0);
      expect(p.teaches.length).toBeGreaterThan(0);
    }
  });
});
