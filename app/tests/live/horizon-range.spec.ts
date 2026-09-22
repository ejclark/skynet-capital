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
  it("puts every dated event inside the all lens's range", () => {
    const all = rangeFor("2026-09-09", "all");
    expect(inRange("2019-01-02", all)).toBe(true);
    expect(inRange("2031-12-31", all)).toBe(true);
    expect(rangeLabel(all, "all")).toBe("all research");
  });
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
  it("snaps the quarter to a fiscal year-end when one is given (#1736)", () => {
    // NVDA's fiscal year ends in January (month 1): Aug 2026 is Q3 FY27, Aug–Oct 2026 — the
    // issue's own worked case, not the calendar's Jul–Sep.
    expect(rangeFor("2026-08-15", "quarter", 1)).toEqual({
      start: "2026-08-01",
      end: "2026-10-31",
    });
    // A fiscal quarter that spans a calendar-year boundary still resolves cleanly.
    expect(rangeFor("2026-12-01", "quarter", 1)).toEqual({
      start: "2026-11-01",
      end: "2027-01-31",
    });
  });
});

describe("stepAnchor — the arrows advance by the lens's duration", () => {
  it("pages the grid's month under the all lens, which has no span of its own", () => {
    expect(stepAnchor("2026-09-09", "all", 1)).toBe("2026-10-01");
    expect(stepAnchor("2026-09-09", "all", -1)).toBe("2026-08-01");
  });
  it("steps a day, a week, a month, a quarter", () => {
    expect(stepAnchor("2026-09-09", "day", 1)).toBe("2026-09-10");
    expect(stepAnchor("2026-09-09", "week", -1)).toBe("2026-09-02");
    expect(stepAnchor("2026-09-30", "month", 1)).toBe("2026-10-01");
    expect(stepAnchor("2026-09-09", "quarter", 1)).toBe("2026-10-01");
    expect(stepAnchor("2026-01-15", "quarter", -1)).toBe("2025-10-01");
  });
  it("steps a fiscal quarter by 3 months too, aligned to the fiscal calendar", () => {
    // From Q3 FY27 (Aug–Oct 2026), forward is Q4 FY27 (starts Nov 2026).
    expect(stepAnchor("2026-08-15", "quarter", 1, 1)).toBe("2026-11-01");
    // ...and back is Q2 FY27 (starts May 2026).
    expect(stepAnchor("2026-08-15", "quarter", -1, 1)).toBe("2026-05-01");
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
    // The quarter is a CALENDAR quarter and the label says so twice over — the months, and the
    // trailing "calendar" tag — so it cannot be misread as a company's fiscal quarter (#1736).
    expect(rangeLabel(rangeFor("2026-09-09", "quarter"), "quarter")).toBe(
      "Q3 2026 · Jul–Sep · calendar",
    );
    expect(rangeLabel(rangeFor("2027-01-15", "quarter"), "quarter")).toBe(
      "Q1 2027 · Jan–Mar · calendar",
    );
  });
  it("names a company's own fiscal quarter when given one (#1736)", () => {
    const fiscalRange = rangeFor("2026-08-15", "quarter", 1);
    expect(
      rangeLabel(fiscalRange, "quarter", { symbol: "NVDA", fiscalYear: 2027, quarter: 3 }),
    ).toBe("Q3 FY27 · NVDA · Aug–Oct 2026");
  });
});
