import {
  type DailyHighOf,
  type DailyHighReading,
  dailyHighReading,
  type FetchDailyCloses,
} from "../domain/daily-high.js";
import { DAY_MS } from "../domain/time.js";

/**
 * The daily-high reading the long-LEAP playbook buys on (#6340), kept fresh on its own clock so the
 * decision pass never waits on a network call — the same shape as the 5-minute bar feed
 * (`intraday-bars-feed.ts`), at a daily cadence.
 *
 * DEMAND-DRIVEN: nothing is fetched until a playbook asks for a ticker (`highOf`), so a bot with no
 * long-LEAP subscription costs no request. `refresh()` is called by the live loop each cycle, not
 * awaited; it reads a ticker again only once its last attempt is older than `refreshMs` (30 minutes:
 * the reading ends at the last completed session, so it moves once a day), one at a time, and never
 * throws.
 *
 * COMPLETED SESSIONS ONLY: the read ends yesterday, so a partial session never stands in for a
 * close. FAIL-SOFT, LOUD ONCE: a failed read keeps the last good reading and says so once per
 * outage; the play then sees an older session and refuses a stale one itself.
 *
 * READ ONLY: it holds a bar fetcher and nothing that can place an order.
 */
export interface DailyHighFeedOptions {
  readonly now?: () => number;
  readonly refreshMs?: number;
  /** Calendar days of bars to ask for: 252 sessions plus weekends and holidays, with room. */
  readonly lookbackDays?: number;
  readonly log?: (line: string) => void;
}

export class DailyHighFeed {
  private readonly wanted = new Set<string>();
  private readonly cache = new Map<string, DailyHighReading>();
  private readonly attemptedAt = new Map<string, number>();
  private readonly failing = new Set<string>();
  private inFlight: Promise<void> | undefined;
  private readonly now: () => number;
  private readonly refreshMs: number;
  private readonly lookbackDays: number;
  private readonly log: (line: string) => void;

  constructor(
    private readonly fetchCloses: FetchDailyCloses,
    options: DailyHighFeedOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.refreshMs = options.refreshMs ?? 30 * 60_000;
    this.lookbackDays = options.lookbackDays ?? 400;
    this.log = options.log ?? (() => undefined);
  }

  /** The cache read a playbook is handed. Asking for a ticker is what makes `refresh()` fetch it. */
  readonly highOf: DailyHighOf = (symbol) => {
    this.wanted.add(symbol);
    return this.cache.get(symbol);
  };

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
      const end = new Date(now - DAY_MS).toISOString().slice(0, 10);
      let reading: DailyHighReading | undefined;
      try {
        const bars = await this.fetchCloses(symbol, start, end);
        reading = bars ? dailyHighReading(bars) : undefined;
      } catch {
        reading = undefined;
      }
      if (reading === undefined) {
        if (!this.failing.has(symbol)) {
          this.failing.add(symbol);
          this.log(`[daily-high] ${symbol}: no year of daily closes — keeping the last reading`);
        }
        continue;
      }
      if (this.failing.delete(symbol))
        this.log(`[daily-high] ${symbol}: daily closes readable again`);
      this.cache.set(symbol, reading);
    }
  }
}
