import type { UnderlyingQuote } from "../../src/alpaca/alpaca-options-client.js";
import { createQuotePoller } from "../../src/server/quote-poller.js";

/**
 * The quote poller (#5001) feeds the trade page's quote hub from REST snapshots, so the dashboard
 * never opens a market-data socket that could starve the bots' one per-login connection.
 * Observed through the ticks it hands the hub's sinks and the reads it makes.
 */
function setup(quotes: Record<string, UnderlyingQuote | undefined> = {}) {
  const trades: { symbol: string; price: number; at: string }[] = [];
  const bidAsks: { symbol: string; bid: number; ask: number }[] = [];
  const reads: string[] = [];
  const pending: { run: () => void; ms: number }[] = [];
  const poller = createQuotePoller({
    sinks: {
      onTrade: (tick) => trades.push(tick),
      onQuote: (tick) => bidAsks.push({ symbol: tick.symbol, bid: tick.bid, ask: tick.ask }),
    },
    snapshot: (symbol) => {
      reads.push(symbol);
      return Promise.resolve(quotes[symbol]);
    },
    schedule: (run, ms) => {
      const entry = { run, ms };
      pending.push(entry);
      return () => {
        pending.splice(pending.indexOf(entry), 1);
      };
    },
  });
  /** Fire the next scheduled poll and let its reads settle. */
  const fire = async () => {
    const next = pending.shift();
    next?.run();
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { poller, trades, bidAsks, reads, pending, fire };
}

const NVDA: UnderlyingQuote = {
  last: 180.5,
  prevClose: 178,
  lastAt: "2026-10-09T15:00:00Z",
  bid: 180.4,
  ask: 180.6,
};

describe("quote poller", () => {
  it("reads each subscribed symbol and hands the hub a trade and a bid/ask", async () => {
    const { poller, trades, bidAsks, fire } = setup({ NVDA });
    poller.resubscribe(["NVDA"]);
    poller.start();
    await fire();
    expect(trades).toEqual([{ symbol: "NVDA", price: 180.5, at: "2026-10-09T15:00:00Z" }]);
    expect(bidAsks).toEqual([{ symbol: "NVDA", bid: 180.4, ask: 180.6 }]);
  });

  it("keeps polling on a timer until stopped", async () => {
    const { poller, reads, pending, fire } = setup({ NVDA });
    poller.resubscribe(["NVDA"]);
    poller.start();
    await fire();
    await fire();
    expect(reads).toEqual(["NVDA", "NVDA"]);
    poller.stop();
    expect(pending).toHaveLength(0);
  });

  it("stays quiet on a failed or empty read rather than guessing a price", async () => {
    const { poller, trades, fire } = setup({});
    poller.resubscribe(["MISSING"]);
    poller.start();
    await fire();
    expect(trades).toEqual([]);
  });

  it("stretches the interval with the symbol count to stay under the broker's rate limit", () => {
    const { poller, pending } = setup();
    poller.resubscribe(["A", "B", "C", "D", "E", "F"]);
    poller.start();
    expect(pending[0]?.ms).toBe(6_000);
  });
});
