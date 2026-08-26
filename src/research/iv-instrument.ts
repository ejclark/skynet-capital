import { impliedVolatility } from "../options/pricing.js";
import type { AtmOptionQuote, AtmQuotePort } from "../ports/atm-quotes.js";
import type { IvHistoryPort, IvSample } from "./iv-record.js";
import { trackedUnderlyings } from "./tracked-underlyings.js";

/**
 * THE IV INSTRUMENT — one scheduled tick: read the at-the-money quote for every tracked underlying,
 * solve it to an implied volatility, append the result to the history store.
 *
 * Same shape as this repo's other instruments (`scripts/event-scan.mjs`): a scheduled scan whose
 * only job is to APPEND, with every derived number left to a pure reducer (`iv-rank.ts`). The tick
 * is a plain async function rather than a timer so the cadence lives with whoever schedules it — a
 * server interval, a cron Routine, a CLI — and the specs need no clock.
 *
 * The solver is `src/options/pricing.ts`'s `impliedVolatility`, deliberately and exclusively: a
 * second solver would mean two IV conventions in one repo, and a rank computed across a convention
 * change is a number about our code, not about the market.
 *
 * HONESTY: a quote that yields no honest σ is DROPPED, never recorded. `impliedVolatility` returns
 * `undefined` for a no-arbitrage violation, an expired contract, unusable inputs, or a solve that
 * would only pin its 500% ceiling — every one of which would otherwise enter the series as a
 * fabricated number and quietly move an IV rank. The dropped symbols are reported by name so a
 * scheduled caller can see a feed degrade instead of watching a series go silently thin.
 */

/** What one tick did — recorded samples, plus every tracked symbol that produced none, by name. */
export interface IvTickReport {
  /** ISO-8601 time the tick was taken; every sample carries it. */
  readonly at: string;
  readonly recorded: readonly IvSample[];
  /** Tracked symbols with no usable quote at all — the feed returned nothing for them. */
  readonly unquoted: readonly string[];
  /** Tracked symbols quoted but unsolvable — a quote arrived, no honest σ came out of it. */
  readonly unsolved: readonly string[];
}

export interface IvTickOptions {
  readonly quotes: AtmQuotePort;
  readonly store: IvHistoryPort;
  /** ISO-8601 stamp for this tick — injected, so the tick is a pure function of its inputs. */
  readonly at: string;
  /** Defaults to the derived tracked set (see `tracked-underlyings.ts`). */
  readonly symbols?: readonly string[];
}

/**
 * Solve a batch of at-the-money quotes into IV samples. PURE — no I/O, no clock (the caller supplies
 * `at`), so the whole "did this quote deserve to become a sample" decision is unit-testable on its
 * own. Returns the samples alongside the symbols whose solve declined to produce a number.
 */
export function solveAtmIv(
  quotes: readonly AtmOptionQuote[],
  at: string,
): { readonly samples: readonly IvSample[]; readonly unsolved: readonly string[] } {
  const samples: IvSample[] = [];
  const unsolved: string[] = [];
  for (const quote of quotes) {
    const atmIv = impliedVolatility({
      spot: quote.spot,
      strike: quote.strike,
      daysToExpiry: quote.daysToExpiry,
      rate: quote.rate,
      type: quote.type,
      marketPrice: quote.midPrice,
    });
    if (atmIv === undefined) {
      unsolved.push(quote.symbol);
      continue;
    }
    samples.push({
      at,
      symbol: quote.symbol,
      atmIv,
      spot: quote.spot,
      daysToExpiry: quote.daysToExpiry,
    });
  }
  return { samples, unsolved };
}

/**
 * Run one scheduled tick: quote → solve → append. Awaits every write, so a caller that schedules
 * this knows the tick is durable before it reports — unlike the equity sampler, this series is read
 * a year later, and a silently-dropped write is a hole nothing can backfill.
 */
export async function recordIvTick(options: IvTickOptions): Promise<IvTickReport> {
  const symbols = options.symbols ?? trackedUnderlyings();
  const quotes = await options.quotes.atmQuotes(symbols);
  const quoted = new Set(quotes.map((q) => q.symbol));
  const { samples, unsolved } = solveAtmIv(quotes, options.at);
  for (const sample of samples) {
    await options.store.save(sample);
  }
  return {
    at: options.at,
    recorded: samples,
    unquoted: symbols.filter((s) => !quoted.has(s)),
    unsolved,
  };
}
