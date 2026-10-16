import type { FetchIntradayBars, IntradayBar, IntradayBarsOf } from "../domain/intraday-bar.js";

/**
 * The 5-minute bars the dark playbooks read (#5489), kept fresh on their own clock so the decision
 * pass never waits on a network call. A persona's reads are synchronous and pure (`IntradayBarsOf`);
 * this is the cache behind that read.
 *
 * DEMAND-DRIVEN: nothing is fetched until a playbook asks for a ticker (`barsOf`), so a bot with no
 * dip-to-bounce subscription costs no request, and a subscribed one asks for exactly its names.
 * `refresh()` is called by the live loop each cycle, not awaited; it fetches only the tickers
 * whose last attempt is older than `refreshMs` (one 60-second read per name is ~2 requests a minute
 * for MU and NBIS, far under Alpaca's data limit), one at a time, and never throws.
 *
 * FAIL-SOFT, LOUD ONCE: a read that fails keeps the last good bars and says so once per outage, and
 * says once when it recovers. The observer then simply sees an older newest bar, which the day
 * reading records.
 *
 * READ ONLY: it holds a bar fetcher (`alpaca-intraday-bars.ts`, a `get`) and nothing that can place
 * an order.
 */
export interface IntradayBarsFeedOptions {
  readonly now?: () => number;
  /** How old a ticker's last attempt may be before `refresh()` reads it again. */
  readonly refreshMs?: number;
  /** Calendar days of bars to ask for: 20 sessions plus holidays and weekends. */
  readonly lookbackDays?: number;
  readonly log?: (line: string) => void;
}

const DAY_MS = 86_400_000;

export class IntradayBarsFeed {
  private readonly wanted = new Set<string>();
  private readonly cache = new Map<string, readonly IntradayBar[]>();
  private readonly attemptedAt = new Map<string, number>();
  private readonly failing = new Set<string>();
  private inFlight: Promise<void> | undefined;
  private readonly now: () => number;
  private readonly refreshMs: number;
  private readonly lookbackDays: number;
  private readonly log: (line: string) => void;

  constructor(
    private readonly fetchBars: FetchIntradayBars,
    options: IntradayBarsFeedOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.refreshMs = options.refreshMs ?? 60_000;
    this.lookbackDays = options.lookbackDays ?? 32;
    this.log = options.log ?? (() => undefined);
  }

  /** The cache read a playbook is handed. Asking for a ticker is what makes `refresh()` fetch it. */
  readonly barsOf: IntradayBarsOf = (symbol) => {
    this.wanted.add(symbol);
    return this.cache.get(symbol);
  };

  /** Tickers some playbook has asked for. */
  symbols(): readonly string[] {
    return [...this.wanted];
  }

  /** Read every asked-for ticker whose last attempt is older than `refreshMs`. One at a time,
   *  overlapping calls share the run in flight, never throws. */
  refresh(): Promise<void> {
    this.inFlight ??= this.run().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async run(): Promise<void> {
    for (const symbol of this.wanted) {
      const now = this.now();
      const last = this.attemptedAt.get(symbol);
      if (last !== undefined && now - last < this.refreshMs) continue;
      this.attemptedAt.set(symbol, now);
      const start = new Date(now - this.lookbackDays * DAY_MS).toISOString().slice(0, 10);
      const end = new Date(now).toISOString().slice(0, 10);
      let bars: readonly IntradayBar[] | undefined;
      try {
        bars = await this.fetchBars(symbol, start, end);
      } catch {
        bars = undefined;
      }
      if (bars === undefined) {
        if (!this.failing.has(symbol)) {
          this.failing.add(symbol);
          this.log(`[intraday-bars] ${symbol}: feed unreadable — keeping the last bars it read`);
        }
        continue;
      }
      if (this.failing.delete(symbol)) this.log(`[intraday-bars] ${symbol}: feed readable again`);
      this.cache.set(symbol, bars);
    }
  }
}
