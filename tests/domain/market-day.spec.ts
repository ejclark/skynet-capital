import { isSameMarketDay, MARKET_TIMEZONE, marketDayKey } from "../../src/domain/market-day.js";

describe("marketDayKey", () => {
  it("keys a 3:55pm ET close to that trading day, not the next one", () => {
    // 19:55Z in August is 3:55pm EDT — a naive UTC slice would still say the 14th, but the
    // 8:30pm ET case below is the one that proves the timezone is actually doing work.
    expect(marketDayKey("2026-08-14T19:55:00.000Z")).toBe("2026-08-14");
  });

  it("keeps an instant past UTC midnight on the market day it belongs to", () => {
    // 01:30Z on the 15th is 9:30pm ET on the 14th — after hours on the 14th's session.
    expect(marketDayKey("2026-08-15T01:30:00.000Z")).toBe("2026-08-14");
  });

  it("honours an explicit timezone over the market default", () => {
    expect(marketDayKey("2026-08-15T01:30:00.000Z", "UTC")).toBe("2026-08-15");
    expect(MARKET_TIMEZONE).toBe("America/New_York");
  });

  it("falls back to the leading date characters rather than throwing on junk input", () => {
    expect(marketDayKey("not-a-date")).toBe("not-a-date");
    expect(marketDayKey("garbage")).toBe("garbage");
  });

  it("builds at most one formatter for a thousand instants in one zone (#4613)", () => {
    // Why one formatter matters: src/domain/intl-format.ts.
    const Real = Intl.DateTimeFormat;
    let built = 0;
    Intl.DateTimeFormat = class extends Real {
      constructor(...args: ConstructorParameters<typeof Real>) {
        super(...args);
        built += 1;
      }
    } as typeof Real;
    const keys = new Set<string>();
    try {
      for (let i = 0; i < 1000; i++)
        keys.add(
          marketDayKey(
            new Date(Date.UTC(2026, 6, 1) + i * 300_000).toISOString(),
            "America/Denver",
          ),
        );
    } finally {
      Intl.DateTimeFormat = Real;
    }
    expect(built).toBeLessThanOrEqual(1);
    // 1,000 five-minute samples from midnight UTC (6pm MDT on Jun 30) run to 5:15am MDT Jul 4.
    expect([...keys]).toEqual([
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
    ]);
  });

  it("falls back to the UTC date for an unknown zone, every time — a bad zone is never cached", () => {
    expect(marketDayKey("2026-08-15T01:30:00.000Z", "Mars/Olympus_Mons")).toBe("2026-08-15");
    expect(marketDayKey("2026-08-16T01:30:00.000Z", "Mars/Olympus_Mons")).toBe("2026-08-16");
  });

  it("produces lexically sortable keys, which is the property day strips rely on", () => {
    const keys = ["2026-09-01T14:00:00.000Z", "2026-08-31T14:00:00.000Z"].map((iso) =>
      marketDayKey(iso),
    );
    expect([...keys].sort()).toEqual(["2026-08-31", "2026-09-01"]);
  });
});

describe('isSameMarketDay — the one place "is this zero-DTE?" is answered (#1671)', () => {
  it("matches an instant to the plain date it falls on, in market time", () => {
    expect(isSameMarketDay("2026-09-18T15:00:00.000Z", "2026-09-18")).toBe(true);
  });

  it("keeps 9:30pm ET on its own day rather than the naive UTC tomorrow", () => {
    expect(isSameMarketDay("2026-09-19T01:30:00.000Z", "2026-09-18")).toBe(true);
    expect(isSameMarketDay("2026-09-19T01:30:00.000Z", "2026-09-19")).toBe(false);
  });

  it("is false for any other date", () => {
    expect(isSameMarketDay("2026-09-18T15:00:00.000Z", "2026-09-19")).toBe(false);
  });
});
