import { MARKET_TIMEZONE, marketDayKey } from "../../src/domain/market-day.js";

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

  it("produces lexically sortable keys, which is the property day strips rely on", () => {
    const keys = ["2026-09-01T14:00:00.000Z", "2026-08-31T14:00:00.000Z"].map((iso) =>
      marketDayKey(iso),
    );
    expect([...keys].sort()).toEqual(["2026-08-31", "2026-09-01"]);
  });
});
