import { COMMUNICATION_SERVICES } from "./communication-services.js";
import { CONSUMER_DISCRETIONARY } from "./consumer-discretionary.js";
import { CONSUMER_STAPLES } from "./consumer-staples.js";
import { CRYPTO } from "./crypto.js";
import { ENERGY } from "./energy.js";
import { ETFS } from "./etfs.js";
import { FINANCIALS } from "./financials.js";
import { HEALTHCARE } from "./healthcare.js";
import { INDUSTRIALS } from "./industrials.js";
import { MATERIALS } from "./materials.js";
import { REAL_ESTATE } from "./real-estate.js";
import { SMALL_CAP } from "./small-cap.js";
import { TECHNOLOGY } from "./technology.js";
import type { TickerEntry } from "./types.js";
import { UTILITIES } from "./utilities.js";

export type { TickerEntry } from "./types.js";

/**
 * THE TICKER DIRECTORY — a convenience for the Symbol field's intellisense, not a whitelist.
 *
 * Typing "NV" should surface "NVDA - Nvidia" the way every other trading platform's symbol field
 * does. This directory is what makes that possible: it exists purely to RANK suggestions while a
 * member is typing. It is deliberately broad — Eric's brief: "all tradeable companies that people
 * think to trade… crypto symbols are tradeable now, also penny stocks… different sectors to
 * ensure high success rates" — spanning large/mid-cap names across every GICS sector, the major
 * broad-market and sector ETFs, the crypto pairs Alpaca lists for paper trading, and a set of
 * commonly-searched small-cap/meme/penny names.
 *
 * A MISS IS NEVER A BLOCK. `SymbolField` (app/src/shell/symbol-field.tsx) falls through to free
 * text for any symbol not in here — the desk's own review/submit gate is the real authority on
 * whether a symbol is tradeable, exactly as it was before this directory existed. Split into one
 * file per sector (this index re-exports and concatenates them) purely to stay under the
 * architecture fitness gate's per-file code-line cap — the split carries no ranking meaning.
 *
 * KNOWN GAP: a brand-new IPO won't be in here until someone adds it by hand. That's expected and
 * fine — free text still works. A live fallback for directory misses (querying Alpaca's own asset
 * list) is a separate, later slice, not this one.
 */
export const TICKER_DIRECTORY: readonly TickerEntry[] = [
  ...TECHNOLOGY,
  ...COMMUNICATION_SERVICES,
  ...HEALTHCARE,
  ...FINANCIALS,
  ...ENERGY,
  ...CONSUMER_DISCRETIONARY,
  ...CONSUMER_STAPLES,
  ...INDUSTRIALS,
  ...UTILITIES,
  ...REAL_ESTATE,
  ...MATERIALS,
  ...ETFS,
  ...CRYPTO,
  ...SMALL_CAP,
];

/** Which ranking tier an entry falls in for a given (already-normalized) query, or -1 for no
 *  match at all. Lower is better; ties keep the directory's own (sector, then listed) order. */
function tierOf(entry: TickerEntry, upperQuery: string, lowerQuery: string): number {
  const symbolUpper = entry.symbol.toUpperCase();
  if (symbolUpper === upperQuery) return 0;
  if (symbolUpper.startsWith(upperQuery)) return 1;
  const nameLower = entry.name.toLowerCase();
  if (nameLower.split(/\s+/).some((word) => word.startsWith(lowerQuery))) return 2;
  if (nameLower.includes(lowerQuery)) return 3;
  return -1;
}

/**
 * Rank the directory against a member's in-progress query for the Symbol field's suggestion list.
 * Pure — no I/O, safe to call on every keystroke. Empty/whitespace query returns no suggestions
 * (there is nothing to rank yet); everything else ranks by, in order: (1) exact symbol match,
 * (2) symbol prefix, (3) a word in the company name starts with the query, (4) the company name
 * contains the query anywhere. Ties keep the directory's own listed order (stable), and a symbol
 * never appears twice in the result even if it could match more than one tier's rule.
 */
export function searchTickers(query: string, limit = 8): TickerEntry[] {
  const trimmed = query.trim();
  if (trimmed === "") return [];
  const upperQuery = trimmed.toUpperCase();
  const lowerQuery = trimmed.toLowerCase();

  const tiers: TickerEntry[][] = [[], [], [], []];
  for (const entry of TICKER_DIRECTORY) {
    const tier = tierOf(entry, upperQuery, lowerQuery);
    if (tier >= 0) tiers[tier]?.push(entry);
  }

  return tiers.flat().slice(0, limit);
}
