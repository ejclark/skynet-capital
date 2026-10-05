import {
  daysBetween,
  isMarketClosed,
  isSession,
  MARKET_CLOSURES,
  marketClosures,
  nextSession,
  sessionsBefore,
  sessionsBetween,
} from "../../src/domain/market-calendar.js";
import * as guidanceRules from "../../src/options/position-guidance-rules.js";

// Session arithmetic the bots' option rules count with (expiry hygiene at T-2, the session after a
// print) — moved here from the guidance rules, which re-export the same two functions.
describe("market calendar — sessions", () => {
  it("an early close is a session; a weekend and a full holiday are not", () => {
    expect(isSession("2026-11-27")).toBe(true);
    expect(isSession("2026-11-26")).toBe(false);
    expect(isSession("2026-11-28")).toBe(false);
  });

  it("nextSession is strictly after, skipping weekends and holidays", () => {
    expect(nextSession("2026-11-16")).toBe("2026-11-17"); // Mon → Tue: CRWV's session after
    expect(nextSession("2026-11-13")).toBe("2026-11-16"); // Fri → Mon
    expect(nextSession("2026-11-25")).toBe("2026-11-27"); // over Thanksgiving, onto the early close
    expect(nextSession("2026-11-14")).toBe("2026-11-16"); // from a Saturday
  });

  it("sessionsBetween counts sessions in (from, to], signed when to is earlier", () => {
    expect(sessionsBetween("2026-11-11", "2026-11-11")).toBe(0);
    expect(sessionsBetween("2026-11-13", "2026-11-16")).toBe(1); // Fri → Mon
    expect(sessionsBetween("2026-11-24", "2026-11-30")).toBe(3); // Wed, Fri (early), Mon
    expect(sessionsBetween("2026-11-16", "2026-11-13")).toBe(-1);
  });

  it("sessionsBefore and daysBetween keep their answers, and the guidance reads the same functions", () => {
    expect(sessionsBefore("2026-11-18", 5)).toBe("2026-11-11"); // Veterans Day trades
    expect(sessionsBefore("2026-11-13", 2)).toBe("2026-11-11");
    expect(daysBetween("2026-10-07", "2026-11-06")).toBe(30);
    expect(guidanceRules.sessionsBefore).toBe(sessionsBefore);
    expect(guidanceRules.daysBetween).toBe(daysBetween);
  });
});

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
