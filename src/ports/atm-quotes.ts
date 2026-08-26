import type { OptionType } from "../trading/option-symbols.js";

/**
 * The boundary between the IV instrument and wherever option quotes come from.
 *
 * The instrument needs exactly one thing per underlying — the nearest-the-money contract's observed
 * premium plus the inputs that price it — so the port asks for that and nothing more. A live Alpaca
 * chain adapter and a scripted in-memory one both satisfy it, which is what keeps the instrument's
 * specs network-free.
 *
 * Quote selection (which expiry, which strike is "at the money", bid/ask vs. mid) is the ADAPTER's
 * job, not the instrument's: those choices depend on the feed's shape, and baking one feed's
 * conventions into the reducer is how a second data source later becomes impossible to add.
 */
export interface AtmOptionQuote {
  /** The UNDERLYING's ticker (e.g. "NVDA") — never an OCC option symbol. */
  readonly symbol: string;
  readonly spot: number;
  readonly strike: number;
  /** Calendar days to expiry; fractional allowed. */
  readonly daysToExpiry: number;
  readonly type: OptionType;
  /** Observed premium per share — the number the IV solve must reproduce. */
  readonly midPrice: number;
  /** Annualized risk-free rate as a decimal. Defaults to 0 when the feed doesn't carry one. */
  readonly rate?: number;
}

export interface AtmQuotePort {
  /**
   * The nearest-the-money quote for each requested underlying. A symbol with no usable quote is
   * simply ABSENT from the result — never a zero-filled placeholder, which the solver would happily
   * turn into a fabricated volatility.
   */
  atmQuotes(symbols: readonly string[]): Promise<readonly AtmOptionQuote[]>;
}
