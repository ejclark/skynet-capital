import { fetchQuote } from "./quote";

/**
 * The quote query every ticket surface shares (`QuoteHeader`, `TradeGate` — #3407 slice 6): one
 * key, one fetch, react-query dedupes. Commit-driven — the symbol here is a COMMITTED one, never
 * a keystroke. Its own module so a spec that mocks `./quote`'s fetch keeps this real.
 */
export function quoteQuery(symbol: string) {
  return {
    queryKey: ["quote", symbol] as const,
    queryFn: () => fetchQuote(symbol),
    enabled: symbol !== "",
    staleTime: 15_000,
  };
}
