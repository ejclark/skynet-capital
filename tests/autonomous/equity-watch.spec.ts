import { fleetEquity, markedEquity } from "../../src/autonomous/equity-watch.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { MarketContext, Portfolio } from "../../src/domain/types.js";

const ctx = (quotes: MarketContext["quotes"]): MarketContext => ({
  asOf: "2026-08-09T14:00:00.000Z",
  quotes,
});

const q = (symbol: string, last: number) => ({ symbol, bid: last, ask: last, last, asOf: "t" });

describe("markedEquity", () => {
  it("values cash plus positions at the context's last price", () => {
    const portfolio: Portfolio = {
      cash: 1_000,
      positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100 }],
    };
    expect(markedEquity(portfolio, ctx({ AAPL: q("AAPL", 120) }))).toBe(1_000 + 10 * 120);
  });

  it("falls back to average cost when a quote is missing or unusable — never a false $0 crash", () => {
    const portfolio: Portfolio = {
      cash: 500,
      positions: [
        { symbol: "MSFT", quantity: 5, avgPrice: 200 }, // no quote at all
        { symbol: "NVDA", quantity: 2, avgPrice: 300 }, // non-finite quote
      ],
    };
    expect(markedEquity(portfolio, ctx({ NVDA: q("NVDA", Number.NaN) }))).toBe(
      500 + 5 * 200 + 2 * 300,
    );
  });
});

describe("fleetEquity", () => {
  it("sums every bot's marked equity into the one baseline the breaker watches", () => {
    const a: Portfolio = { cash: 100, positions: [] };
    const b: Portfolio = { cash: 50, positions: [{ symbol: "AAPL", quantity: 1, avgPrice: 10 }] };
    expect(fleetEquity([a, b], ctx({ AAPL: q("AAPL", 20) }))).toBe(100 + 50 + 20);
  });

  it("feeds the daily-loss breaker end to end: a real drop past the cap halts", () => {
    const safety = new SafetyController({ maxDailyLossPct: 0.05 });
    const positions = [{ symbol: "AAPL", quantity: 100, avgPrice: 100 }];
    const portfolio: Portfolio = { cash: 0, positions };
    safety.recordEquity(fleetEquity([portfolio], ctx({ AAPL: q("AAPL", 100) }))); // baseline 10_000
    safety.recordEquity(fleetEquity([portfolio], ctx({ AAPL: q("AAPL", 94) }))); // −6% — past the 5% cap
    expect(safety.blockedReason()).toBe("daily-loss");
  });
});
