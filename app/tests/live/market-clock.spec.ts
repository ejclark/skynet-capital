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
