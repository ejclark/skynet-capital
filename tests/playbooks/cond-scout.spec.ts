import {
  COND_SCOUT_ID,
  classifyCondition,
  parseCondScoutUniverse,
  readConditions,
  scanConditions,
} from "../../src/playbooks/cond-scout.js";
import { aContext } from "../support/builders.js";

/** 30 daily closes: flat at 100, then a slide to ~80 over the last 15 sessions (RSI near 0). */
const SLIDE = [
  ...Array.from({ length: 15 }, () => 100),
  ...Array.from({ length: 15 }, (_, i) => 99 - i * 1.3),
];
/** 30 daily closes climbing steadily from 90 to ~119 (price well above its 20-day average). */
const CLIMB = Array.from({ length: 30 }, (_, i) => 90 + i);
/** 30 daily closes zig-zagging down (−2, +1.2): below its average, but RSI ~38 — a downtrend, not
 *  an oversold stretch. */
const FALL = Array.from({ length: 30 }, (_, i) => 120 - 0.8 * Math.floor(i / 2) - (i % 2) * 2);

describe("parseCondScoutUniverse", () => {
  it("is dark by default", () => {
    expect(parseCondScoutUniverse(undefined)).toEqual([]);
    expect(parseCondScoutUniverse("")).toEqual([]);
  });

  it("uppercases, trims, dedupes and drops tokens that aren't tickers", () => {
    expect(parseCondScoutUniverse(" nvda, MSFT,nvda, brk.b, 12x, , toolongticker")).toEqual([
      "NVDA",
      "MSFT",
      "BRK.B",
    ]);
  });
});

describe("readConditions", () => {
  it("leaves RSI and the average out when the history can't support them", () => {
    const reading = readConditions(aContext({ NVDA: { last: 100 } }), "NVDA", [100, 101, 102]);
    expect(reading).toEqual({ symbol: "NVDA", price: 100 });
  });

  it("reads RSI, the 20-day average and the distance from it", () => {
    const reading = readConditions(aContext({ NVDA: { last: 125 } }), "NVDA", CLIMB);
    expect(reading?.rsi).toBe(100);
    expect(reading?.sma).toBeCloseTo(109.5, 5);
    expect(reading?.distanceFromSma).toBeCloseTo((125 - 109.5) / 109.5, 5);
  });

  it("returns nothing for a symbol with no quote", () => {
    expect(readConditions(aContext({}), "NVDA", CLIMB)).toBeUndefined();
  });
});

describe("classifyCondition", () => {
  it("names oversold, uptrend, downtrend and unclassified", () => {
    expect(classifyCondition({ symbol: "X", price: 80, rsi: 20, distanceFromSma: -0.1 })).toBe(
      "oversold",
    );
    expect(classifyCondition({ symbol: "X", price: 110, rsi: 60, distanceFromSma: 0.05 })).toBe(
      "uptrend",
    );
    expect(classifyCondition({ symbol: "X", price: 90, rsi: 40, distanceFromSma: -0.05 })).toBe(
      "downtrend",
    );
    expect(classifyCondition({ symbol: "X", price: 100, rsi: 50, distanceFromSma: 0.001 })).toBe(
      "unclassified",
    );
    expect(classifyCondition({ symbol: "X", price: 100 })).toBe("unclassified");
  });
});

describe("scanConditions", () => {
  it("names an oversold rebound with a dated, falsifiable forecast", () => {
    const [h] = scanConditions(aContext({ AMD: { last: 80, sentiment: 0.1 } }), ["AMD"], {
      AMD: SLIDE,
    });
    expect(h).toMatchObject({
      symbol: "AMD",
      condition: "oversold",
      hypothesis: "oversold-rebound",
    });
    expect(h?.forecast.direction).toBe("up");
    expect(h?.forecast.horizonMs).toBe(5 * 86_400_000);
    expect(h?.forecast.invalidator).toContain("76.00");
    expect(h?.triggers[0]).toMatch(/^RSI \d/);
  });

  it("stands aside on an oversold name when the news behind it is negative", () => {
    const found = scanConditions(aContext({ AMD: { last: 80, sentiment: -0.4 } }), ["AMD"], {
      AMD: SLIDE,
    });
    expect(found).toEqual([]);
  });

  it("names a trend continuation only with momentum behind it", () => {
    const withMomentum = scanConditions(
      aContext({ MSFT: { last: 125, momentum: 0.01, sentiment: 0.2 } }),
      ["MSFT"],
      { MSFT: CLIMB },
    );
    expect(withMomentum[0]).toMatchObject({
      condition: "uptrend",
      hypothesis: "trend-continuation",
    });
    expect(withMomentum[0]?.forecast.horizonMs).toBe(14 * 86_400_000);

    const flat = scanConditions(aContext({ MSFT: { last: 125, momentum: 0 } }), ["MSFT"], {
      MSFT: CLIMB,
    });
    expect(flat).toEqual([]);
  });

  it("holds no view on a downtrend — long-only, so no bet is dressed up to fill the slot", () => {
    const found = scanConditions(aContext({ INTC: { last: 88, momentum: -0.01 } }), ["INTC"], {
      INTC: FALL,
    });
    expect(found).toEqual([]);
  });

  it("skips symbols with an open probe and caps at maxPicks, strongest first", () => {
    const context = aContext({
      AMD: { last: 80 },
      MU: { last: 70 },
      NVDA: { last: 60 },
    });
    const closes = { AMD: SLIDE, MU: SLIDE, NVDA: SLIDE };
    const found = scanConditions(context, ["AMD", "MU", "NVDA"], closes, new Set(["MU"]), {
      maxPicks: 1,
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.symbol).not.toBe("MU");
  });

  it("reserves its own playbook id, distinct from the beta scout's", () => {
    expect(COND_SCOUT_ID).toBe("COND-SCOUT");
  });
});
