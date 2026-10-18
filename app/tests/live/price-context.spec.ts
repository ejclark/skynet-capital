import type { Bar } from "../../src/live/bars";
import type { ChainRow } from "../../src/live/options";
import {
  busiest,
  contextLine,
  contractsText,
  priceRange,
  rangeWords,
  strikeBars,
} from "../../src/live/price-context";

/**
 * PRICE CONTEXT ON THE POSITION'S AXIS (#5070 slice 2b; round 2 of #5037, R2). The price strip
 * gains the 20-day range with its average close, and an option's open contracts by strike, read
 * by one fact line naming what sits between today's price and the side the position loses on.
 * The numbers are round 2's frame: CRWV at $82.60, a 20-day range $78.90–$96.30, open contracts
 * 75: 1.9k · 80: 3.2k · 85: 1.4k · 90: 2.6k · 95: 1.1k.
 */

const bar = (l: number, h: number, c: number, t = "2026-10-01"): Bar => ({
  t,
  o: c,
  h,
  l,
  c,
  v: 1,
});

const row = (strike: number, openInterest?: number): ChainRow => ({
  strike,
  occSymbol: `CRWV261106P${String(strike * 1000).padStart(8, "0")}`,
  ...(openInterest === undefined ? {} : { openInterest }),
});

const CHAIN = [
  row(70, 800),
  row(75, 1900),
  row(80, 3200),
  row(85, 1400),
  row(90, 2600),
  row(95, 1100),
];

describe("the 20-day range", () => {
  it("is the lowest low and highest high of the last 20 daily bars, with their average close", () => {
    const old = Array.from({ length: 10 }, () => bar(50, 200, 100));
    const recent = Array.from({ length: 20 }, (_, i) =>
      bar(80 + i * 0.1, 90 + i * 0.3, 85 + i * 0.1),
    );
    const range = priceRange([...old, ...recent]);
    expect(range?.days).toBe(20);
    expect(range?.low).toBe(80);
    expect(range?.high).toBeCloseTo(95.7);
    expect(range?.average).toBeCloseTo(85.95);
  });

  it("counts the days it has for a stock with a shorter history, and says so", () => {
    const range = priceRange([bar(78.9, 90, 85), bar(80, 96.3, 90.2)]);
    expect(range).toMatchObject({ low: 78.9, high: 96.3, days: 2 });
    expect(range && rangeWords(range)).toBe("2-day range $78.90–$96.30 · average $87.60");
  });

  it("is absent without a bar to read — never a made-up range", () => {
    expect(priceRange([])).toBeUndefined();
  });
});

describe("open contracts by strike", () => {
  const axis = { lo: 72, hi: 98 };

  it("draws each strike on the axis where the strip puts it, marking the one held", () => {
    const bars = strikeBars(CHAIN, axis, 80);
    expect(bars.map((b) => b.strike)).toEqual([75, 80, 85, 90, 95]);
    const held = bars.find((b) => b.held);
    expect(held?.strike).toBe(80);
    expect(held?.at).toBeCloseTo(((80 - 72) / 26) * 100);
  });

  it("leaves out a strike the feed reported no open interest for, never drawing it as zero", () => {
    const bars = strikeBars([row(80), row(85, 0), row(90, 2600)], axis, 80);
    expect(bars.map((b) => b.strike)).toEqual([90]);
  });

  it("names the busiest strike, its count at a glance", () => {
    const top = busiest(strikeBars(CHAIN, axis, 80));
    expect(top?.strike).toBe(80);
    expect(contractsText(3200)).toBe("3.2k");
    expect(contractsText(940)).toBe("940");
  });
});

describe("the fact line under the strip", () => {
  const range = { low: 78.9, high: 96.3, average: 87.6, days: 20 };
  const bars = strikeBars(CHAIN, { lo: 72, hi: 98 }, 80);

  it("names the 20-day low and the busiest strike under today's price on a sold put", () => {
    expect(contextLine(82.6, true, range, bars)).toBe(
      "Under today's $82.60: the 20-day low ($78.90) and the busiest strike ($80, 3.2k open).",
    );
  });

  it("looks over today's price for a position that loses as the stock rises", () => {
    expect(contextLine(82.6, false, range, bars)).toBe(
      "Over today's $82.60: the 20-day high ($96.30) and the busiest strike ($90, 2.6k open).",
    );
  });

  it("names the range alone on shares, which have no strikes", () => {
    expect(contextLine(82.6, true, range, [])).toBe(
      "Under today's $82.60: the 20-day low ($78.90).",
    );
  });

  it("says nothing without today's price, or when nothing lies on that side", () => {
    expect(contextLine(undefined, true, range, bars)).toBeUndefined();
    expect(contextLine(70, true, range, [])).toBeUndefined();
  });
});
