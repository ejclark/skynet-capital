import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  addMonths,
  monthGrid,
  monthOf,
  parseMonth,
  resolveMonth,
} from "../../src/observatory/calendar-widget.js";

/**
 * The research shelf's month-grid navigator — a NAVIGATOR, never a filter: it never hides an
 * event, only jumps to it, and it never lets `?month=` wander outside the range there's anything
 * to show.
 */
function event(overrides: Partial<MarketEvent> = {}): MarketEvent {
  return {
    id: "e1",
    kind: "earnings",
    title: "NVDA earnings",
    date: "2026-09-15",
    status: "confirmed",
    impact: "high",
    symbols: ["NVDA"],
    source: "IR calendar",
    ...overrides,
  } as MarketEvent;
}

describe("monthOf", () => {
  it("takes the YYYY-MM prefix of an ISO date or timestamp", () => {
    expect(monthOf("2026-09-15")).toBe("2026-09");
    expect(monthOf("2026-09-15T14:30:00Z")).toBe("2026-09");
  });
});

describe("parseMonth", () => {
  it("accepts a strict YYYY-MM and rejects anything else", () => {
    expect(parseMonth("2026-09")).toBe("2026-09");
    expect(parseMonth("2026-13")).toBeUndefined();
    expect(parseMonth("september")).toBeUndefined();
    expect(parseMonth(null)).toBeUndefined();
    expect(parseMonth(undefined)).toBeUndefined();
  });
});

describe("addMonths", () => {
  it("adds within a year", () => {
    expect(addMonths("2026-08", 1)).toBe("2026-09");
  });

  it("rolls over a year boundary in either direction", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("resolveMonth", () => {
  const events = [event({ date: "2026-11-01" })];
  const asOf = "2026-09-01T00:00:00Z";

  it("falls back to the as-of month with no valid param", () => {
    expect(resolveMonth(undefined, asOf, events)).toBe("2026-09");
    expect(resolveMonth("nonsense", asOf, events)).toBe("2026-09");
  });

  it("clamps to the as-of month when asked to go earlier", () => {
    expect(resolveMonth("2026-01", asOf, events)).toBe("2026-09");
  });

  it("clamps to the last upcoming event's month when asked to go later", () => {
    expect(resolveMonth("2027-01", asOf, events)).toBe("2026-11");
  });

  it("honors a param inside the navigable range", () => {
    expect(resolveMonth("2026-10", asOf, events)).toBe("2026-10");
  });
});

describe("monthGrid", () => {
  it("marks an event day, disables the previous-month nav at the earliest month", () => {
    const events = [event({ date: "2026-09-15" }), event({ id: "e2", date: "2026-10-01" })];
    const html = monthGrid("2026-09", "2026-09-01T00:00:00Z", events);
    expect(html).toContain('href="#day-2026-09-15"');
    expect(html).toContain('<span class="mg-nav mg-off"'); // previous month: nothing earlier
    expect(html).toContain('href="/research?month=2026-10"'); // next month stays enabled
  });

  it("marks a critical-impact day distinctly from an ordinary event day", () => {
    const html = monthGrid("2026-09", "2026-09-01T00:00:00Z", [
      event({ date: "2026-09-20", impact: "critical" }),
    ]);
    expect(html).toContain("mg-crit");
  });
});
