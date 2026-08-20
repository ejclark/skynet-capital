import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  addMonths,
  monthGrid,
  monthOf,
  parseMonth,
  resolveMonth,
} from "../../src/observatory/calendar-widget.js";

const AS_OF = "2026-08-16T12:00:00Z";

const event = (overrides: Partial<MarketEvent> & { id: string; date: string }): MarketEvent => ({
  kind: "macro-print",
  title: `Event ${overrides.id}`,
  status: "confirmed",
  source: "FED: federalreserve.gov FOMC calendar",
  impact: "high",
  symbols: [],
  ...overrides,
});

describe("parseMonth", () => {
  it("accepts strict YYYY-MM and rejects everything else", () => {
    expect(parseMonth("2026-09")).toBe("2026-09");
    expect(parseMonth("2026-13")).toBeUndefined();
    expect(parseMonth("2026-9")).toBeUndefined();
    expect(parseMonth("garbage")).toBeUndefined();
    expect(parseMonth("")).toBeUndefined();
    expect(parseMonth(null)).toBeUndefined();
    expect(parseMonth(undefined)).toBeUndefined();
  });
});

describe("addMonths", () => {
  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-08", 4)).toBe("2026-12");
  });
});

describe("resolveMonth", () => {
  const events = [event({ id: "far", date: "2026-12-15" })];

  it("falls back to the as-of month on missing or invalid input", () => {
    expect(resolveMonth(undefined, AS_OF, events)).toBe(monthOf(AS_OF));
    expect(resolveMonth("nope", AS_OF, events)).toBe("2026-08");
  });

  it("clamps below the as-of month and above the last event's month", () => {
    expect(resolveMonth("2026-01", AS_OF, events)).toBe("2026-08");
    expect(resolveMonth("2027-06", AS_OF, events)).toBe("2026-12");
    expect(resolveMonth("2026-10", AS_OF, events)).toBe("2026-10");
  });

  it("clamps to the as-of month when there are no events at all", () => {
    expect(resolveMonth("2027-01", AS_OF, [])).toBe("2026-08");
  });
});

describe("monthGrid", () => {
  it("aligns the grid to a Monday week start — Aug 1 2026 is a Saturday, so 5 leading blanks", () => {
    const html = monthGrid("2026-08", AS_OF, []);
    const beforeDayOne = html.slice(0, html.indexOf(">1<"));
    expect(beforeDayOne.split("mg-blank").length - 1).toBe(5);
  });

  it("renders the right number of days — leap and non-leap Februaries", () => {
    const events = [event({ id: "far", date: "2028-03-01" })];
    expect(monthGrid("2028-02", AS_OF, events)).toContain(">29<");
    expect(monthGrid("2028-02", AS_OF, events)).not.toContain(">30<");
    expect(monthGrid("2027-02", AS_OF, events)).not.toContain(">29<");
    expect(monthGrid("2026-09", AS_OF, events)).not.toContain(">31<");
  });

  it("turns event days into jump links and leaves event-free days inert", () => {
    const html = monthGrid("2026-09", AS_OF, [event({ id: "fomc", date: "2026-09-16" })]);
    expect(html).toContain('href="#day-2026-09-16"');
    expect(html).toContain("mg-evt");
    expect(html).not.toContain('href="#day-2026-09-17"');
  });

  it("marks a stacked day with its event count", () => {
    const html = monthGrid("2026-10", AS_OF, [
      event({ id: "a", date: "2026-10-28" }),
      event({ id: "b", date: "2026-10-28" }),
    ]);
    expect(html).toContain('<i class="mg-count">2</i>');
  });

  it("escalates the marker only when a day carries a critical event", () => {
    const critical = monthGrid("2026-08", AS_OF, [
      event({ id: "nvda", date: "2026-08-26", impact: "critical" }),
    ]);
    const medium = monthGrid("2026-08", AS_OF, [
      event({ id: "pjm", date: "2026-08-26", impact: "medium" }),
    ]);
    expect(critical).toContain("mg-crit");
    expect(medium).not.toContain("mg-crit");
  });

  it("rings today only when rendering the as-of month", () => {
    expect(monthGrid("2026-08", AS_OF, [])).toContain("mg-today");
    expect(monthGrid("2026-09", AS_OF, [event({ id: "x", date: "2026-09-16" })])).not.toContain(
      "mg-today",
    );
  });

  it("mutes days already behind the as-of date in the current month", () => {
    const html = monthGrid("2026-08", AS_OF, []);
    expect(html).toContain("mg-past");
    // The 15th is past; the 17th is not.
    expect(html).toMatch(/mg-past[^>]*>15</);
    expect(html).not.toMatch(/mg-past[^>]*>17</);
  });

  it("disables nav at the clamp edges and links it in between", () => {
    const events = [event({ id: "far", date: "2026-10-14" })];
    const first = monthGrid("2026-08", AS_OF, events);
    expect(first).toContain("mg-off");
    expect(first).toContain('href="/calendar?month=2026-09"');
    const last = monthGrid("2026-10", AS_OF, events);
    expect(last).toContain('href="/calendar?month=2026-09"');
    expect(last).toContain("mg-off");
  });

  it("never emits the agenda's marker strings — the cal-est counting spec must stay honest", () => {
    const html = monthGrid("2026-09", AS_OF, [
      event({ id: "est", date: "2026-09-16", status: "estimate" }),
    ]);
    expect(html).not.toContain('class="cal-est"');
  });
});
