import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { marketDayKey } from "../domain/market-day.js";
import { daysToExpiryFrom } from "../options/single-leg-odds.js";
import type { AtmOptionQuote, AtmQuotePort } from "../ports/atm-quotes.js";

/**
 * THE LIVE AT-THE-MONEY QUOTE — the Alpaca adapter behind the IV instrument (`iv-instrument.ts`),
 * the live twin of `ScriptedAtmQuotes`. One quote per underlying: the call nearest spot, on the
 * listed expiry nearest a 30-day tenor.
 *
 * The selection choices are the series' convention, so each is stated once here and never varied:
 *
 *   - **A constant ~30-day tenor.** IV rank compares today's number to a year of past ones; if the
 *     tenor drifted between 8 and 60 days the rank would measure term structure, not richness. The
 *     sampled `daysToExpiry` is kept on every sample, so an audit can see the drift that remains.
 *   - **Never under a week.** The last days of a contract are pin and gamma, not volatility.
 *   - **The call, both sides quoted, mid of the two.** `rowPremium`'s previous-close fallback is
 *     refused here: a stale close solved against a live spot is a fabricated IV, and a fabricated
 *     point would sit in the rank's window for a year.
 *
 * Fail-soft per symbol: a symbol whose spot, listing or quotes can't be read is ABSENT from the
 * answer (the port's contract), and the instrument reports it by name as unquoted.
 */

/** The tenor the series samples at — the calendar-day convention IV rank is usually quoted on. */
export const TARGET_TENOR_DAYS = 30;
/** Expiries closer than this are excluded outright. */
export const MIN_TENOR_DAYS = 7;
/** Listed expiries fetched per underlying — enough to straddle the 30-day target on any listing. */
const EXPIRATIONS_SCANNED = 12;

/** The three read-only lookups the adapter needs — a real client satisfies it structurally. */
export type AtmQuoteReader = Pick<
  AlpacaOptionsClient,
  "getUnderlyingPrice" | "getExpirations" | "getChain"
>;

/** The listed expiry whose tenor sits nearest the 30-day target, never under a week. PURE. */
export function pickTenor(
  expirations: readonly string[],
  now: Date,
): { readonly expiration: string; readonly daysToExpiry: number } | undefined {
  return expirations
    .map((expiration) => ({ expiration, daysToExpiry: daysToExpiryFrom(expiration, now) }))
    .filter(
      (e): e is { expiration: string; daysToExpiry: number } =>
        e.daysToExpiry !== undefined && e.daysToExpiry >= MIN_TENOR_DAYS,
    )
    .sort(
      (a, b) =>
        Math.abs(a.daysToExpiry - TARGET_TENOR_DAYS) - Math.abs(b.daysToExpiry - TARGET_TENOR_DAYS),
    )[0];
}

/** The call nearest spot with both sides quoted, priced at the mid. PURE. */
export function pickAtmQuote(
  symbol: string,
  spot: number,
  daysToExpiry: number,
  rows: readonly OptionChainRow[],
): AtmOptionQuote | undefined {
  const quoted = rows.filter(
    (r) => r.bid !== undefined && r.ask !== undefined && r.bid > 0 && r.ask >= r.bid,
  );
  const nearest = [...quoted].sort(
    (a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot) || a.strike - b.strike,
  )[0];
  if (!nearest) return undefined;
  return {
    symbol,
    spot,
    strike: nearest.strike,
    daysToExpiry,
    type: "call",
    midPrice: ((nearest.bid as number) + (nearest.ask as number)) / 2,
  };
}

export class AlpacaAtmQuotes implements AtmQuotePort {
  constructor(
    private readonly client: AtmQuoteReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async atmQuotes(symbols: readonly string[]): Promise<readonly AtmOptionQuote[]> {
    const found: AtmOptionQuote[] = [];
    // Sequential on purpose: a daily tick over ~10 names has no latency budget, and the data host's
    // rate limit is shared with every member reading a chain at the same moment.
    for (const symbol of symbols) {
      const quote = await this.quoteOne(symbol).catch(() => undefined);
      if (quote) found.push(quote);
    }
    return found;
  }

  private async quoteOne(symbol: string): Promise<AtmOptionQuote | undefined> {
    const now = this.now();
    const spot = await this.client.getUnderlyingPrice(symbol);
    if (!(spot !== undefined && spot > 0)) return undefined;
    const today = marketDayKey(now.toISOString());
    const tenor = pickTenor(
      await this.client.getExpirations(symbol, today, EXPIRATIONS_SCANNED),
      now,
    );
    if (!tenor) return undefined;
    const rows = await this.client.getChain(symbol, tenor.expiration, "call");
    return pickAtmQuote(symbol, spot, tenor.daysToExpiry, rows);
  }
}
