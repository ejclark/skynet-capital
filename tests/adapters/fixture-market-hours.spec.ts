import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { WritableFixtureTradingTransport } from "../../src/adapters/writable-fixture-trading-transport.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import { brokerClock, calendarDays, calendarDrift } from "../../src/domain/market-clock.js";

/** The offline worlds answer `/v2/calendar` and `/v3/clock` from the table and the pinned clock
 *  their `/v2/clock` reads (#8248 criterion 7), so the e2e guard stays pinned open. */

/** e2e's FIXED_CLOCK: Friday 2026-09-18, 10:00 AM ET. */
const FIXED = new Date("2026-09-18T14:00:00Z");
const account = { account: { cash: "1000" } };

describe("the fixture transports' calendar and clock", () => {
  for (const [name, transport] of [
    ["read-only", new FixtureTradingTransport(account, () => FIXED)],
    ["writable", new WritableFixtureTradingTransport(account, { marketNow: () => FIXED })],
  ] as const) {
    it(`${name}: open at FIXED_CLOCK, closing 4:00 PM ET`, async () => {
      const client = new AlpacaTradingClient(transport);
      const clock = brokerClock(await client.getMarketClock());
      expect(clock?.phase).toBe("core");
      expect(new Date(clock?.phaseUntil ?? 0).toISOString()).toBe("2026-09-18T20:00:00.000Z");
      expect(new Date(clock?.nextOpenAt ?? 0).toISOString()).toBe("2026-09-21T13:30:00.000Z");
    });

    it(`${name}: Thanksgiving week as the table lists it, with no drift`, async () => {
      const client = new AlpacaTradingClient(transport);
      const days = calendarDays(await client.getCalendar("2026-11-23", "2026-11-27")) ?? [];
      expect(days.map((d) => d.date)).toEqual([
        "2026-11-23",
        "2026-11-24",
        "2026-11-25",
        "2026-11-27",
      ]);
      expect(calendarDrift(days, "2026-11-23", "2026-11-27")).toEqual([]);
    });
  }

  it("on Thanksgiving morning the clock reads closed until Friday's pre-market", async () => {
    const holiday = new Date("2026-11-26T15:00:00Z");
    const client = new AlpacaTradingClient(new FixtureTradingTransport(account, () => holiday));
    const clock = brokerClock(await client.getMarketClock());
    expect(clock?.phase).toBe("closed");
    expect(new Date(clock?.phaseUntil ?? 0).toISOString()).toBe("2026-11-27T09:00:00.000Z");
    expect(new Date(clock?.nextCloseAt ?? 0).toISOString()).toBe("2026-11-27T18:00:00.000Z");
  });
});
