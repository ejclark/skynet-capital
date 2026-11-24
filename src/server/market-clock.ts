/**
 * THE SHARED MARKET-HOURS READER (#8248). One cached read of Alpaca's `/v2/calendar` (today to +30
 * days, shared 6 hours) and `/v3/clock` (shared 60 seconds) for every caller on the server — the
 * `GET /api/market/clock` route, the member context, the onboarding read — with one request of each
 * in flight. The precedent is `vix-feed.ts`: fail-soft, the last good answer kept through an outage.
 *
 * WHOSE CLIENT. A house bot participant's, never a member's: a member's credential reads only that
 * member's things (`quote-route.ts`), and market hours are no one's. About one clock read a minute
 * and four calendar reads a day on that login — well inside the 200 a minute the bots share.
 *
 * NEVER A GUESSED HOUR (criterion 2). A failed or misshapen calendar keeps the last good one, else
 * the checked-in table builds the same days and the answer says `source: "table"`. A failed clock
 * drops only the phase; open/closed then comes from the days, and a moment no day covers is closed.
 * Display only: every order still asks Alpaca at review and submit (`desk-gate.ts`).
 */
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import {
  type BrokerClock,
  brokerClock,
  CLOCK_HORIZON_DAYS,
  calendarDays,
  calendarDrift,
  type MarketClockView,
  marketClockView,
  newYorkDate,
  type SessionDay,
  shiftDate,
  tableClockView,
  tableDays,
} from "../domain/market-clock.js";

export type ReadMarketClock = () => Promise<MarketClockView>;

const CALENDAR_SHARE_MS = 6 * 60 * 60_000;
const CLOCK_SHARE_MS = 60_000;
/** A broker read that hasn't answered by then counts as failed: the request never waits on it. */
const BROKER_TIMEOUT_MS = 2_500;
/** After a failure, the next broker try waits this long — one call a minute in an outage, not
 *  one per page load on the bots' shared rate limit, and one warning per window. */
const RETRY_AFTER_MS = 60_000;

/** `work`, or a rejection once `ms` pass — the timer never holds the process open. */
function within<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no answer in ${ms}ms`)), ms);
    timer.unref?.();
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export interface MarketClockReaderDeps {
  /** A house bot participant's trading client; undefined → the table answers. */
  readonly client: () => AlpacaTradingClient | undefined;
  readonly now?: () => Date;
  readonly warn?: (line: string) => void;
  /** How long a broker read may take before it counts as failed (specs shorten it). */
  readonly timeoutMs?: number;
}

/**
 * One shared value with a lifetime and a single request in flight. A failure keeps the last good
 * value for at most `maxStale` (past it, the caller's fallback answers) and backs off
 * `RETRY_AFTER_MS` before the next try.
 */
function shared<T>(
  ttl: number,
  maxStale: number,
  timeoutMs: number,
  now: () => number,
  read: () => Promise<T | undefined>,
): () => Promise<T | undefined> {
  let cached: { at: number; value: T } | undefined;
  let retryAt = 0;
  let inFlight: Promise<T | undefined> | undefined;
  const last = () => (cached && now() - cached.at < maxStale ? cached.value : undefined);
  return () => {
    if (cached && now() - cached.at < ttl) return Promise.resolve(cached.value);
    if (now() < retryAt) return Promise.resolve(last());
    inFlight ??= (async () => {
      try {
        const value = await within(read(), timeoutMs);
        if (value !== undefined) cached = { at: now(), value };
        else retryAt = now() + RETRY_AFTER_MS;
        return value ?? last();
      } catch {
        retryAt = now() + RETRY_AFTER_MS;
        return last();
      } finally {
        inFlight = undefined;
      }
    })();
    return inFlight;
  };
}

export function marketClockReader(deps: MarketClockReaderDeps): ReadMarketClock {
  const now = deps.now ?? (() => new Date());
  const warn = deps.warn ?? ((line: string) => process.emitWarning(line));
  const ms = () => now().getTime();
  const timeout = deps.timeoutMs ?? BROKER_TIMEOUT_MS;

  const calendar = shared<SessionDay[]>(
    CALENDAR_SHARE_MS,
    7 * 24 * 60 * 60_000,
    timeout,
    ms,
    async () => {
      const client = deps.client();
      if (!client) return undefined;
      const from = newYorkDate(now());
      const to = shiftDate(from, CLOCK_HORIZON_DAYS);
      const days = calendarDays(await client.getCalendar(from, to));
      if (!days) {
        warn("[market-clock] /v2/calendar answered a body that is not the calendar's shape");
        return undefined;
      }
      const drift = calendarDrift(days, from, to);
      if (drift.length > 0) {
        warn(
          `[market-clock] the broker's calendar and MARKET_CLOSURES disagree on ${drift.join(", ")}; the broker's dates win`,
        );
      }
      return days;
    },
  );

  const clock = shared<BrokerClock>(CLOCK_SHARE_MS, 5 * 60_000, timeout, ms, async () => {
    const client = deps.client();
    return client ? brokerClock(await client.getMarketClock()) : undefined;
  });

  return async () => {
    const [days, live] = await Promise.all([calendar(), clock()]);
    const at = now();
    if (days) return marketClockView(days, at, "broker", live);
    const today = newYorkDate(at);
    return marketClockView(
      tableDays(today, shiftDate(today, CLOCK_HORIZON_DAYS)),
      at,
      "table",
      live,
    );
  };
}

/**
 * The clock for one request: the configured reader, else the table at `now` (which says so). It
 * never rejects — a reader that throws answers the table — so a page or a companion turn can await
 * it in-line, the way the synchronous table call it replaced never failed them.
 */
export async function readClockFor(config: {
  readonly readMarketClock?: ReadMarketClock;
}): Promise<MarketClockView> {
  try {
    if (config.readMarketClock) return await config.readMarketClock();
  } catch {
    // Falls through to the table, which marks itself `source: "table"`.
  }
  return tableClockView(new Date());
}
