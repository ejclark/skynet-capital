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

export interface MarketClockReaderDeps {
  /** A house bot participant's trading client; undefined → the table answers. */
  readonly client: () => AlpacaTradingClient | undefined;
  readonly now?: () => Date;
  readonly warn?: (line: string) => void;
}

/** One shared value with a lifetime and a single request in flight; a failure keeps the last. */
function shared<T>(
  ttl: number,
  now: () => number,
  read: () => Promise<T | undefined>,
): () => Promise<T | undefined> {
  let cached: { at: number; value: T } | undefined;
  let inFlight: Promise<T | undefined> | undefined;
  return () => {
    if (cached && now() - cached.at < ttl) return Promise.resolve(cached.value);
    inFlight ??= (async () => {
      try {
        const value = await read();
        if (value !== undefined) cached = { at: now(), value };
        return value ?? cached?.value;
      } catch {
        return cached?.value;
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

  const calendar = shared<SessionDay[]>(CALENDAR_SHARE_MS, ms, async () => {
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
  });

  const clock = shared<BrokerClock>(CLOCK_SHARE_MS, ms, async () => {
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

/** The clock for one request: the configured reader, else the table at `now` (which says so). */
export function readClockFor(config: {
  readonly readMarketClock?: ReadMarketClock;
}): Promise<MarketClockView> {
  return config.readMarketClock
    ? config.readMarketClock()
    : Promise.resolve(tableClockView(new Date()));
}
