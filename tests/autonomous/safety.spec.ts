import { SafetyController } from "../../src/autonomous/safety.js";
import type { MarketContext } from "../../src/domain/types.js";

const ctx = (quotes: MarketContext["quotes"]): MarketContext => ({
  asOf: "2026-07-24T14:00:00Z",
  quotes,
  momentum: {},
});

describe("SafetyController", () => {
  it("starts un-halted and the manual kill switch stops it (until reset)", () => {
    const s = new SafetyController();
    expect(s.blockedReason()).toBeNull();
    s.halt();
    expect(s.blockedReason()).toBe("manual");
    s.reset();
    expect(s.blockedReason()).toBeNull();
  });

  it("first reason wins — a later trip does not overwrite the kill switch", () => {
    const s = new SafetyController();
    s.halt("manual");
    s.recordError();
    s.recordError();
    s.recordError();
    s.recordError();
    s.recordError();
    expect(s.blockedReason()).toBe("manual");
  });

  it("trips the daily-loss breaker when equity falls past the cap", () => {
    const s = new SafetyController({ maxDailyLossPct: 0.05 });
    s.recordEquity(1_000_000); // baseline
    s.recordEquity(970_000); // -3% — fine
    expect(s.blockedReason()).toBeNull();
    s.recordEquity(940_000); // -6% — trip
    expect(s.blockedReason()).toBe("daily-loss");
  });

  it("trips the order-rate breaker when too many orders land in the window", () => {
    let t = 0;
    const s = new SafetyController({ maxOrdersPerWindow: 3, orderWindowMs: 1000 }, () => t);
    for (let i = 0; i < 3; i++) {
      t += 100;
      s.recordOrder();
    }
    expect(s.blockedReason()).toBeNull();
    t += 100;
    s.recordOrder(); // 4th within 1s — trip
    expect(s.blockedReason()).toBe("order-rate");
  });

  it("trips the error breaker on consecutive failures and success resets the count", () => {
    const s = new SafetyController({ maxConsecutiveErrors: 3 });
    s.recordError();
    s.recordError();
    s.recordSuccess(); // resets
    s.recordError();
    s.recordError();
    expect(s.blockedReason()).toBeNull();
    s.recordError(); // 3rd in a row — trip
    expect(s.blockedReason()).toBe("errors");
  });

  it("trips the data-gap breaker on empty or unusable quotes", () => {
    const empty = new SafetyController();
    empty.checkContext(ctx({}));
    expect(empty.blockedReason()).toBe("data-gap");

    const nan = new SafetyController();
    nan.checkContext(
      ctx({ NVDA: { symbol: "NVDA", bid: 0, ask: 0, last: Number.NaN, asOf: "t" } }),
    );
    expect(nan.blockedReason()).toBe("data-gap");

    const ok = new SafetyController();
    ok.checkContext(ctx({ NVDA: { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" } }));
    expect(ok.blockedReason()).toBeNull();
  });
});
