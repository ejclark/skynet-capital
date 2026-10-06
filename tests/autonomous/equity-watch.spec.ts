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

describe("markedEquity — option contracts (#4643)", () => {
  const call = "NVDA261113C00240000";

  it("marks an unquoted contract at the broker's market value, not 1/100th of its cost", () => {
    const portfolio: Portfolio = {
      cash: 9_500,
      positions: [{ symbol: call, quantity: 1, avgPrice: 5, marketValue: 520 }],
    };
    expect(markedEquity(portfolio, ctx({}))).toBe(9_500 + 520);
  });

  it("an option held overnight does not read as a loss against the broker's own baseline", () => {
    // The breaker's baseline is the broker's last equity: $9,000 cash + two $500 calls = $10,000.
    const safety = new SafetyController({ maxDailyLossPct: 0.05 });
    safety.recordEquity(10_000);
    const portfolio: Portfolio = {
      cash: 9_000,
      positions: [{ symbol: call, quantity: 2, avgPrice: 5 }], // no quote, no market value
    };
    // Unscaled, this read $9,010 — a 9.9% "loss" that halted the whole fleet on a paper call.
    safety.recordEquity(markedEquity(portfolio, ctx({})));
    expect(safety.blockedReason()).toBeNull();
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
