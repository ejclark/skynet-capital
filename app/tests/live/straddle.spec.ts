import type { ChainRow } from "../../src/live/options";
import {
  daysToExpiry,
  dividerIndex,
  expiresIn,
  inTheMoney,
  mergeStraddle,
  windowRows,
} from "../../src/live/straddle";

// The straddle view's arithmetic (#1481 slice 1): strike down the centre, calls left, puts right.
const row = (strike: number, bid: number, ask: number): ChainRow => ({
  strike,
  occSymbol: `X${strike}`,
  bid,
  ask,
});

describe("mergeStraddle", () => {
  it("unions both sides by strike, ascending, keeping a one-sided strike's other cell empty", () => {
    const merged = mergeStraddle(
      [row(230, 2.4, 2.6), row(225, 5, 5.2)],
      [row(230, 2.5, 2.7), row(235, 5.5, 5.8)],
    );
    expect(merged.map((r) => r.strike)).toEqual([225, 230, 235]);
    expect(merged[0]?.put).toBeUndefined();
    expect(merged[1]?.call?.bid).toBe(2.4);
    expect(merged[1]?.put?.ask).toBe(2.7);
    expect(merged[2]?.call).toBeUndefined();
  });
});

describe("dividerIndex", () => {
  const rows = mergeStraddle([row(225, 1, 1), row(230, 1, 1), row(235, 1, 1)], []);
  it("sits after the last strike at or below spot", () => {
    expect(dividerIndex(rows, 230.36)).toBe(2);
    expect(dividerIndex(rows, 230)).toBe(2);
    expect(dividerIndex(rows, 224)).toBe(0);
  });
  it("is absent without a spot — no guessed line", () => {
    expect(dividerIndex(rows, undefined)).toBeUndefined();
  });
});

describe("windowRows", () => {
  const rows = mergeStraddle(
    Array.from({ length: 30 }, (_, i) => row(200 + i * 2.5, 1, 1)),
    [],
  );
  it("keeps ±radius strikes around the divider and counts what it hid", () => {
    const { rows: kept, hidden } = windowRows(rows, 236, 4);
    expect(kept).toHaveLength(8);
    expect(kept.map((r) => r.strike)).toEqual([227.5, 230, 232.5, 235, 237.5, 240, 242.5, 245]);
    expect(hidden).toBe(22);
  });
  it("returns a chain that already fits, whole", () => {
    const small = rows.slice(0, 5);
    expect(windowRows(small, 205, 8)).toEqual({ rows: small, hidden: 0 });
  });
  it("hides nothing without a spot to centre on", () => {
    expect(windowRows(rows, undefined, 4).hidden).toBe(0);
  });
  it("clamps at the edges instead of running off the chain", () => {
    expect(windowRows(rows, 201, 4).rows[0]?.strike).toBe(200);
    const high = windowRows(rows, 999, 4).rows;
    expect(high[high.length - 1]?.strike).toBe(272.5);
  });
});

describe("daysToExpiry / expiresIn", () => {
  const now = new Date("2026-09-05T14:00:00Z");
  it("counts calendar days and never goes negative", () => {
    expect(daysToExpiry("2026-09-09", now)).toBe(4);
    expect(daysToExpiry("2026-09-05", now)).toBe(0);
    expect(daysToExpiry("2026-09-01", now)).toBe(0);
    expect(daysToExpiry("not-a-date", now)).toBe(0);
  });
  it("says it in words", () => {
    expect(expiresIn(0)).toBe("Expires today");
    expect(expiresIn(1)).toBe("Expires in 1 day");
    expect(expiresIn(4)).toBe("Expires in 4 days");
  });
});

describe("inTheMoney", () => {
  it("is a call below spot and a put above it, and neither without a spot", () => {
    expect(inTheMoney(225, 230.36, "call")).toBe(true);
    expect(inTheMoney(235, 230.36, "call")).toBe(false);
    expect(inTheMoney(235, 230.36, "put")).toBe(true);
    expect(inTheMoney(225, 230.36, "put")).toBe(false);
    expect(inTheMoney(225, undefined, "call")).toBe(false);
  });
});
