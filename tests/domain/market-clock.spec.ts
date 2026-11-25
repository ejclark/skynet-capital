import {
  brokerClock,
  calendarDays,
  calendarDrift,
  marketClockView,
  marketHoursLine,
  tableClockView,
  tableDays,
} from "../../src/domain/market-clock.js";
import { THANKSGIVING_CALENDAR, THANKSGIVING_CLOCK } from "../fixtures/alpaca-market-clock.js";

/** Market hours from the broker's calendar, with the table as the same-shaped fallback (#8248). */

const days = calendarDays(THANKSGIVING_CALENDAR) ?? [];
const at = (iso: string) => new Date(iso);

describe("calendarDays — Alpaca's /v2/calendar", () => {
  it("reads each row's ET open and close as instants", () => {
    expect(days[0]).toEqual({
      date: "2026-11-23",
      openAt: Date.parse("2026-11-23T14:30:00Z"),
      closeAt: Date.parse("2026-11-23T21:00:00Z"),
    });
  });

  it("refuses the whole body when one row is not the shape — never a half calendar", () => {
    expect(calendarDays([...THANKSGIVING_CALENDAR, { date: "2026-12-08", open: "9:30" }])).toBe(
      undefined,
    );
    expect(calendarDays({ message: "forbidden" })).toBeUndefined();
    expect(calendarDays([{ date: "2026-12-08", open: "16:00", close: "09:30" }])).toBeUndefined();
  });
});

describe("brokerClock — Alpaca's /v3/clock", () => {
  it("reads NYSE's entry", () => {
    expect(brokerClock(THANKSGIVING_CLOCK)).toEqual({
      phase: "closed",
      phaseUntil: Date.parse("2026-11-27T09:00:00Z"),
      nextOpenAt: Date.parse("2026-11-27T14:30:00Z"),
      nextCloseAt: Date.parse("2026-11-27T18:00:00Z"),
    });
  });

  it("refuses a body with no NYSE entry or an unknown phase", () => {
    expect(brokerClock({ clocks: [] })).toBeUndefined();
    const odd = { clocks: [{ ...THANKSGIVING_CLOCK.clocks[0], phase: "overnight" }] };
    expect(brokerClock(odd)).toBeUndefined();
  });
});

describe("marketClockView — Thanksgiving week 2026", () => {
  it("on the holiday: closed, next open Friday 9:30 AM ET, Friday a half day locking at 1:00 PM", () => {
    const view = marketClockView(days, at("2026-11-26T15:00:00Z"), "broker");
    expect(view.isOpen).toBe(false);
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
    expect(view.nextCloseAt).toBe("2026-11-27T18:00:00.000Z");
    const friday = view.days.find((d) => d.date === "2026-11-27");
    expect(friday).toEqual({
      date: "2026-11-27",
      openAt: "2026-11-27T14:30:00.000Z",
      closeAt: "2026-11-27T18:00:00.000Z",
      halfDay: true,
      picksLockAt: "2026-11-27T18:00:00.000Z",
    });
    expect(view.days.some((d) => d.date === "2026-11-26")).toBe(false);
  });

  it("on the half day at 12:30 ET: open, closing 1:00 PM", () => {
    const view = marketClockView(days, at("2026-11-27T17:30:00Z"), "broker");
    expect(view.isOpen).toBe(true);
    expect(view.nextCloseAt).toBe("2026-11-27T18:00:00.000Z");
  });

  it("on a weekend: closed, next open Monday", () => {
    const view = marketClockView(days, at("2026-11-28T16:00:00Z"), "broker");
    expect(view.isOpen).toBe(false);
    expect(view.nextOpenAt).toBe("2026-11-30T14:30:00.000Z");
  });

  it("a full day from 2026-12-04 adds the designated lock, 4:15 PM ET; before it, none", () => {
    const view = marketClockView(days, at("2026-11-28T16:00:00Z"), "broker");
    const dec4 = view.days.find((d) => d.date === "2026-12-04");
    expect(dec4?.halfDay).toBe(false);
    expect(dec4?.picksLockAt).toBe("2026-12-04T21:00:00.000Z");
    expect(dec4?.designatedPicksLockAt).toBe("2026-12-04T21:15:00.000Z");
    expect(view.days.find((d) => d.date === "2026-12-03")?.designatedPicksLockAt).toBeUndefined();
  });

  it("lays the broker's /v3/clock over the days: its phase and next open win", () => {
    const clock = brokerClock(THANKSGIVING_CLOCK);
    const view = marketClockView(days, at("2026-11-26T15:00:00Z"), "broker", clock);
    expect(view.phase).toBe("closed");
    expect(view.phaseUntil).toBe("2026-11-27T09:00:00.000Z");
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
  });

  it("a moment no listed day covers reads CLOSED, never open", () => {
    expect(marketClockView([], at("2026-11-24T16:00:00Z"), "table").isOpen).toBe(false);
  });
});

describe("the table fallback", () => {
  it("builds the same days the broker lists for Thanksgiving week", () => {
    expect(tableDays("2026-11-23", "2026-12-07")).toEqual(days);
    expect(calendarDrift(days, "2026-11-23", "2026-12-07")).toEqual([]);
  });

  it("names a date the broker and the table disagree on", () => {
    const moved = days.filter((d) => d.date !== "2026-11-25");
    expect(calendarDrift(moved, "2026-11-23", "2026-12-07")).toEqual(["2026-11-25"]);
  });

  it("marks its answer as the table's", () => {
    const view = tableClockView(at("2026-11-26T15:00:00Z"));
    expect(view.source).toBe("table");
    expect(view.phase).toBeUndefined();
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
  });
});

describe("marketHoursLine — the member context's Market line", () => {
  it("closed on Thanksgiving: names Friday's open and its 1:00 PM half-day close", () => {
    const view = marketClockView(
      days,
      at("2026-11-26T15:00:00Z"),
      "broker",
      brokerClock(THANKSGIVING_CLOCK),
    );
    expect(marketHoursLine(view)).toBe(
      "Market: the regular session is CLOSED right now; the next session opens Fri, Nov 27, 9:30 AM ET and closes 1:00 PM ET (a half day); an order placed now is queued and fills at the open.",
    );
  });

  it("open on the half day: the real close, never 4:00", () => {
    const view = marketClockView(days, at("2026-11-27T17:30:00Z"), "broker");
    expect(marketHoursLine(view)).toBe(
      "Market: the regular session is OPEN right now and closes 1:00 PM ET (a half day) today.",
    );
  });

  it("a table answer says where its hours came from", () => {
    expect(marketHoursLine(tableClockView(at("2026-11-26T15:00:00Z")))).toContain(
      "the broker's calendar did not answer",
    );
  });
});

describe("today's row after the close (#8248 review)", () => {
  it("stays listed, so 'closed for the day' and 'no session today' read apart", () => {
    const view = marketClockView(days, at("2026-11-25T22:00:00Z"), "broker"); // Wed 5:00 PM ET
    expect(view.days[0]?.date).toBe("2026-11-25");
    expect(view.isOpen).toBe(false);
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
    expect(view.nextCloseAt).toBe("2026-11-27T18:00:00.000Z");
  });
});
