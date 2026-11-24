import { brokerClock, calendarDays, marketClockView } from "../../../src/domain/market-clock";
import {
  THANKSGIVING_CALENDAR,
  THANKSGIVING_CLOCK,
} from "../../../tests/fixtures/alpaca-market-clock";
import { refetchDelay, setMarketClock } from "../../src/live/market-clock";
import {
  localSessionSuffix,
  marketOpenNow,
  marketSession,
  nextOpenLabel,
  opensIn,
  waitsForOpen,
} from "../../src/live/market-session";

/** The shell's clock on the broker's hours (#8248): Thanksgiving week 2026, Thursday closed and
 *  Friday a 1:00 PM half day, as `GET /api/market/clock` serves it. */

const THANKSGIVING_10AM = new Date("2026-11-26T15:00:00Z");
const HALF_DAY_1230 = new Date("2026-11-27T17:30:00Z");
const days = calendarDays(THANKSGIVING_CALENDAR) ?? [];
const served = (at: Date) =>
  marketClockView(days, at, "broker", brokerClock(THANKSGIVING_CLOCK) ?? undefined);

afterEach(() => setMarketClock(undefined));

describe("the shell clock on the broker's calendar", () => {
  it("Thanksgiving 10:00 ET: closed, next open Fri 9:30 AM ET, with a countdown", () => {
    setMarketClock(served(THANKSGIVING_10AM));
    const view = marketSession(THANKSGIVING_10AM);
    expect(view.state).toBe("closed");
    expect(view.source).toBe("broker");
    expect(view.nextOpen).toBe("Fri 9:30");
    expect(view.nextHalfDayClose).toBe("1:00");
    expect(waitsForOpen(view)).toBe("the Fri 9:30 ET open");
    expect(opensIn(view)).toBe("in 23h 30m");
    expect(nextOpenLabel(THANKSGIVING_10AM)).toBe("Fri Nov 27 · 9:30 ET");
    expect(marketOpenNow(THANKSGIVING_10AM)).toBe(false);
  });

  it("the half day at 12:30 ET: open, 30 minutes left, the track ending at 1:00", () => {
    setMarketClock(served(HALF_DAY_1230));
    const view = marketSession(HALF_DAY_1230);
    expect(view.state).toBe("power");
    expect(view.minutesLeft).toBe(30);
    expect(view.halfDay).toBe(true);
    expect(view.closeLabel).toBe("1:00");
    expect(marketOpenNow(HALF_DAY_1230)).toBe(true);
  });

  it("the broker's day wins over the table's", () => {
    // A session the table lists (Tue Dec 1) that the broker's calendar does not: closed.
    const without = days.filter((d) => d.date !== "2026-12-01");
    const at = new Date("2026-11-30T15:00:00Z");
    setMarketClock(marketClockView(without, at, "broker"));
    expect(marketSession(new Date("2026-12-01T16:00:00Z")).state).toBe("closed");
  });

  it("names the viewer's own time beside ET when their zone differs", () => {
    setMarketClock(served(THANKSGIVING_10AM));
    const view = marketSession(THANKSGIVING_10AM);
    expect(waitsForOpen(view, "America/Los_Angeles")).toBe("the Fri 9:30 ET open (6:30 AM PST)");
    expect(waitsForOpen(view, "America/New_York")).toBe("the Fri 9:30 ET open");
  });

  it("step 3's note says the coming half day in words, never 4:00", () => {
    setMarketClock(served(THANKSGIVING_10AM));
    expect(localSessionSuffix(THANKSGIVING_10AM, "America/New_York")).toBe(
      " (Friday is a half day: it closes 1:00 PM ET)",
    );
    expect(localSessionSuffix(THANKSGIVING_10AM, "America/Los_Angeles")).toBe(
      " (Friday is a half day: it closes 1:00 PM ET (10:00 AM PST))",
    );
  });
});

describe("when the broker's hours are missing", () => {
  it("draws from the table and says so once the fetch failed; says nothing while loading", () => {
    expect(marketSession(THANKSGIVING_10AM).source).toBe("loading");
    setMarketClock("failed");
    const view = marketSession(THANKSGIVING_10AM);
    expect(view.source).toBe("table");
    // The table knows Thanksgiving too — closed, never open by guess.
    expect(view.state).toBe("closed");
    expect(view.nextOpen).toBe("Fri 9:30");
  });

  it("asks again when the broker's phase ends or in 15 minutes, never sooner than 30s", () => {
    const now = THANKSGIVING_10AM.getTime();
    expect(refetchDelay(undefined, now)).toBe(15 * 60_000);
    expect(refetchDelay(served(THANKSGIVING_10AM), now)).toBe(15 * 60_000);
    const soon = {
      ...served(THANKSGIVING_10AM),
      phaseUntil: new Date(now + 5 * 60_000).toISOString(),
    };
    expect(refetchDelay(soon, now)).toBe(5 * 60_000);
    const passed = { ...soon, phaseUntil: new Date(now - 1).toISOString() };
    expect(refetchDelay(passed, now)).toBe(30_000);
  });
});

describe("the broker's word on today is final (code review)", () => {
  /** A session the table lists that the broker says is shut: Tue Dec 1, 2026, at 11:00 ET. */
  const DEC1_11AM = new Date("2026-12-01T16:00:00Z");

  it("a holiday only the broker knows reads closed, never the table's open", () => {
    const without = days.filter((d) => d.date !== "2026-12-01");
    setMarketClock(marketClockView(without, DEC1_11AM, "broker"));
    const view = marketSession(DEC1_11AM);
    expect(view.state).toBe("closed");
    expect(view.nextOpen).toBe("Wed 9:30");
    expect(marketOpenNow(DEC1_11AM)).toBe(false);
  });

  it("a half day only the broker knows stays closed after its 1:00 close, on every refetch", () => {
    const early = days.map((d) =>
      d.date === "2026-12-01" ? { ...d, closeAt: Date.parse("2026-12-01T18:00:00Z") } : d,
    );
    const at = new Date("2026-12-01T18:05:00Z"); // 1:05 PM ET
    setMarketClock(marketClockView(early, at, "broker"));
    const view = marketSession(at);
    expect(view.state).toBe("closed");
    expect(view.elapsed).toBe(1);
    expect(view.closeLabel).toBe("1:00");
  });
});

describe("step 3's note across a clock change (code review)", () => {
  it("names the zone at the coming session: PST on the Monday after DST ends", () => {
    // Saturday 2026-10-31, still PDT; the next session, Mon Nov 2, is in PST.
    expect(localSessionSuffix(new Date("2026-10-31T16:00:00Z"), "America/Los_Angeles")).toBe(
      " (6:30 AM–1:00 PM PST)",
    );
  });
});
