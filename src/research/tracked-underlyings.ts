import type { EarningsPrint } from "../domain/earnings-calendar.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { G1_GOOG, S1_NVDA } from "../playbooks/registry.js";

/**
 * WHICH UNDERLYINGS THE IV INSTRUMENT TRACKS — and why this list is derived, not typed out.
 *
 * "Every tradable underlying" is the wrong starting set: it costs a chain read per name per tick
 * forever, and a rank on a name nobody trades answers no question anyone asked. The defensible
 * starting set is the names the house already has an opinion about — the two sources that already
 * exist in `src/`:
 *
 *   - `UPCOMING_PRINTS` (src/domain/earnings-calendar.ts) — the sweep's eight-symbol research
 *     universe. Every one of these has a print window, and a print window is precisely where
 *     "is premium rich?" decides whether a play is worth taking.
 *   - the house playbook roster's underlyings (S1-NVDA, G1-GOOG) — the two names real paper
 *     capital is actually deployed against.
 *
 * DERIVED, so it cannot drift: add a symbol to the earnings calendar or stand up a third playbook
 * and the instrument starts tracking it on the next tick, with nobody remembering to edit a second
 * list. A hand-typed constant here would be a copy waiting to go stale.
 *
 * Past prints are NOT filtered out. A symbol that traded through its print is exactly the symbol
 * whose IV history is most worth keeping — dropping it would punch a hole in its own series.
 */

/** The underlyings the house playbook roster deploys against. */
const PLAYBOOK_SYMBOLS: readonly string[] = [S1_NVDA.symbol, G1_GOOG.symbol];

/**
 * The tracked set: earnings-calendar symbols ∪ playbook symbols, deduped and sorted (stable order
 * keeps a tick's report and any rendering deterministic). Arguments are injectable so specs can pin
 * the derivation without depending on today's calendar contents.
 */
export function trackedUnderlyings(
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
  playbookSymbols: readonly string[] = PLAYBOOK_SYMBOLS,
): readonly string[] {
  const symbols = new Set<string>();
  for (const print of prints) symbols.add(print.symbol);
  for (const symbol of playbookSymbols) symbols.add(symbol);
  return [...symbols].sort();
}
