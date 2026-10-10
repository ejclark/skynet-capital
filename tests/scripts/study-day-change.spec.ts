import { describe, expect, it } from "@rstest/core";
import { buildBook, yesterdayEquity } from "../../scripts/study/worlds/book.mjs";
import {
  dayChangeGaps,
  dayChangeRows,
  describeGap,
} from "../../scripts/study/worlds/day-change.mjs";

// A study world's header and its rows tell one story (#5052): the header's "today" is equity −
// yesterday's close, each row's is its value − its quantity at yesterday's close, and the first
// full round's world had typed yesterday's close by hand — Eric's header −$71 beside rows of −$4.

const book = (lastEquity: number, closedToday?: number) => ({
  participants: [
    {
      id: "p",
      equity: 1_000 + 10 * 105 - 100 * 2,
      positions: [
        // 10 shares, 100 → 105 today; one short contract, 1.50 → 2.00 (× 100).
        { quantity: 10, marketValue: 1_050, lastdayPrice: 100 },
        { quantity: -1, marketValue: -200, lastdayPrice: 150 },
      ],
    },
  ],
  lastEquity: { p: lastEquity },
  ...(closedToday ? { closedToday: { p: closedToday } } : {}),
});

describe("dayChangeGaps — the header's day change is its rows'", () => {
  it("passes a header that equals the sum of its rows", () => {
    // Yesterday: 1,000 + 10 × 100 − 1 × 150 = 1,850; rows: +50 − 50 = 0.
    expect(dayChangeRows(book(1_850))[0]).toMatchObject({ header: 0, rows: 0, gap: 0 });
    expect(dayChangeGaps(book(1_850))).toEqual([]);
  });
  it("names a header a dollar or more off its rows", () => {
    const gaps = dayChangeGaps(book(1_917));
    expect(gaps).toMatchObject([{ id: "p", gap: -67 }]);
    expect(gaps.map(describeGap)[0]).toBe("p: header -67.00 vs rows 0.00 — off by -67.00");
  });
  it("lets the input declare what was booked today on positions already closed", () => {
    expect(dayChangeGaps(book(1_783, 67))).toEqual([]);
  });
});

describe("yesterdayEquity — derived, never typed", () => {
  const snapshot = { positions: [{ quantity: 10, lastdayPrice: 100 }] };
  it("is cash plus each position at yesterday's close, less a declared closed-today amount", () => {
    expect(yesterdayEquity({ id: "p", cash: 500 }, snapshot)).toBe(1_500);
    expect(yesterdayEquity({ id: "p", cash: 500, closedToday: 40 }, snapshot)).toBe(1_460);
  });
  it("refuses a typed figure", () => {
    expect(() => yesterdayEquity({ id: "p", cash: 500, lastEquity: 1_499 }, snapshot)).toThrow(
      /types lastEquity/,
    );
  });
});

describe("every study world", () => {
  for (const world of ["profile-today", "profile-bad-day", "no-account"]) {
    it(`${world}: each participant's header day change is the sum of its rows`, () => {
      const rows = dayChangeRows(buildBook(world));
      expect(rows.length).toBeGreaterThan(0);
      expect(dayChangeGaps(buildBook(world)).map(describeGap)).toEqual([]);
    });
    it(`${world}: the chart's last close before today is the header's yesterday`, () => {
      const b = buildBook(world);
      const today = Date.parse("2026-10-08T00:00:00-04:00");
      for (const p of b.participants) {
        const close = (b.history[p.id] ?? []).filter((h) => Date.parse(h.at) < today).at(-1);
        expect({ id: p.id, equity: close?.equity }).toEqual({
          id: p.id,
          equity: b.lastEquity[p.id],
        });
      }
    });
  }
});
