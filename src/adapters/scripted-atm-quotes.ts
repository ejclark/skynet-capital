import type { AtmOptionQuote, AtmQuotePort } from "../ports/atm-quotes.js";

/**
 * An `AtmQuotePort` that serves a fixed table of quotes — the in-memory adapter that lets the IV
 * instrument's specs (and offline runs) exercise the real code path with no network.
 *
 * Deliberately keyed by underlying and deliberately PARTIAL: a symbol absent from the table is
 * absent from the answer, which is exactly what a live feed does on a halted or untracked name.
 * That is the case the instrument must handle honestly, so the fake must be able to produce it.
 */
export class ScriptedAtmQuotes implements AtmQuotePort {
  private readonly bySymbol: Map<string, AtmOptionQuote>;

  constructor(quotes: readonly AtmOptionQuote[]) {
    this.bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  }

  atmQuotes(symbols: readonly string[]): Promise<readonly AtmOptionQuote[]> {
    const found: AtmOptionQuote[] = [];
    for (const symbol of symbols) {
      const quote = this.bySymbol.get(symbol);
      if (quote) found.push(quote);
    }
    return Promise.resolve(found);
  }
}
