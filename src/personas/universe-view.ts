import type { MarketContext, Portfolio } from "../domain/types.js";
import type { Persona } from "./persona.js";

/**
 * A base persona that sees only `universe`'s quotes, momentum and sentiment (#4777).
 *
 * `MarketContext.quotes`' key set IS a persona's tradable universe, and six base personas trade any
 * quote they are handed. The bots' stream now also carries what a bot's playbooks trade (GOOG for
 * G1-GOOG), so without this view a playbook's ticker would become every persona's ticker on every
 * bot. Only the persona's own `decide` is narrowed: the playbooks, guards, equity marks, breakers and
 * the decision record all keep the full context the trader was handed.
 *
 * TEMPORARY: retire it once a guard refuses any intent whose ticker is outside the basket of the
 * playbook it is stamped with (the issue's *Constraints*), not before.
 */
export function withQuoteUniverse(base: Persona, universe: readonly string[]): Persona {
  const allowed = new Set(universe);
  return {
    id: base.id,
    name: base.name,
    thesis: base.thesis,
    decide: (context: MarketContext, portfolio: Portfolio) =>
      base.decide(narrowed(context, allowed), portfolio),
  };
}

function narrowed(context: MarketContext, allowed: ReadonlySet<string>): MarketContext {
  const { momentum, newsSentiment } = context;
  return {
    ...context,
    quotes: pick(context.quotes, allowed),
    ...(momentum ? { momentum: pick(momentum, allowed) } : {}),
    ...(newsSentiment ? { newsSentiment: pick(newsSentiment, allowed) } : {}),
  };
}

function pick<T>(record: Readonly<Record<string, T>>, allowed: ReadonlySet<string>) {
  return Object.fromEntries(Object.entries(record).filter(([symbol]) => allowed.has(symbol)));
}
