import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import { marketClockReader } from "../../src/server/market-clock.js";
import { THANKSGIVING_CALENDAR, THANKSGIVING_CLOCK } from "../fixtures/alpaca-market-clock.js";

/** The shared market-hours reader (#8248): cached, one request in flight, never a guessed hour. */

function fakeClient(over: { calendar?: () => unknown; clock?: () => unknown } = {}) {
  const reads = { calendar: 0, clock: 0 };
  const client = {
    getCalendar: () => {
      reads.calendar++;
      return Promise.resolve().then(over.calendar ?? (() => THANKSGIVING_CALENDAR));
    },
    getMarketClock: () => {
      reads.clock++;
      return Promise.resolve().then(over.clock ?? (() => THANKSGIVING_CLOCK));
    },
  } as unknown as AlpacaTradingClient;
  return { client, reads };
}

/** Thanksgiving morning, 10:00 ET. */
const THANKSGIVING = Date.parse("2026-11-26T15:00:00Z");

describe("marketClockReader", () => {
  it("answers from the broker: closed on the holiday, next open Friday, Friday a half day", async () => {
    const { client } = fakeClient();
    const read = marketClockReader({ client: () => client, now: () => new Date(THANKSGIVING) });
    const view = await read();
    expect(view.source).toBe("broker");
    expect(view.isOpen).toBe(false);
    expect(view.phase).toBe("closed");
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
    expect(view.days[0]).toMatchObject({ date: "2026-11-27", halfDay: true });
  });

  it("shares the calendar 6 hours and the clock 60 seconds, one request in flight", async () => {
    let t = THANKSGIVING;
    const { client, reads } = fakeClient();
    const read = marketClockReader({ client: () => client, now: () => new Date(t) });
    await Promise.all([read(), read(), read()]);
    expect(reads).toEqual({ calendar: 1, clock: 1 });
    t += 59_000;
    await read();
    expect(reads).toEqual({ calendar: 1, clock: 1 });
    t += 2_000;
    await read();
    expect(reads).toEqual({ calendar: 1, clock: 2 });
    t += 6 * 60 * 60_000;
    await read();
    expect(reads.calendar).toBe(2);
  });

  it("a failed read falls back to the table and says so — never open by guess", async () => {
    const { client } = fakeClient({
      calendar: () => {
        throw new Error("503");
      },
      clock: () => {
        throw new Error("503");
      },
    });
    const read = marketClockReader({ client: () => client, now: () => new Date(THANKSGIVING) });
    const view = await read();
    expect(view.source).toBe("table");
    expect(view.isOpen).toBe(false);
    expect(view.phase).toBeUndefined();
    expect(view.nextOpenAt).toBe("2026-11-27T14:30:00.000Z");
  });

  it("with no house client at all, the table answers", async () => {
    const read = marketClockReader({ client: () => undefined, now: () => new Date(THANKSGIVING) });
    expect((await read()).source).toBe("table");
  });

  it("keeps the last good calendar through an outage", async () => {
    let t = THANKSGIVING;
    let fail = false;
    const { client } = fakeClient({
      calendar: () => {
        if (fail) throw new Error("down");
        return THANKSGIVING_CALENDAR;
      },
    });
    const read = marketClockReader({ client: () => client, now: () => new Date(t) });
    await read();
    fail = true;
    t += 7 * 60 * 60_000;
    expect((await read()).source).toBe("broker");
  });

  it("refuses a misshapen calendar and warns", async () => {
    const warned: string[] = [];
    const { client } = fakeClient({ calendar: () => ({ message: "forbidden" }) });
    const read = marketClockReader({
      client: () => client,
      now: () => new Date(THANKSGIVING),
      warn: (l) => warned.push(l),
    });
    expect((await read()).source).toBe("table");
    expect(warned.join()).toMatch(/not the calendar's shape/);
  });

  it("warns once per calendar read naming each drift date, and the broker's date wins", async () => {
    const warned: string[] = [];
    const moved = THANKSGIVING_CALENDAR.filter((r) => r.date !== "2026-12-01");
    const { client } = fakeClient({ calendar: () => moved });
    const read = marketClockReader({
      client: () => client,
      now: () => new Date(THANKSGIVING),
      warn: (l) => warned.push(l),
    });
    const view = await read();
    await read();
    expect(warned).toEqual([
      "[market-clock] the broker's calendar and MARKET_CLOSURES disagree on 2026-12-01; the broker's dates win",
    ]);
    expect(view.days.some((d) => d.date === "2026-12-01")).toBe(false);
  });
});
