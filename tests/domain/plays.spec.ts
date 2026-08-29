import {
  firstPlay,
  isLocked,
  PLAY_LEVELS,
  PLAYS,
  playsAtLevel,
  unlockedPlays,
} from "../../src/domain/plays.js";
import { TRADE_TYPES } from "../../src/domain/trade-types.js";

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

  it("cites ruling 16's own code for the strategies it defines — never a re-numbered one", () => {
    const csp = PLAYS.find((p) => p.id === "cash-covered-put");
    const cc = PLAYS.find((p) => p.id === "covered-call");
    expect(csp?.code).toBe(TRADE_TYPES.find((t) => t.id === "sell-secured-put")?.code);
    expect(cc?.code).toBe(TRADE_TYPES.find((t) => t.id === "sell-covered-call")?.code);
    // every code cited here, when present, is one ruling 16 actually issued
    const knownCodes = new Set(TRADE_TYPES.map((t) => t.code));
    for (const p of PLAYS) {
      if (p.code !== undefined) expect(knownCodes.has(p.code)).toBe(true);
    }
  });

  it("leaves `code` undefined for strategies beyond ruling 16's current six", () => {
    const beyondRuling16 = [
      "bull-call-spread",
      "iron-condor",
      "butterfly",
      "long-strangle",
      "short-straddle",
      "call-ladder",
    ];
    for (const id of beyondRuling16) {
      expect(PLAYS.find((p) => p.id === id)?.code).toBeUndefined();
    }
  });
});
