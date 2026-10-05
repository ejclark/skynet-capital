import type { OptionContractQuote } from "../../src/domain/types.js";
import {
  absDeltaOf,
  closeAggression,
  eligibleExpirations,
  liquid,
  OPEN_TOWARD_NATURAL,
  pickByDelta,
  priceInside,
  singleLegTick,
} from "../../src/options/contract-picker.js";
import { anOptionQuote } from "../support/builders.js";

const AS_OF = "2026-10-07T15:00:00Z"; // 11:00 ET
const TODAY = "2026-10-07";
const put = (strike: number, delta: number, over: Partial<OptionContractQuote> = {}) =>
  anOptionQuote(`CRWV261106P${String(strike * 1000).padStart(8, "0")}`, {
    at: AS_OF,
    bid: 2,
    ask: 2.2,
    delta: -delta,
    openInterest: 500,
    ...over,
  });

/** Deterministic shuffle (mulberry32 + Fisher–Yates) — a failing seed reproduces exactly. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

describe("eligibleExpirations", () => {
  const listed = [
    "2026-10-09",
    "2026-10-30",
    "2026-11-06",
    "2026-11-13",
    "2026-11-20",
    "2026-10-30",
  ];

  it("keeps DTE inside [min, max], after `after`, strictly before `before`, ascending and deduped", () => {
    expect(
      eligibleExpirations(listed, TODAY, { minDte: 21, maxDte: 45, before: "2026-11-09" }),
    ).toEqual(["2026-10-30", "2026-11-06"]);
    expect(
      eligibleExpirations(listed, TODAY, { after: "2026-11-06", before: "2026-11-17" }),
    ).toEqual(["2026-11-13"]);
  });

  it("never offers today or an expired date", () => {
    expect(eligibleExpirations([TODAY, "2026-10-01"], TODAY, { before: "2027-01-01" })).toEqual([]);
  });
});

describe("liquid", () => {
  it("passes a real, tight, fresh, open quote", () => {
    expect(liquid(put(85, 0.2), AS_OF)).toBe(true);
  });

  it("refuses a sub-dime bid, a wide spread, thin open interest, a stale stamp or an old read", () => {
    expect(liquid(put(85, 0.2, { bid: 0.05, ask: 0.06 }), AS_OF)).toBe(false);
    expect(liquid(put(85, 0.2, { bid: 2, ask: 2.5 }), AS_OF)).toBe(false); // 22% of mid
    expect(liquid(put(85, 0.2, { openInterest: 40 }), AS_OF)).toBe(false);
    expect(liquid(put(85, 0.2, { quotedAt: "2026-10-07T14:40:00Z" }), AS_OF)).toBe(false);
    expect(liquid(put(85, 0.2, { quotedAt: undefined }), AS_OF)).toBe(false);
    expect(liquid(put(85, 0.2, { fetchedAt: "2026-10-07T14:57:00Z" }), AS_OF)).toBe(false);
  });

  it("does not demand open interest the feed never reported", () => {
    expect(liquid(put(85, 0.2, { openInterest: undefined }), AS_OF)).toBe(true);
  });
});

describe("absDeltaOf", () => {
  it("reads the feed's greek as |delta| when there is one", () => {
    expect(absDeltaOf(put(85, 0.21), 92, TODAY)).toEqual({ value: 0.21, source: "feed" });
  });

  it("solves it from the mid through the house model when the feed has none", () => {
    const solved = absDeltaOf(put(85, 0, { delta: undefined }), 92, TODAY);
    expect(solved?.source).toBe("model");
    expect(solved?.value).toBeGreaterThan(0.05);
    expect(solved?.value).toBeLessThan(0.5);
  });
});

describe("pickByDelta", () => {
  const spot = 92;
  const chain = [
    put(75, 0.08),
    put(80, 0.14),
    put(82, 0.19),
    put(83, 0.21), // ties 82 on |Δ − 0.20|; tighter spread below decides
    put(85, 0.26),
    put(90, 0.4),
    put(95, 0.62), // in the money — never a pick
    put(70, 0.2, { bid: 0.05, ask: 0.07 }), // the exact delta, but illiquid
  ];

  it("picks the liquid out-of-the-money row nearest the target delta", () => {
    const pick = pickByDelta(chain, 0.2, spot, AS_OF);
    expect(pick?.quote.strike).toBe(82);
    expect(pick).toMatchObject({ absDelta: 0.19, deltaSource: "feed", candidates: 6 });
  });

  it("breaks a delta tie on the tighter spread, then the farther out-of-the-money strike", () => {
    const tight = put(83, 0.21, { bid: 2.05, ask: 2.15 });
    expect(pickByDelta([put(82, 0.19), tight], 0.2, spot, AS_OF)?.quote.strike).toBe(83);
    expect(pickByDelta([put(82, 0.19), put(83, 0.21)], 0.2, spot, AS_OF)?.quote.strike).toBe(82);
  });

  it("is a total order: no shuffle of the snapshot's rows changes the pick", () => {
    const picks = new Set<string>();
    for (let seed = 1; seed <= 50; seed += 1) {
      picks.add(pickByDelta(shuffled(chain, seed), 0.2, spot, AS_OF)?.quote.occSymbol ?? "none");
    }
    expect([...picks]).toEqual(["CRWV261106P00082000"]);
  });

  it("respects strike bounds, and finds nothing when nothing qualifies", () => {
    expect(pickByDelta(chain, 0.2, spot, AS_OF, { maxStrike: 80 })?.quote.strike).toBe(80);
    expect(pickByDelta(chain, 0.2, spot, AS_OF, { minStrike: 96 })).toBeUndefined();
    expect(pickByDelta([], 0.2, spot, AS_OF)).toBeUndefined();
  });
});

describe("singleLegTick", () => {
  it("reads the coarsest increment both quotes sit on, capped by the premium", () => {
    expect(singleLegTick(3.2, 3.4)).toBe(0.1);
    expect(singleLegTick(2.2, 2.4)).toBe(0.05); // dimes, but under $3 the cap is a nickel
    expect(singleLegTick(2.15, 2.25)).toBe(0.05);
    expect(singleLegTick(2.13, 2.25)).toBe(0.01);
  });
});

describe("priceInside", () => {
  const band = { low: 2, high: 2.2 };

  it("prices from mid toward natural by the mode's step", () => {
    expect(priceInside(band, "sell", OPEN_TOWARD_NATURAL.conservative, 0.05)).toBe(2.1);
    expect(priceInside(band, "sell", OPEN_TOWARD_NATURAL.aggressive, 0.05)).toBe(2.05);
    expect(priceInside(band, "buy", 1, 0.05)).toBe(2.2);
    expect(priceInside(band, "sell", 1, 0.05)).toBe(2);
  });

  it("a tie between two grid points goes to the better price for the bot", () => {
    expect(priceInside({ low: 2, high: 2.1 }, "sell", 0, 0.1)).toBe(2.1);
    expect(priceInside({ low: 2, high: 2.1 }, "buy", 0, 0.1)).toBe(2);
  });

  it("prices a vertical's signed net band in cents, and finds nothing when no grid point fits", () => {
    expect(priceInside({ low: -2.1, high: -1.7 }, "buy", 0, 0.01)).toBe(-1.9);
    expect(priceInside({ low: 2.01, high: 2.04 }, "buy", 0, 0.05)).toBeUndefined();
  });
});

describe("closeAggression", () => {
  it("walks a due close from mid to natural over the day and the sessions after", () => {
    expect([
      closeAggression(0, "10:30"),
      closeAggression(0, "14:10"),
      closeAggression(0, "15:45"),
    ]).toEqual([0, 1 / 3, 2 / 3]);
    expect([closeAggression(1, "10:30"), closeAggression(1, "14:00")]).toEqual([2 / 3, 1]);
    expect(closeAggression(2, "09:45")).toBe(1);
    expect(closeAggression(-1, "15:59")).toBe(2 / 3); // not yet due reads like the due day
  });
});
