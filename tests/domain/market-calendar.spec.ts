import {
  isMarketClosed,
  MARKET_CLOSURES,
  marketClosures,
} from "../../src/domain/market-calendar.js";

// The exchange's published closures, as the research rail reads them (#1704 slice 2).
describe("market calendar", () => {
  it("knows Labor Day 2026 closes the market — the day the bots' next-weekday guess once missed", () => {
    expect(isMarketClosed("2026-09-07")).toBe(true);
    expect(isMarketClosed("2026-09-08")).toBe(false);
  });

  it("treats weekends as closed without a table entry", () => {
    expect(isMarketClosed("2026-09-05")).toBe(true);
    expect(isMarketClosed("2026-09-06")).toBe(true);
  });

  it("keeps an early close open — a short session is still a session", () => {
    expect(isMarketClosed("2026-11-27")).toBe(false);
    expect(marketClosures("2026-11-27", "2026-11-27")[0]?.early).toBe(true);
  });

  it("carries the observed-date rule: Christmas 2027 closes Friday the 24th, with no Eve early close", () => {
    const dec27 = marketClosures("2027-12-01", "2027-12-31");
    expect(dec27).toEqual([
      { date: "2027-12-24", reason: "Christmas Day (observed)", early: false },
    ]);
  });

  it("filters an inclusive window in date order, and the table itself is sorted", () => {
    expect(marketClosures("2026-09-01", "2026-09-30").map((c) => c.date)).toEqual(["2026-09-07"]);
    const dates = MARKET_CLOSURES.map((c) => c.date);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });
});
