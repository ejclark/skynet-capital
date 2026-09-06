import {
  addDays,
  daysOf,
  inRange,
  rangeFor,
  rangeLabel,
  sessionsIn,
  stepAnchor,
} from "../../src/live/horizon-range";

// The range a lens selects around an anchor day (#1704 slice 2) — pure date arithmetic.
describe("rangeFor", () => {
  it("selects the anchor day alone under the day lens", () => {
    expect(rangeFor("2026-09-09", "day")).toEqual({ start: "2026-09-09", end: "2026-09-09" });
  });
  it("selects Monday–Sunday of the anchor's week, Monday-first like the grid", () => {
    expect(rangeFor("2026-09-09", "week")).toEqual({ start: "2026-09-07", end: "2026-09-13" });
    expect(rangeFor("2026-09-13", "week")).toEqual({ start: "2026-09-07", end: "2026-09-13" });
  });
  it("selects the calendar month and quarter", () => {
    expect(rangeFor("2026-09-09", "month")).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(rangeFor("2026-09-09", "quarter")).toEqual({ start: "2026-07-01", end: "2026-09-30" });
    expect(rangeFor("2026-12-31", "quarter")).toEqual({ start: "2026-10-01", end: "2026-12-31" });
  });
});

describe("stepAnchor — the arrows advance by the lens's duration", () => {
  it("steps a day, a week, a month, a quarter", () => {
    expect(stepAnchor("2026-09-09", "day", 1)).toBe("2026-09-10");
    expect(stepAnchor("2026-09-09", "week", -1)).toBe("2026-09-02");
    expect(stepAnchor("2026-09-30", "month", 1)).toBe("2026-10-01");
    expect(stepAnchor("2026-09-09", "quarter", 1)).toBe("2026-10-01");
    expect(stepAnchor("2026-01-15", "quarter", -1)).toBe("2025-10-01");
  });
  it("crosses a year boundary without drifting", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(stepAnchor("2026-12-15", "month", 1)).toBe("2027-01-01");
  });
});

describe("sessionsIn — weekdays minus full-day closures", () => {
  const laborDay = { date: "2026-09-07", reason: "Labor Day", early: false };
  const week = rangeFor("2026-09-09", "week");
  it("counts four sessions in Labor Day week", () => {
    expect(sessionsIn(week, [laborDay])).toBe(4);
    expect(sessionsIn(week, [])).toBe(5);
  });
  it("keeps an early close as a session — the theta clock still runs", () => {
    const early = { date: "2026-11-27", reason: "Day after Thanksgiving", early: true };
    const thanksgiving = { date: "2026-11-26", reason: "Thanksgiving Day", early: false };
    expect(sessionsIn(rangeFor("2026-11-25", "week"), [thanksgiving, early])).toBe(4);
  });
  it("enumerates and tests membership on the same inclusive bounds", () => {
    expect(daysOf(week)).toHaveLength(7);
    expect(inRange("2026-09-13", week)).toBe(true);
    expect(inRange("2026-09-14", week)).toBe(false);
  });
});

describe("rangeLabel", () => {
  it("names the span the way the rail head reads it", () => {
    expect(rangeLabel(rangeFor("2026-09-09", "day"), "day")).toBe("Sep 9, 2026");
    expect(rangeLabel(rangeFor("2026-09-09", "week"), "week")).toBe("Sep 7 – Sep 13");
    expect(rangeLabel(rangeFor("2026-09-09", "month"), "month")).toBe("September 2026");
    expect(rangeLabel(rangeFor("2026-09-09", "quarter"), "quarter")).toBe("Q3 2026");
  });
});
